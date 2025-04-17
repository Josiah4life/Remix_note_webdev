// import {
// 	getFormProps,
// 	getInputProps,
// 	getTextareaProps,
// 	useForm,
// 	type FieldMetadata,
// 	getFieldsetProps,
// } from '@conform-to/react'
// import { getFieldsetConstraint, parse } from '@conform-to/zod'
// import { createId as cuid } from '@paralleldrive/cuid2'
// import {
// 	type ActionFunctionArgs,
// 	unstable_createMemoryUploadHandler as createMemoryUploadHandler,
// 	unstable_parseMultipartFormData as parseMultipartFormData,
// 	json,
// 	type LoaderFunctionArgs,
// 	redirect,
// } from '@remix-run/node'
// import {
// 	Form,
// 	useActionData,
// 	useFormAction,
// 	useLoaderData,
// 	useNavigation,
// } from '@remix-run/react'
// import { useRef, useState } from 'react'
// import { z } from 'zod'
// import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
// import { floatingToolbarClassName } from '#app/components/floating-toolbar.tsx'
// import { Button } from '#app/components/ui/button.tsx'
// import { Input } from '#app/components/ui/input.tsx'
// import { Label } from '#app/components/ui/label.tsx'
// import { StatusButton } from '#app/components/ui/status-button.tsx'
// import { Textarea } from '#app/components/ui/textarea.tsx'
// import { validateCSRF } from '#app/utils/csrf.server.ts'
// import { prisma } from '#app/utils/db.server.ts'
// import { cn, invariantResponse } from '#app/utils/misc.tsx'

// export async function loader({ params }: LoaderFunctionArgs) {
// 	const note = await prisma.note.findFirst({
// 		where: { id: params.noteId },
// 		select: {
// 			title: true,
// 			content: true,
// 			images: {
// 				select: { id: true, altText: true },
// 			},
// 		},
// 	})

// 	invariantResponse(note, 'Note not found', { status: 404 })

// 	return json({ note })
// }

// const titleMinLength = 1
// const titleMaxLength = 100
// const contentMinLength = 1
// const contentMaxLength = 10000

// const MAX_UPLOAD_SIZE = 1024 * 1024 * 3 // 3MB

// const ImageFieldsetSchema = z.object({
// 	id: z.string().optional(),
// 	file: z
// 		.instanceof(File)
// 		.optional()
// 		.refine(file => {
// 			return !file || file.size <= MAX_UPLOAD_SIZE
// 		}, 'File size must be less than 3MB'),
// 	altText: z.string().optional(),
// })

// type ImageFieldset = z.infer<typeof ImageFieldsetSchema>

// function imageHasFile(
// 	image: ImageFieldset,
// ): image is ImageFieldset & { file: NonNullable<ImageFieldset['file']> } {
// 	return Boolean(image.file?.size && image.file?.size > 0)
// }

// function imageHasId(
// 	image: ImageFieldset,
// ): image is ImageFieldset & { id: NonNullable<ImageFieldset['id']> } {
// 	return image.id != null
// }

// const NoteEditorSchema = z.object({
// 	title: z.string().min(titleMinLength).max(titleMaxLength),
// 	content: z.string().min(contentMinLength).max(contentMaxLength),
// 	images: z.array(ImageFieldsetSchema).max(5).optional(),
// })

// export async function action({ request, params }: ActionFunctionArgs) {
// 	invariantResponse(params.noteId, 'noteId param is required')

// 	const formData = await parseMultipartFormData(
// 		request,
// 		createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE }),
// 	)
// 	await validateCSRF(formData, request.headers)

// 	const submission = await parse(formData, {
// 		schema: NoteEditorSchema.transform(async ({ images = [], ...data }) => {
// 			return {
// 				...data,
// 				imageUpdates: await Promise.all(
// 					images.filter(imageHasId).map(async i => {
// 						if (imageHasFile(i)) {
// 							return {
// 								id: i.id,
// 								altText: i.altText,
// 								contentType: i.file.type,
// 								blob: Buffer.from(await i.file.arrayBuffer()),
// 							}
// 						} else {
// 							return { id: i.id, altText: i.altText }
// 						}
// 					}),
// 				),
// 				newImages: await Promise.all(
// 					images
// 						.filter(imageHasFile)
// 						.filter(i => !i.id)
// 						.map(async image => {
// 							return {
// 								altText: image.altText,
// 								contentType: image.file.type,
// 								blob: Buffer.from(await image.file.arrayBuffer()),
// 							}
// 						}),
// 				),
// 			}
// 		}),
// 		async: true,
// 	})

// 	if (submission.intent !== 'submit') {
// 		return json({ status: 'idle', submission } as const)
// 	}

// 	if (!submission.value) {
// 		return json({ status: 'error', submission } as const, { status: 400 })
// 	}

// 	const { title, content, imageUpdates = [], newImages = [] } = submission.value

// 	await prisma.note.update({
// 		select: { id: true },
// 		where: { id: params.noteId },
// 		data: { title, content },
// 	})

// 	await prisma.noteImage.deleteMany({
// 		where: {
// 			id: { notIn: imageUpdates.map(i => i.id) },
// 			noteId: params.noteId,
// 		},
// 	})

// 	for (const updates of imageUpdates) {
// 		await prisma.noteImage.update({
// 			select: { id: true },
// 			where: { id: updates.id },
// 			data: { ...updates, id: updates.blob ? cuid() : updates.id },
// 		})
// 	}

// 	for (const newImage of newImages) {
// 		await prisma.noteImage.create({
// 			select: { id: true },
// 			data: { ...newImage, noteId: params.noteId },
// 		})
// 	}

// 	return redirect(`/users/${params.username}/notes/${params.noteId}`)
// }

// function ErrorList({
// 	errors,
// 	id,
// }: {
// 	errors?: Array<string> | null
// 	id?: string
// }) {
// 	return errors?.length ? (
// 		<ul className="flex flex-col gap-1" id={id}>
// 			{errors.map((error, i) => (
// 				<li key={i} className="text-[10px] text-foreground">
// 					{error}
// 				</li>
// 			))}
// 		</ul>
// 	) : null
// }

// export default function NoteEdit() {
// 	const data = useLoaderData<typeof loader>()

// 	const actionData = useActionData<typeof action>()
// 	// const actionData = useActionData<typeof action>()
// 	const navigation = useNavigation()
// 	const formAction = useFormAction()

// 	const isPending =
// 		navigation.state !== 'idle' &&
// 		navigation.formAction === formAction &&
// 		navigation.formMethod === 'POST'

// 	const [form, field] = useForm({
// 		id: 'note-editor',
// 		constraint: getFieldsetConstraint(NoteEditorSchema), //Auto geneerate validation constraints  from Zod for client-side validation
// 		lastSubmission: actionData?.submission,
// 		onValidate({ formData }) {
// 			return parse(formData, { schema: NoteEditorSchema })
// 		}, //Ensures the data is parsed and validated by Zod.

// 		defaultValue: {
// 			title: data.note.title,
// 			content: data.note.content,
// 			images: data.note.images.length ? data.note.images : [{}],
// 		}, //Prefills the form with existing data from loader().
// 	})

// 	const imagelist = field.images.getFieldList()

// 	return (
// 		<div className="absolute inset-0">
// 			<Form
// 				method="POST"
// 				className="flex h-full flex-col gap-y-4 overflow-x-hidden px-10 pb-28 pt-12"
// 				{...getFormProps(form)}
// 				encType="multipart/form-data"
// 			>
// 				<button type="submit" className="hidden" />

// 				<div className="flex flex-col gap-1">
// 					<div>
// 						<Label htmlFor={field.title.id}>Title</Label>
// 						<Input
// 							autoFocus
// 							{...getInputProps(field.title, { type: 'text' })}
// 						/>
// 						<div className="min-h-[32px] px-4 pb-3 pt-1">
// 							<ErrorList id={field.title.errorId} errors={field.title.errors} />
// 						</div>
// 					</div>

// 					<div>
// 						<Label htmlFor={field.content.id}>Content</Label>
// 						<Textarea {...getTextareaProps(field.content)} />
// 						<div className="min-h-[32px] px-4 pb-3 pt-1">
// 							<ErrorList
// 								id={field.content.errorId}
// 								errors={field.content.errors}
// 							/>
// 						</div>
// 					</div>
// 				</div>

// 				<div>
// 					<Label>Image</Label>
// 					<ul className="flex flex-col gap-1">
// 						{imagelist.map((image, index) => (
// 							<li
// 								key={image.key}
// 								className="relative border-b-2 border-muted-foreground"
// 							>
// 								<button
// 									type="button"
// 									className="text-foreground-destructive absolute right-0 top-0"
// 									onClick={() =>
// 										form.remove({ name: field.images.name, index })
// 									}
// 								>
// 									<span aria-hidden>❌</span>
// 									<span className="sr-only">Remove Image {index + 1}</span>
// 								</button>
// 								<ImageChooser config={image} />
// 							</li>
// 						))}
// 					</ul>
// 					{/* <ImageChooser /> */}
// 				</div>

// 				<Button
// 					className="mt-3"
// 					{...form.insert.getButtonProps({
// 						name: field.images.name,
// 						defaultValue: {},
// 					})}
// 				>
// 					<span aria-hidden>➕ Image</span>{' '}
// 					<span className="sr-only">Add image</span>
// 				</Button>
// 				<div className={floatingToolbarClassName}>
// 					<Button form={form.id} variant="destructive">
// 						Reset
// 					</Button>
// 					<StatusButton
// 						form={form.id}
// 						type="submit"
// 						disabled={isPending}
// 						status={isPending ? 'pending' : 'idle'}
// 					>
// 						Submit
// 					</StatusButton>
// 				</div>
// 				<ErrorList id={form.errorId} errors={form.errors} />
// 			</Form>
// 		</div>
// 	)
// }

// function ImageChooser({
// 	config,
// }: {
// 	config: FieldMetadata<z.infer<typeof ImageFieldsetSchema>>
// }) {
// 	const ref = useRef<HTMLFieldSetElement>(null)
// 	const fields = config.getFieldset()
// 	const existingImage = Boolean(fields.id.initialValue)
// 	const [previewImage, setPreviewImage] = useState<string | null>(
// 		existingImage ? `/resources/images/${fields.id.initialValue}` : null,
// 	)
// 	const [altText, setAltText] = useState(fields.altText.initialValue ?? '')

// 	return (
// 		<fieldset ref={ref} {...getFieldsetProps(config)}>
// 			<div className="flex gap-3">
// 				<div className="w-32">
// 					<div className="relative h-32 w-32">
// 						<label
// 							htmlFor={fields.id.id}
// 							className={cn('group absolute h-32 w-32 rounded-lg', {
// 								'bg-accent opacity-40 focus-within:opacity-100 hover:opacity-100':
// 									!previewImage,
// 								'cursor-pointer focus-within:ring-4': !existingImage,
// 							})}
// 						>
// 							{previewImage ? (
// 								<div className="relative">
// 									<img
// 										src={previewImage}
// 										alt={altText ?? ''}
// 										className="h-32 w-32 rounded-lg object-cover"
// 									/>
// 									{existingImage ? null : (
// 										<div className="pointer-events-none absolute -right-0.5 -top-0.5 rotate-12 rounded-sm bg-secondary px-2 py-1 text-xs text-secondary-foreground shadow-md">
// 											new
// 										</div>
// 									)}
// 								</div>
// 							) : (
// 								<div className="flex h-32 w-32 items-center justify-center rounded-lg border border-muted-foreground text-4xl text-muted-foreground">
// 									➕
// 								</div>
// 							)}
// 							{existingImage ? (
// 								<input
// 									{...getInputProps(fields.id, {
// 										type: 'hidden',
// 									})}
// 								/>
// 							) : null}
// 							<input
// 								aria-label="Image"
// 								className="absolute left-0 top-0 z-0 h-32 w-32 cursor-pointer opacity-0"
// 								onChange={event => {
// 									const file = event.target.files?.[0]

// 									if (file) {
// 										const reader = new FileReader()
// 										reader.onloadend = () => {
// 											setPreviewImage(reader.result as string)
// 										}
// 										reader.readAsDataURL(file)
// 									} else {
// 										setPreviewImage(null)
// 									}
// 								}}
// 								{...getInputProps(fields.file, {
// 									type: 'file',
// 								})}
// 								accept="image/*"
// 							/>
// 						</label>
// 					</div>
// 				</div>
// 				<div className="flex-1">
// 					<Label htmlFor={fields.altText.id}>Alt Text</Label>
// 					<Textarea
// 						{...getTextareaProps(fields.altText)}
// 						onChange={e => setAltText(e.currentTarget.value)}
// 					/>
// 				</div>
// 			</div>
// 		</fieldset>
// 	)
// }

// export function ErrorBoundary() {
// 	return (
// 		<GeneralErrorBoundary
// 			statusHandlers={{
// 				404: ({ params }) => {
// 					return <p> No note with the id "{params.noteId}" exits</p>
// 				},
// 			}}
// 		/>
// 	)
// }
