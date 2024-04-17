import { CORS_HEADERS } from './constants.js';
import { ErrorResponse } from './errors.js';
import { handleGet, handleMedia, handlePost, handlePostTransaction, handleRedirect } from './handlers.js';
import { getRequestPath } from './utils.js';

// To-do: remove once figuring out the better way to distinguish which to call here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasAddressProperty(body: any): body is { address?: string } {
	return typeof body === 'object' && 'address' in body;
}

export async function handleRequest(req: Request): Promise<Response> {
	try {
		if (req.method === 'OPTIONS') {
			return new Response('ok', { headers: CORS_HEADERS });
		}

		const path = getRequestPath(req);
		if (req.method === 'GET') {
			if (path === '/media') {
				return await handleMedia(req);
			}

			if (path === '/') {
				return await handleGet(req);
			}
		}

		if (req.method === 'POST') {
			if (path === '/redirect') {
				return await handleRedirect(req);
			}
			// Is there a better way to determine whether this is a post or post transaction request?
			if (hasAddressProperty(req.body)) {
				return await handlePostTransaction(req);
			} else {
				return await handlePost(req);
			}
		}
	} catch (e) {
		if (e instanceof ErrorResponse) {
			return Response.json({ error: e.message }, { status: e.statusCode, headers: CORS_HEADERS });
		}
		return Response.json({ error: e }, { status: 500, headers: CORS_HEADERS });
	}

	return new Response('Not found', { status: 404, headers: CORS_HEADERS });
}
