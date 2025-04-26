/**
 * This module handles the OAuth authentication flow with external providers (like GitHub).
 *
 * - `loader` simply redirects any GET requests to the login page.
 * - `action` handles POST requests when starting authentication with a provider:
 *   - Parses and validates the provider name.
 *   - Tries to handle mock authentication (useful for local dev/testing).
 *   - If authentication fails (throws a Response), it:
 *     - Extracts 'redirectTo' from the form or request referrer.
 *     - Sets a 'redirectTo' cookie in the response header to remember where to redirect after login.
 *     - Then throws the response again so Remix will return it.
 */

import { redirect, type ActionFunctionArgs } from '@remix-run/node'
import { authenticator } from '#app/utils/auth.server.ts'
import { handleMockAction } from '#app/utils/connections.server.ts'
import { ProviderNameSchema } from '#app/utils/connections.tsx'
import { getReferrerRoute } from '#app/utils/misc.tsx'
import { getRedirectCookieHeader } from '#app/utils/redirect-cookie.server.ts'

// Loader: redirect any GET request for this route to the login page
export async function loader() {
	return redirect('/login')
}

// Action: handle authentication POST request for a given provider
export async function action({ request, params }: ActionFunctionArgs) {
	const providerName = ProviderNameSchema.parse(params.provider)

	try {
		// Try to run the mock handler (for dev/testing), then authenticate
		await handleMockAction(providerName, request)
		return await authenticator.authenticate(providerName, request)
	} catch (error: unknown) {
		// If an error is a Response (authentication failed), handle redirect logic
		if (error instanceof Response) {
			const formData = await request.formData()
			const rawRedirectTo = formData.get('redirectTo')
			const redirectTo =
				typeof rawRedirectTo === 'string'
					? rawRedirectTo
					: getReferrerRoute(request)

			const redirectToCookie = getRedirectCookieHeader(redirectTo)

			if (redirectToCookie) {
				// Attach the 'redirectTo' cookie to the outgoing error response
				error.headers.append('set-cookie', redirectToCookie)
			}
		}
		// Rethrow the error (Response) so Remix can handle it properly
		throw error
	}
}
