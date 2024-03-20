import { CORS_HEADERS } from './constants.js';
import { ErrorResponse } from './errors.js';
import { handleGet, handleMedia, handlePost, handleRedirect } from './handlers.js';
import { getRequestPath } from './utils.js';

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

			return await handlePost(req);
		}
	} catch (e) {
		if (e instanceof ErrorResponse) {
			return Response.json({ error: e.message }, { status: e.statusCode, headers: CORS_HEADERS });
		}
		return Response.json({ error: e }, { status: 500, headers: CORS_HEADERS });
	}

	return new Response('Not found', { status: 404, headers: CORS_HEADERS });
}
