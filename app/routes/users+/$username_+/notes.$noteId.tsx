import {
	type ActionFunctionArgs,
	json,
	type LoaderFunctionArgs,
	type MetaFunction,
	redirect,
} from '@remix-run/node'
import { Form, Link, useLoaderData } from '@remix-run/react'
// 🐨 get the db utility using:
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { floatingToolbarClassName } from '#app/components/floating-toolbar.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { db } from '#app/utils/db.server.ts'
import { invariantResponse } from '#app/utils/misc.tsx'
import { type loader as notesLoader } from './notes.tsx'

export async function loader({ params }: LoaderFunctionArgs) {
	const { noteId } = params
	const note = db.note.findFirst({
		where: {
			id: { equals: noteId },
		},
	})

	invariantResponse(note, 'Note not found', { status: 404 })

	return json({
		note: { title: note.title, content: note.content },
	})
}

export async function action({ request, params }: ActionFunctionArgs) {
	const formData = await request.formData()
	const intent = formData.get('intent')

	invariantResponse(intent === 'delete', 'Invalid intent')

	db.note.delete({ where: { id: { equals: params.noteId } } })

	// Redirect after deletion
	return redirect(`/users/${params.username}/notes`)
}

export default function NoteRoute() {
	const data = useLoaderData<typeof loader>()

	return (
		<div className="absolute inset-0 flex flex-col px-10">
			<h2 className="mb-2 pt-12 text-h2 lg:mb-6">{data.note?.title}</h2>
			<div className="overflow-y-auto pb-24">
				<p className="whitespace-break-spaces text-sm md:text-lg">
					{data.note?.content}
				</p>
			</div>
			<div className={floatingToolbarClassName}>
				<Form method="POST">
					<Button
						type="submit"
						variant="destructive"
						name="intent"
						value="delete"
					>
						Delete
					</Button>
				</Form>
				<Button asChild>
					<Link to="edit">Edit</Link>
				</Button>
			</div>
		</div>
	)
}

export const meta: MetaFunction<
	typeof loader,
	{ 'routes/users+/$username_+/notes': typeof notesLoader }
> = ({ data, params, matches }) => {
	const noteMatch = matches.find(
		m => m.id === 'routes/users+/$username_+/notes',
	)

	const displayName = noteMatch?.data.owner.name ?? params.username
	const noteTitle = data?.note.title ?? 'Note'

	const noteContentsSummary =
		data && data.note.content.length > 100
			? data.note.content.slice(0, 97) + '...'
			: data?.note.content || 'No content'
	return [
		{ title: `${noteTitle} | ${displayName}'s Notes | Epic Notes ` },
		{
			name: 'description',
			content: noteContentsSummary,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => {
					return <p> No note with the id "{params.noteId}" exits</p>
				},
			}}
		/>
	)
}
