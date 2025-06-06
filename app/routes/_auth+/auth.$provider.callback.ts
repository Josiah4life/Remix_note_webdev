import { redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { handleNewSession } from '#app/routes/_auth+/login.tsx'
import {
	authenticator,
	getSessionExpirationDate,
	getUserId,
} from '#app/utils/auth.server.ts'
import { ProviderNameSchema, providerLabels } from '#app/utils/connections.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { combineHeaders, combineResponseInits } from '#app/utils/misc.tsx'
import {
	destroyRedirectToHeader,
	getRedirectCookieValue,
} from '#app/utils/redirect-cookie.server.ts'
import {
	createToastHeaders,
	redirectWithToast,
} from '#app/utils/toast.server.ts'
import { verifySessionStorage } from '#app/utils/verification.server.ts'
import {
	onboardingEmailSessionKey,
	prefilledProfileKey,
	providerIdKey,
} from './onboarding_.$provider.tsx'

/* This checks for various decision: 
1. IF we have existingConnection which means if the provider has already been connected to our db. Then we proceed to check
if the connection userid is the same with our userid then we know that it has already being linked to an accoumt.

2. We checked if We have a connection in our db but no userId this means the provider is already connected to our db but no user is logged in
Then we try to log then in creating a session for them.

3. And by default if no connection at all and no UserId also then we know that this account is pretty new account then we redirect to onboarding after setting neccessary cookies that'll be needed

*/
const destroyRedirectTo = { 'set-cookie': destroyRedirectToHeader }

export async function loader({ request, params }: LoaderFunctionArgs) {
	const providerName = ProviderNameSchema.parse(params.provider)
	const label = providerLabels[providerName]
	const redirectTo = getRedirectCookieValue(request)

	const profile = await authenticator
		.authenticate(providerName, request, { throwOnError: true })
		.catch(async error => {
			console.error(error)
			const loginRedirect = [
				'/login',
				redirectTo ? new URLSearchParams({ redirectTo }) : null,
			]
				.filter(Boolean)
				.join('?')
			throw await redirectWithToast(
				loginRedirect,
				{
					type: 'error',
					title: 'Auth Failed',
					description: `There was an error authenticating with ${label}.`,
				},
				{ headers: destroyRedirectTo },
			)
		})

	console.log(profile)
	const existingConnection = await prisma.connection.findUnique({
		select: { userId: true },
		where: {
			providerName_providerId: { providerName, providerId: profile.id },
		},
	})

	const userId = await getUserId(request)

	if (existingConnection && userId) {
		throw await redirectWithToast('/settings/profile/connections', {
			title: 'Already Connected',
			description:
				existingConnection.userId === userId
					? `Your "${profile.username}" ${label} account is already connected.`
					: `The "${profile.username}" ${label} account is already connected to another account.`,
		})
	}

	// If we're already logged in, then link the account
	if (userId) {
		await prisma.connection.create({
			data: { providerName, providerId: profile.id, userId },
		})
		throw await redirectWithToast(
			'/settings/profile/connections',
			{
				title: 'Connected',
				type: 'success',
				description: `Your "${profile.username}" ${label} account has been connected.`,
			},
			{ headers: destroyRedirectTo },
		)
	}

	// Connection exists already? Make a new session
	if (existingConnection) {
		return makeSession({
			request,
			userId: existingConnection.userId,
			redirectTo,
		})
	}

	// if the email matches a user in the db, then link the account and
	// make a new session
	const user = await prisma.user.findUnique({
		select: { id: true },
		where: { email: profile.email.toLowerCase() },
	})
	if (user) {
		await prisma.connection.create({
			data: { providerName, providerId: profile.id, userId: user.id },
		})
		return makeSession(
			{
				request,
				userId: user.id,
				// send them to the connections page to see their new connection
				redirectTo: redirectTo ?? '/settings/profile/connections',
			},
			{
				headers: await createToastHeaders({
					title: 'Connected',
					description: `Your "${profile.username}" ${label} account has been connected.`,
				}),
			},
		)
	}

	// this is a new user, so let's get them onboarded
	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie'),
	)
	verifySession.set(onboardingEmailSessionKey, profile.email)
	verifySession.set(prefilledProfileKey, {
		...profile,
		username: profile.username
			?.replace(/[^a-zA-Z0-9_]/g, '_')
			.toLowerCase()
			.slice(0, 20)
			.padEnd(3, '_'),
	})
	verifySession.set(providerIdKey, profile.id)
	const onboardingRedirect = [
		`/onboarding/${providerName}`,
		redirectTo ? new URLSearchParams({ redirectTo }) : null,
	]
		.filter(Boolean)
		.join('?')
	return redirect(onboardingRedirect, {
		headers: combineHeaders(
			{ 'set-cookie': await verifySessionStorage.commitSession(verifySession) },
			destroyRedirectTo,
		),
	})
}

async function makeSession(
	{
		request,
		userId,
		redirectTo,
	}: { request: Request; userId: string; redirectTo?: string | null },
	responseInit?: ResponseInit,
) {
	redirectTo ??= '/'
	const session = await prisma.session.create({
		select: { id: true, expirationDate: true, userId: true },
		data: {
			expirationDate: getSessionExpirationDate(),
			userId,
		},
	})
	return handleNewSession(
		{ request, session, redirectTo, remember: true },
		combineResponseInits({ headers: destroyRedirectTo }, responseInit),
	)
}
