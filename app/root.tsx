import { cssBundleHref } from '@remix-run/css-bundle'
import { type LinksFunction } from '@remix-run/node'
import { Link, Links, LiveReload, Outlet, Scripts } from '@remix-run/react'
import faviconAssetUrl from './assets/favicon.svg'

import { EpicShop } from './epicshop.tsx'

import fontStylestlesheetUrl from './styles/font.css'
import './styles/global.css'
import tailwindStylesheeturl from './styles/tailwind.css'
// 🐨 export a links function here that adds the favicon
// 💰 It should have the following properties:
// - rel: 'icon'
// - type: 'image/svg+xml'
// - href: '/favicon.svg'

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

// export const links: LinksFunction = () => {
// 	return [
// 		{
// 			rel: 'icon',
// 			type: 'image/svg+xml',
// 			href: faviconAssetUrl,
// 		},
// 		{
// 			rel: 'stylesheet',
// 			href: fontStylestlesheetUrl,
// 		},
// 		{
// 			rel: 'stylesheet',
// 			href: tailwindStylesheeturl,
// 		},
// 	]
// }

export default function App() {
	return (
		<html lang="en" className="h-full overflow-x-hidden">
			<head>
				<Links />
				{/* <link rel="icon" type="image/svg+xml" href="/favicon.svg" /> */}
			</head>
			<body className="flex h-full flex-col justify-between bg-background text-foreground">
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
					<p>Built with ♥️ by Josiah</p>
				</div>
				<div className="h-5" />
				<Scripts />
				<EpicShop />
				<LiveReload />
			</body>
		</html>
	)
}
