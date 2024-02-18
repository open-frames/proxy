import { CORS_HEADERS } from './constants';
import { ErrorResponse } from './errors';
import { handleGet, handleMedia, handlePost, handleRedirect } from './handlers';
import { getRequestPath } from './utils';

export async function handleRequest(req: Request): Promise<Response> {
	try {
		if (req.method === 'OPTIONS') {
			return new Response('ok', { headers: CORS_HEADERS });
		}

		const path = getRequestPath(req);
		if (req.method === 'GET') {
			if (path === '/media') {
				return handleMedia(req);
			}

			if (path === '/') {
				return handleGet(req);
			}
		}

		if (req.method === 'POST') {
			if (path === '/redirect') {
				return handleRedirect(req);
			}

			return handlePost(req);
		}
	} catch (e) {
		if (e instanceof ErrorResponse) {
			return Response.json({ error: e.message }, { status: e.statusCode });
		}
		return Response.json({ error: e }, { status: 500 });
	}

	return new Response('Not found', { status: 404 });
}
