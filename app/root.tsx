import os from 'node:os'
import { useForm } from '@conform-to/react'
import { parse } from '@conform-to/zod'
import { cssBundleHref } from '@remix-run/css-bundle'
import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type LinksFunction,
} from '@remix-run/node'
import {
	Link,
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useFetcher,
	useFetchers,
	useLoaderData,
	useMatches,
	type MetaFunction,
} from '@remix-run/react'

import { useEffect } from 'react'
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react'
import { HoneypotProvider } from 'remix-utils/honeypot/react'
import { Toaster, toast as showToast } from 'sonner'
import { z } from 'zod'
import { getUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { userHasRole } from '#app/utils/permissions.ts'
import { getTheme, setTheme } from '#app/utils/ThemeServer.ts'
import { getToast } from '#app/utils/toast.server.ts'
import { useOptionalUser } from '#app/utils/user.ts'
import faviconAssetUrl from './assets/favicon.svg'
import { GeneralErrorBoundary } from './components/error-boundary.tsx'
import { ErrorList } from './components/forms.tsx'
import { SearchBar } from './components/search-bar.tsx'
import { Spacer } from './components/spacer.tsx'

import { Button } from './components/ui/button.tsx'

import { Icon } from './components/ui/icon.tsx'

import { EpicShop } from './epicshop.tsx'

import fontStylestylesheetUrl from './styles/font.css'
import tailwindStylesheetUrl from './styles/tailwind.css'

import { csrf } from './utils/csrf.server.ts'
import { getEnv } from './utils/env.server.ts'
import { honeypot } from './utils/honeypot.server.ts'
import {
	combineHeaders,
	getUserImgSrc,
	invariantResponse,
} from './utils/misc.tsx'

import { type Theme } from './utils/theme.server.ts'

export const links: LinksFunction = () => {
	return [
		{ rel: 'icon', type: 'image/svg+xml', href: faviconAssetUrl },
		{ rel: 'stylesheet', href: fontStylestylesheetUrl },
		{ rel: 'stylesheet', href: tailwindStylesheetUrl },
		cssBundleHref ? { rel: 'stylesheet', href: cssBundleHref } : null,
	].filter(Boolean)
}

export async function loader({ request }: LoaderFunctionArgs) {
	const [csrfToken, csrfCookieHeader] = await csrf.commitToken(request)
	const honeyProps = honeypot.getInputProps()
	const { toast, headers: toastHeaders } = await getToast(request)
	const userId = await getUserId(request)
	const user = userId
		? await prisma.user.findUniqueOrThrow({
				select: {
					id: true,
					name: true,
					username: true,
					image: { select: { id: true } },
					roles: {
						select: {
							name: true,
							permissions: {
								select: {
									action: true,
									entity: true,
									access: true,
								},
							},
						},
					},
				},
				where: { id: userId },
			})
		: null

	return json(
		{
			user,
			username: os.userInfo().username,
			theme: getTheme(request),
			toast,
			ENV: getEnv(),
			csrfToken,
			honeyProps,
		},
		{
			headers: combineHeaders(
				csrfCookieHeader ? { 'set-cookie': csrfCookieHeader } : null,
				toastHeaders,
			),
		},
	)
}

const ThemeFormSchema = z.object({
	theme: z.enum(['light', 'dark']),
})

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()
	invariantResponse(
		formData.get('intent') === 'update-theme',
		'Invalid intent',
		{ status: 400 },
	)
	const submission = parse(formData, {
		schema: ThemeFormSchema,
	})
	if (submission.intent !== 'submit') {
		return json({ status: 'success', submission } as const)
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	const { theme } = submission.value

	// we'll do stuff with the submission next...
	const responseInit = {
		headers: { 'set-cookie': setTheme(theme) },
	}
	return json({ success: true, submission }, responseInit)
}

// function LogoutTimer() {
// 	const [status, setStatus] = useState<'idle' | 'show-modal'>('idle')
// 	const location = useLocation()
// 	const submit = useSubmit()
// 	const logoutTime = 5000
// 	const modalTime = 2000
// 	// const logoutTime = 1000 * 60 * 60 * 24;
// 	// const modalTime = logoutTime - 1000 * 60 * 2;
// 	const modalTimer = useRef<ReturnType<typeof setTimeout>>()
// 	const logoutTimer = useRef<ReturnType<typeof setTimeout>>()

// 	const logout = useCallback(() => {
// 		submit(null, { method: 'POST', action: '/logout' })
// 	}, [submit])

// 	const cleanupTimers = useCallback(() => {
// 		clearTimeout(modalTimer.current)
// 		clearTimeout(logoutTimer.current)
// 	}, [])

// 	const resetTimers = useCallback(() => {
// 		cleanupTimers()
// 		modalTimer.current = setTimeout(() => {
// 			setStatus('show-modal')
// 		}, modalTime)
// 		logoutTimer.current = setTimeout(logout, logoutTime)
// 	}, [cleanupTimers, logout, logoutTime, modalTime])

// 	useEffect(() => resetTimers(), [resetTimers, location.key])
// 	useEffect(() => cleanupTimers, [cleanupTimers])

// 	function closeModal() {
// 		setStatus('idle')
// 		resetTimers()
// 	}

// 	return (
// 		<AlertDialog
// 			aria-label="Pending Logout Notification"
// 			open={status === 'show-modal'}
// 		>
// 			<AlertDialogContent>
// 				<AlertDialogHeader>
// 					<AlertDialogTitle>Are you still there?</AlertDialogTitle>
// 				</AlertDialogHeader>
// 				<AlertDialogDescription>
// 					You are going to be logged out due to inactivity. Close this modal to
// 					stay logged in.
// 				</AlertDialogDescription>
// 				<AlertDialogFooter className="flex items-end gap-8">
// 					<AlertDialogCancel onClick={closeModal}>
// 						Remain Logged In
// 					</AlertDialogCancel>
// 					<Form method="POST" action="/logout">
// 						<AlertDialogAction type="submit">Logout</AlertDialogAction>
// 					</Form>
// 				</AlertDialogFooter>
// 			</AlertDialogContent>
// 		</AlertDialog>
// 	)
// }

function Document({
	children,
	theme,
	env,
	// isLoggedIn = false,
}: {
	children: React.ReactNode
	theme?: Theme
	isLoggedIn?: boolean
	env?: Record<string, string>
}) {
	return (
		<html lang="en" className={`${theme} h-full overflow-x-hidden`}>
			<head>
				<Meta />
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				<Links />
			</head>
			<body className="flex h-full flex-col justify-between bg-background text-foreground">
				{children}
				<script
					dangerouslySetInnerHTML={{
						__html: `window.ENV = ${JSON.stringify(env)}`,
					}}
				/>
				{/* {isLoggedIn ? <LogoutTimer /> : null} */}
				<Toaster closeButton position="top-center" />
				<ScrollRestoration />
				<Scripts />
				<EpicShop />
				<LiveReload />
			</body>
		</html>
	)
}

function App() {
	const data = useLoaderData<typeof loader>()
	const theme = useTheme()
	const matches = useMatches()
	const user = useOptionalUser()
	const isOnSearchPage = matches.find(m => m.id === 'routes/users+/index')
	const userIsAdmin = userHasRole(user, 'admin')
	return (
		<Document isLoggedIn={Boolean(user)} theme={theme} env={data.ENV}>
			<header className="container px-6 py-4 sm:px-8 sm:py-6">
				<nav className="flex items-center justify-between gap-4 sm:gap-6">
					<Link to="/">
						<div className="font-light">epic</div>
						<div className="font-bold">notes</div>
					</Link>
					{isOnSearchPage ? null : (
						<div className="ml-auto max-w-sm flex-1">
							<SearchBar status="idle" />
						</div>
					)}

					<div className="flex items-center gap-10">
						{user ? (
							<div className="flex items-center gap-2">
								<Button asChild variant="secondary">
									<Link
										to={`/users/${user.username}`}
										className="flex items-center gap-2"
									>
										<img
											className="h-8 w-8 rounded-full object-cover"
											alt={user.name ?? user.username}
											src={getUserImgSrc(user.image?.id)}
										/>
										<span className="hidden text-body-sm font-bold sm:block">
											{user.name ?? user.username}
										</span>
									</Link>
								</Button>
								{userIsAdmin ? (
									<Button asChild variant="secondary">
										<Link to="/admin">
											<Icon name="backpack">
												<span className="hidden sm:block">Admin</span>
											</Icon>
										</Link>
									</Button>
								) : null}
							</div>
						) : (
							<Button asChild variant="default" size="sm">
								<Link to="/login">Log In</Link>
							</Button>
						)}
					</div>
				</nav>
			</header>

			<div className="flex-1">
				<Outlet />
			</div>

			<div className="container flex justify-between">
				<Link to="/">
					<div className="font-light">epic</div>
					<div className="font-bold">notes</div>
				</Link>
				<div className="flex items-center gap-2">
					<p>Built with ♥️ by {data.username}</p>
					<ThemeSwitch userPreference={theme} />
				</div>
			</div>
			<Spacer size="3xs" />
			{data.toast ? <ShowToast toast={data.toast} /> : null}
		</Document>
	)
}

function ShowToast({ toast }: { toast: any }) {
	const { id, type, title, description } = toast as {
		id: string
		type: 'success' | 'message'
		title: string
		description: string
	}
	useEffect(() => {
		setTimeout(() => {
			showToast[type](title, { id, description })
		}, 0)
	}, [description, id, title, type])
	return null
}

export default function AppWithProviders() {
	const data = useLoaderData<typeof loader>()
	return (
		<HoneypotProvider {...data.honeyProps}>
			<AuthenticityTokenProvider token={data.csrfToken}>
				<App />
			</AuthenticityTokenProvider>
		</HoneypotProvider>
	)
}

function useTheme() {
	const data = useLoaderData<typeof loader>()
	const fetchers = useFetchers()
	const themeFetcher = fetchers.find(
		fetcher => fetcher.formData?.get('intent') === 'update-theme',
	)
	const optimisticTheme = themeFetcher?.formData?.get('theme')
	if (optimisticTheme === 'light' || optimisticTheme === 'dark') {
		return optimisticTheme
	}
	return data.theme
}

function ThemeSwitch({ userPreference }: { userPreference?: Theme }) {
	const fetcher = useFetcher<typeof action>()

	const [form] = useForm({
		id: 'theme-switch',
		lastSubmission: fetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: ThemeFormSchema })
		},
	})

	const mode = userPreference ?? 'light'
	const nextMode = mode === 'light' ? 'dark' : 'light'
	const modeLabel = {
		light: (
			<Icon name="sun">
				<span className="sr-only">Light</span>
			</Icon>
		),
		dark: (
			<Icon name="moon">
				<span className="sr-only">Dark</span>
			</Icon>
		),
	}

	return (
		<fetcher.Form method="POST" {...form.props}>
			<input type="hidden" name="theme" value={nextMode} />
			<div className="flex gap-2">
				<button
					name="intent"
					value="update-theme"
					type="submit"
					className="flex h-8 w-8 cursor-pointer items-center justify-center"
				>
					{modeLabel[mode]}
				</button>
			</div>
			<ErrorList errors={form.errors} id={form.errorId} />
		</fetcher.Form>
	)
}

export const meta: MetaFunction = () => {
	return [
		{ title: 'Epic Notes' },
		{ name: 'description', content: `Your own captain's log` },
	]
}

export function ErrorBoundary() {
	return (
		<Document>
			<div className="flex-1">
				<GeneralErrorBoundary />
			</div>
		</Document>
	)
}
