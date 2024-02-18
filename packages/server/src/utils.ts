import mime from 'mime';

import { ErrorResponse } from './errors.js';

export function getUrl(req: Request) {
	const url = new URL(req.url).searchParams.get('url');
	if (!url) {
		throw new ErrorResponse('Missing url query param', 400);
	}
	return url;
}

export function getRequestPath(req: Request): string {
	return new URL(req.url).pathname;
}

export function getMimeType(url: string): string | null {
	const extension = new URL(url).pathname.split('.').pop();
	if (!extension) {
		return null;
	}

	return mime.getType(extension);
}

export function getProxySafeMediaHeaders(req: Request): Headers {
	const headers = new Headers();
	const acceptHeader = req.headers.get('accept');
	if (acceptHeader) {
		headers.set('accept', acceptHeader);
	}

	const acceptEncodingHeader = req.headers.get('accept-encoding');
	if (acceptEncodingHeader) {
		headers.set('accept-encoding', acceptEncodingHeader);
	}

	return headers;
}

export function metaTagsToObject(tags: [string, string][]): Record<string, string> {
	return tags.reduce(
		(acc, [key, value]) => {
			if (!(key in acc)) {
				acc[key] = value;
			}
			return acc;
		},
		{} as Record<string, string>,
	);
}
