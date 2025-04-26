/**
 * This module manages the 'redirectTo' cookie used for storing a URL
 * that the user should be redirected to after a certain action (like login).
 * It includes functions for serializing, setting, getting, and destroying this cookie.
 */

import * as cookie from 'cookie'

// Define the key name for the cookie.
const key = 'redirectTo'

// Serialize and immediately destroy the 'redirectTo' cookie by setting its maxAge to -1
// This essentially deletes the cookie when it's sent in the response.
export const destroyRedirectToHeader = cookie.serialize(key, '', { maxAge: -1 })

/**
 * Creates a 'redirectTo' cookie header if a valid URL is provided.
 * The cookie will store the URL that the user will be redirected to.
 * The cookie will be set with a path of '/' to make it accessible across the site.
 *
 * @param redirectTo - The URL to store in the cookie (optional).
 * @returns The serialized cookie header if 'redirectTo' is provided and not equal to '/', otherwise null.
 */
export function getRedirectCookieHeader(redirectTo?: string) {
	// Only serialize the cookie if 'redirectTo' is valid and not equal to '/'
	return redirectTo && redirectTo !== '/'
		? cookie.serialize(key, redirectTo, { path: '/' }) // Return the serialized cookie header
		: null // Return null if 'redirectTo' is not valid or is '/'
}

/**
 * Extracts the value of the 'redirectTo' cookie from the request headers.
 *
 * @param request - The incoming HTTP request that contains the cookies.
 * @returns The value of the 'redirectTo' cookie or null if the cookie is not present.
 */
export function getRedirectCookieValue(request: Request) {
	// Retrieve the 'cookie' header from the incoming request.
	const rawCookie = request.headers.get('cookie')

	// Parse the cookies if they exist, otherwise default to an empty object.
	const parsedCookies = rawCookie ? cookie.parse(rawCookie) : {}

	// Extract the 'redirectTo' cookie value from the parsed cookies object.
	const redirectTo = parsedCookies[key]

	// Return the 'redirectTo' value or null if the cookie is not found.
	return redirectTo || null
}
