import {
	json,
	type MetaFunction,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { db } from '#app/utils/db.server.ts'
import { invariantResponse } from '#app/utils/misc.tsx'

export async function loader({ params }: LoaderFunctionArgs) {
	const { username } = params
	const user = db.user.findFirst({
		where: {
			username: { equals: username },
		},
	})

	// if (!user) {
	// 	throw new Response('User Not found', { status: 404 })
	// }

	invariantResponse(user, 'User not Found', { status: 404 })

	return json({
		user: {
			name: user.name,
			username: user.username,
		},
	})
}

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
	const displayName = data?.user.name ?? params.username

	return [
		{
			title: `${displayName} | Epic Notes`,
		},
		{
			name: 'description',
			content: `Checkout ${displayName} on Epic Notes`,
		},
	]
}

export default function ProfileRoute() {
	const data = useLoaderData<typeof loader>()
	return (
		<div className="container mb-48 mt-36 border-4 border-green-500 ">
			<h1 className="text-h1 ">{data.user.name ?? data.user?.username}</h1>
			<Link to="notes" className="underline" prefetch="intent">
				Notes
			</Link>
		</div>
	)
}
