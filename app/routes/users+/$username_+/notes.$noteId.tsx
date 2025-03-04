import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
// 🐨 get the db utility using:
import { floatingToolbarClassName } from '#app/components/floating-toolbar.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { db } from '#app/utils/db.server.ts'

export async function loader({ params }: LoaderFunctionArgs) {
	const { noteId } = params
	const note = db.note.findFirst({
		where: {
			id: { equals: noteId },
		},
	})

	return json({ note })
}

export default function NoteRoute() {
	const data = useLoaderData<typeof loader>()
	return (
		<div className="absolute inset-0 flex flex-col px-10">
			<h2 className="mb-2 pt-12 text-h2 lg:mb-6">
				{data.note?.title} (🐨 replace this with the title)
			</h2>
			<div className="overflow-y-auto pb-24">
				<p className="whitespace-break-spaces text-sm md:text-lg">
					{data.note?.content}
				</p>
			</div>
			<div className={floatingToolbarClassName}>
				<Button variant="destructive">Delete</Button>
				<Button asChild>
					<Link to="edit">Edit</Link>
				</Button>
			</div>
		</div>
	)
}
