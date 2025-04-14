import os from 'node:os'
import { cssBundleHref } from '@remix-run/css-bundle'
import {
	json,
	type MetaFunction,
	type LinksFunction,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import {
	Link,
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from '@remix-run/react'
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react'
import { HoneypotProvider } from 'remix-utils/honeypot/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { getEnv } from '#app/utils/env.server.ts'
import { honeypot } from '#app/utils/honeypot.server.ts'
import faviconAssetUrl from './assets/favicon.svg'

import { EpicShop } from './epicshop.tsx'

import fontStylestlesheetUrl from './styles/font.css'
import './styles/global.css'
import tailwindStylesheeturl from './styles/tailwind.css'
import { csrf } from './utils/csrf.server.ts'

console.log(faviconAssetUrl)
export function links(): ReturnType<LinksFunction> {
	return [
		{
			rel: 'icon',
			type: 'image/svg+xml',
			href: faviconAssetUrl,
		},
		{
			rel: 'stylesheet',
			href: fontStylestlesheetUrl,
		},
		{
			rel: 'stylesheet',
			href: tailwindStylesheeturl,
		},

		...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
	]
}

export async function loader({ request }: LoaderFunctionArgs) {
	const honeyProps = honeypot.getInputProps()
	const [csrfToken, csrfCookieHeader] = await csrf.commitToken(request)
	return json(
		{ username: os.userInfo().username, ENV: getEnv(), honeyProps, csrfToken },
		{
			headers: csrfCookieHeader ? { 'set-cookie': csrfCookieHeader } : {},
		},
	)
}

function App() {
	const data = useLoaderData<typeof loader>()

	return (
		<Document>
			<header className="container mx-auto py-6">
				<nav className="flex justify-between">
					<Link to="/">
						<div className="font-light">epic</div>
						<div className="font-bold">notes</div>
					</Link>
				</nav>
			</header>

			<div className="flex-1">
				<Outlet />
			</div>

			<div className="container mx-auto flex justify-between">
				<Link to="/">
					<div className="font-light">epic</div>
					<div className="font-bold">notes</div>
				</Link>
				<p>Built with ♥️ by {data.username}</p>
			</div>
			<div className="h-5" />

			<script
				dangerouslySetInnerHTML={{
					__html: `window.ENV = ${JSON.stringify(data.ENV)}`,
				}}
			/>
		</Document>
	)
}

export function Document({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="h-full overflow-x-hidden">
			<head>
				<Meta />
				<Links />
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width.initial-scale=1" />

				{/* <link rel="icon" type="image/svg+xml" href="/favicon.svg" /> */}
			</head>
			<body className="flex h-full flex-col justify-between bg-background text-foreground">
				{children}
				<Scripts />
				{/* <KCDShop /> */}
				<EpicShop />
				<LiveReload />
				<ScrollRestoration />
			</body>
		</html>
	)
}

export default function AppWithProviders() {
	const data = useLoaderData<typeof loader>()

	return (
		<AuthenticityTokenProvider token={data.csrfToken}>
			<HoneypotProvider {...data.honeyProps}>
				<App />
			</HoneypotProvider>
		</AuthenticityTokenProvider>
	)
}

export const meta: MetaFunction = () => {
	return [
		{ title: 'Epic Notes' },
		{ name: 'description', content: "Your own captain's log" },
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
