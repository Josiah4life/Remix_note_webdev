import {
	type ActionFunctionArgs,
	json,
	type LoaderFunctionArgs,
	redirect,
} from '@remix-run/node'
import {
	Form,
	useActionData,
	useFormAction,
	useLoaderData,
	useNavigation,
} from '@remix-run/react'
import { useEffect, useState } from 'react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
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
			content: note.content,
		},
	})
}

const titleMaxLength = 100
const contentMaxLength = 10000
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

	const errors = {
		formErrors: [] as Array<string>,
		fieldErrors: {
			title: [] as Array<string>,
			content: [] as Array<string>,
		},
	}

	if (title === '') {
		errors.fieldErrors.title.push('Title is required')
	}

	if (title.length > titleMaxLength) {
		errors.fieldErrors.title.push(
			`Title must be ${titleMaxLength} characters or less`,
		)
	}
	if (content === '') {
		errors.fieldErrors.title.push('Title is required')
	}

	if (content.length > contentMaxLength) {
		errors.fieldErrors.title.push(
			`Content must be ${contentMaxLength} characters or less`,
		)
	}

	const hasErrors =
		errors.formErrors.length > 0 ||
		Object.values(errors.fieldErrors).some(
			fieldErrors => fieldErrors.length > 0,
		)

	// if (hasErrors) {
	// 	return json({errors}, {
	// 		status: 400,
	// 	})
	// }

	if (hasErrors) {
		return json({ status: 'error', errors } as const, {
			status: 400,
		})
	}

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

function ErrorList({ errors }: { errors?: Array<string> | null }) {
	return errors?.length ? (
		<ul className="flex flex-col gap-1">
			{errors.map((error, i) => (
				<li key={i} className="text-[10px] text-foreground">
					{error}
				</li>
			))}
		</ul>
	) : null
}

function useHydrated() {
	const [hydrated, setHydrated] = useState(false)
	useEffect(() => setHydrated(true), [])
	return hydrated
}

export default function NoteEdit() {
	const data = useLoaderData<typeof loader>()

	const actionData = useActionData<typeof action>()
	const navigation = useNavigation()
	const formAction = useFormAction()

	const isPending =
		navigation.state !== 'idle' &&
		navigation.formAction === formAction &&
		navigation.formMethod === 'POST'

	const fieldErrors =
		actionData?.status === 'error' ? actionData.errors.fieldErrors : null
	const formErrors =
		actionData?.status === 'error' ? actionData.errors.formErrors : null

	const isHydrated = useHydrated()

	return (
		<Form
			method="POST"
			className="flex h-full flex-col gap-y-4 overflow-x-hidden px-10 pb-28 pt-12"
			noValidate={isHydrated}
		>
			<div className="flex flex-col gap-1">
				<div>
					<Label>Title</Label>
					<Input
						name="title"
						defaultValue={data.note.title}
						required
						maxLength={titleMaxLength}
					/>
					<div className="min-h-[32px] px-4 pb-3 pt-1">
						<ErrorList errors={fieldErrors?.title} />
					</div>
				</div>
				<div>
					<Label>Content</Label>
					<Input
						name="content"
						defaultValue={data.note.content}
						required
						maxLength={contentMaxLength}
					/>
					<div className="min-h-[32px] px-4 pb-3 pt-1">
						<ErrorList errors={fieldErrors?.content} />
					</div>
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
			<ErrorList errors={formErrors} />
		</Form>
	)
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
