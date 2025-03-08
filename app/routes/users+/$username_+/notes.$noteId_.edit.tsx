import {
	type ActionFunctionArgs,
	json,
	type LoaderFunctionArgs,
	redirect,
} from '@remix-run/node'
import {
	Form,
	useFormAction,
	useLoaderData,
	useNavigation,
} from '@remix-run/react'
import { floatingToolbarClassName } from '#app/components/floating-toolbar.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { Label } from '#app/components/ui/label.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { db } from '#app/utils/db.server.ts'
import { invariantResponse } from '#app/utils/misc.tsx'

export async function loader({ params }: LoaderFunctionArgs) {
	const note = db.note.findFirst({
		where: {
			id: {
				equals: params.noteId,
			},
		},
	})

	invariantResponse(note, 'Note not found', { status: 404 })

	return json({
		note: {
			title: note.title,
			contetnt: note.content,
		},
	})
}

export async function action({ params, request }: ActionFunctionArgs) {
	const formData = await request.formData()
	const title = formData.get('title')
	const content = formData.get('content')

	invariantResponse(typeof title === 'string', 'Title must be a string', {
		status: 400,
	})
	invariantResponse(typeof content === 'string', 'Content must be a string', {
		status: 400,
	})

	db.note.update({
		where: {
			id: {
				equals: params.noteId,
			},
		},

		data: {
			title,
			content,
		},
	})

	// return redirect(`..`)
	return redirect(`/users/${params.username}/notes/${params.noteId}`)
	// return redirect(`/notes/${params.noteId}`)
}

export default function NoteEdit() {
	const data = useLoaderData<typeof loader>()
	const navigation = useNavigation()
	const formAction = useFormAction()

	const isPending =
		navigation.state !== 'idle' &&
		navigation.formAction === formAction &&
		navigation.formMethod === 'POST'

	return (
		<Form
			method="POST"
			className="flex h-full flex-col gap-y-4 overflow-x-hidden px-10 pb-28 pt-12"
		>
			<div className="flex flex-col gap-1">
				<div>
					<Label>Title</Label>
					<Input name="title" defaultValue={data.note.title} />
				</div>
				<div>
					<Label>Content</Label>
					<Input name="content" defaultValue={data.note.contetnt} />
				</div>
			</div>
			<div className={floatingToolbarClassName}>
				<Button variant="destructive">Reset</Button>
				<StatusButton
					type="submit"
					disabled={isPending}
					status={isPending ? 'pending' : 'idle'}
				>
					Submit
				</StatusButton>
			</div>
		</Form>
	)
}
