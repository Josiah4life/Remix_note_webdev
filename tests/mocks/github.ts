import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { faker } from '@faker-js/faker'
import fsExtra from 'fs-extra'
import { HttpResponse, passthrough, http, type HttpHandler } from 'msw'

const { json } = HttpResponse

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const here = (...s: Array<string>) => path.join(__dirname, ...s)

/*
This creates a path like:  tests/fixtures/github/users.0.local.json.. 
This file stores mock Github users during tests.
Ensures the directory exists before writing.
*/
const githubUserFixturePath = path.join(
	here(
		'..',
		'fixtures',
		'github',
		`users.${process.env.VITEST_POOL_ID || 0}.local.json`,
	),
)

await fsExtra.ensureDir(path.dirname(githubUserFixturePath))

/*
This creates fakes email objects, one of which is marked primary, Generate an accessToken, profile and email list
*/
function createGitHubUser(
	code?: string | null,
	{ primaryEmailAddress }: { primaryEmailAddress?: string } = {},
) {
	const createEmail = () => ({
		email: faker.internet.email(),
		verified: faker.datatype.boolean(),
		primary: false, // <-- can only have one of these
		visibility: faker.helpers.arrayElement(['public', null]),
	})
	const primaryEmail = {
		...createEmail(),
		verified: true,
		primary: true,
		email: primaryEmailAddress ?? faker.internet.email(),
	}

	const emails = [
		{
			email: faker.internet.email(),
			verified: false,
			primary: false,
			visibility: 'public',
		},
		{
			email: faker.internet.email(),
			verified: true,
			primary: false,
			visibility: null,
		},
		primaryEmail,
	]

	code ??= faker.string.uuid()
	return {
		code,
		accessToken: `${code}_mock_access_token`,
		profile: {
			login: faker.internet.userName(),
			id: `${code}_profile_id`,
			name: faker.person.fullName(),
			avatar_url: 'https://github.com/ghost.png',
			emails: emails.map(e => e.email),
		},
		emails,
		primaryEmail: primaryEmail.email,
	}
}

type GitHubUser = ReturnType<typeof createGitHubUser>

async function getGitHubUsers() {
	try {
		if (await fsExtra.pathExists(githubUserFixturePath)) {
			const json = await fsExtra.readJson(githubUserFixturePath)
			return json as Array<GitHubUser>
		}
		return []
	} catch (error) {
		console.error(error)
		return []
	}
}

export async function deleteGitHubUsers() {
	await fsExtra.remove(githubUserFixturePath)
}

async function setGitHubUsers(users: Array<GitHubUser>) {
	await fsExtra.writeJson(githubUserFixturePath, users, { spaces: 2 })
}

/**/
/*
Checks if a user with the given code exists, if so updates it else creates it and save updated list to disk.
*/
export async function insertGitHubUser(
	code?: string | null,
	{ primaryEmailAddress }: { primaryEmailAddress?: string } = {},
) {
	const githubUsers = await getGitHubUsers()
	let user = githubUsers.find(u => u.code === code)
	if (user) {
		Object.assign(user, createGitHubUser(code, { primaryEmailAddress }))
	} else {
		user = createGitHubUser(code)
		githubUsers.push(user)
	}
	await setGitHubUsers(githubUsers)
	return user
}

/*
Extracts the Bearer token from the Authorization header (token ${accessToken}).
Finds the matching GitHub user.
Returns 401 if missing or 404 if not found.
*/
async function getUser(request: Request) {
	const accessToken = request.headers
		.get('authorization')
		?.slice('token '.length)

	if (!accessToken) {
		return new Response('Unauthorized', { status: 401 })
	}
	const user = (await getGitHubUsers()).find(u => u.accessToken === accessToken)

	if (!user) {
		return new Response('Not Found', { status: 404 })
	}
	return user
}

/*
If not using mock credentials, MSW should not intercept requests and instead let them go to the real GitHub API.
Otherwise, MSW intercepts them and uses handlers.
*/
const passthroughGitHub =
	!process.env.GITHUB_CLIENT_ID.startsWith('MOCK_') && !process.env.TESTING
export const handlers: Array<HttpHandler> = [
	// test this github stuff out without going through github's oauth flow by
	// going to http://localhost:3000/auth/github/callback?code=MOCK_GITHUB_CODE_KODY&state=MOCK_STATE

	/*
	Mimics Github's token exchange step returns the access_token using the code query parmas
	*/
	http.post(
		'https://github.com/login/oauth/access_token',
		async ({ request }) => {
			if (passthroughGitHub) return passthrough()
			const params = new URLSearchParams(await request.text())

			const code = params.get('code')
			const githubUsers = await getGitHubUsers()
			let user = githubUsers.find(u => u.code === code)
			if (!user) {
				user = await insertGitHubUser(code)
			}

			return new Response(
				new URLSearchParams({
					access_token: user.accessToken,
					token_type: '__MOCK_TOKEN_TYPE__',
				}).toString(),
				{ headers: { 'content-type': 'application/x-www-form-urlencoded' } },
			)
		},
	),

	/*
		Returns the mock user's email list
	*/
	http.get('https://api.github.com/user/emails', async ({ request }) => {
		if (passthroughGitHub) return passthrough()

		const user = await getUser(request)
		if (user instanceof Response) return user

		return json(user.emails)
	}),

	/*
	Returns profile data for a specific user by GitHub id
	*/
	http.get('https://api.github.com/user/:id', async ({ params }) => {
		if (passthroughGitHub) return passthrough()

		const mockUser = (await getGitHubUsers()).find(
			u => u.profile.id === params.id,
		)
		if (mockUser) return json(mockUser.profile)

		return new Response('Not Found', { status: 404 })
	}),

	/*
		Returns the currently "logged in" mock users profile
	*/
	http.get('https://api.github.com/user', async ({ request }) => {
		if (passthroughGitHub) return passthrough()

		const user = await getUser(request)
		if (user instanceof Response) return user

		return json(user.profile)
	}),

	/*
	Returns local JPG to replace the Github default ghost avatar
	*/
	http.get('https://github.com/ghost.png', async () => {
		if (passthroughGitHub) return passthrough()

		const buffer = await fsExtra.readFile('./tests/fixtures/github/ghost.jpg')
		return new Response(buffer, {
			// the .png is not a mistake even though it looks like it... It's really a jpg
			// but the ghost image URL really has a png extension 😅
			headers: { 'content-type': 'image/jpg' },
		})
	}),
]
