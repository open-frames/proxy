import type { GetMetadataResponse, PostRedirectResponse } from '@open-frames/proxy-types';

import { CORS_HEADERS } from './constants.js';
import { ErrorResponse } from './errors.js';
import { extractMetaTags, getFrameInfo } from './parser.js';
import { getMimeType, getProxySafeMediaHeaders, getUrl, metaTagsToObject } from './utils.js';

export async function handleGet(req: Request) {
	const url = getUrl(req);
	console.log(`Processing get metadata request for ${url}`);
	if (!url) {
		return new Response('Missing url query param', { status: 400 });
	}
	const data = await downloadAndExtract(url);
	const res: GetMetadataResponse = {
		url,
		extractedTags: metaTagsToObject(data),
		frameInfo: getFrameInfo(data),
	};

	return Response.json(res, {
		headers: {
			'content-type': 'application/json',
			...CORS_HEADERS,
		},
	});
}

export async function handlePost(req: Request) {
	const url = getUrl(req);
	const body = await req.json();
	console.log(`Processing POST request for ${url}`);
	if (!url) {
		return new Response('Missing url query param', { status: 400 });
	}
	const data = await postAndExtract(url, body);

	const res: GetMetadataResponse = {
		url,
		extractedTags: metaTagsToObject(data),
		frameInfo: getFrameInfo(data),
	};

	return Response.json(res, {
		headers: {
			'content-type': 'application/json',
			...CORS_HEADERS,
		},
	});
}

export async function handleRedirect(req: Request) {
	const url = getUrl(req);
	const body = await req.json();
	console.log(`Processing handleRedirect request for ${url}`);

	const res = await findRedirect(url, body);

	return Response.json(res, {
		headers: {
			'content-type': 'application/json',
			...CORS_HEADERS,
		},
	});
}

export async function handleMedia(req: Request) {
	const url = getUrl(req);
	console.log(`Processing handleImage request for ${url}`);

	const media = await fetch(url, {
		headers: getProxySafeMediaHeaders(req),
	});
	const mediaHeaders = Object.fromEntries(media.headers.entries());
	const responseHeaders = new Headers({ ...mediaHeaders, ...CORS_HEADERS });
	if (!responseHeaders.has('content-type')) {
		const urlMimeType = getMimeType(url);
		if (urlMimeType) {
			responseHeaders.set('content-type', urlMimeType);
		}
	}

	return new Response(media.body, {
		headers: responseHeaders,
	});
}

export async function postAndExtract(url: string, body: unknown) {
	const signal = AbortSignal.timeout(10000);
	const response = await fetch(url, {
		method: 'POST',
		redirect: 'follow',
		body: JSON.stringify(body),
		headers: {
			'content-type': 'application/json',
		},
		signal,
	});

	if (response.status >= 400) {
		throw new Error(`Request failed with status ${response.status}`);
	}

	const text = await response.text();
	return extractMetaTags(text);
}

export async function downloadAndExtract(url: string) {
	const signal = AbortSignal.timeout(10000);
	const response = await fetch(url, { redirect: 'follow', signal });
	//   TODO: Better error handling
	if (response.status >= 400) {
		throw new ErrorResponse(`Request to ${url} failed`, response.status);
	}

	// TODO: Stream response until you see </head> and then stop
	const text = await response.text();

	return extractMetaTags(text);
}

export async function findRedirect(url: string, body: unknown): Promise<PostRedirectResponse> {
	const signal = AbortSignal.timeout(10000);
	const response = await fetch(url, {
		method: 'POST',
		body: JSON.stringify(body),
		headers: {
			'content-type': 'application/json',
		},
		signal,
		redirect: 'manual',
	});
	const location = response.headers.get('location');
	if (response.status !== 302 || !location) {
		throw new ErrorResponse('No redirect found', 404);
	}

	return {
		originalUrl: url,
		redirectedTo: location,
	};
}
