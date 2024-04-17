import type { GetMetadataResponse, PostRedirectResponse } from '@open-frames/proxy-types';

import { CORS_HEADERS, TAG_PREFIXES } from './constants.js';
import { ErrorResponse } from './errors.js';
import { extractMetaTags, getFrameInfo, parseAndValidateTransactionResponse } from './parser.js';
import { getMaxMetaTagSize, getMimeType, getProxySafeMediaHeaders, getUrl, metaTagsToObject } from './utils.js';

export async function handleGet(req: Request) {
	const url = getUrl(req);
	console.log(`Processing get metadata request for ${url}`);
	if (!url) {
		return new Response('Missing url query param', { status: 400 });
	}
	const maxMetaTagSize = getMaxMetaTagSize(req);
	const { data, headersToForward } = await downloadAndExtract(url, maxMetaTagSize);
	const res: GetMetadataResponse = {
		url,
		extractedTags: metaTagsToObject(data),
		frameInfo: getFrameInfo(data),
	};

	return Response.json(res, {
		headers: {
			'content-type': 'application/json',
			...headersToForward,
			...CORS_HEADERS,
		},
	});
}

export async function handlePost(req: Request) {
	const url = getUrl(req);
	const body = await req.json();
	console.log(`Processing POST request for ${url}`);
	if (!url) {
		return new Response('Missing url query param', { status: 400, headers: CORS_HEADERS });
	}
	const maxMetaTagSize = getMaxMetaTagSize(req);
	const data = await postAndExtract(url, body, maxMetaTagSize);

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

	if (!media.ok) {
		return new Response(media.body, {
			headers: { ...CORS_HEADERS },
			status: media.status,
		});
	}

	// This will include the cache control headers
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shouldValidateTransactionResponse(body: any): body is {
	address: string;
	validateTransactionResponse?: boolean;
} {
	return body && typeof body.validateTransactionResponse === 'boolean';
}

export async function postAndExtract(url: string, body: unknown, maxMetaTagSize: number | undefined) {
	const signal = AbortSignal.timeout(10000);
	const validateTransactionResponse = shouldValidateTransactionResponse(body);
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

	if (validateTransactionResponse) {
		const validatedTransactionResponse = parseAndValidateTransactionResponse(response);
		if (!validatedTransactionResponse) {
			throw new Error(`Invalid transaction response from ${url}`);
		}
	}
	const text = await response.text();
	return extractMetaTags(text, TAG_PREFIXES, maxMetaTagSize);
}

export async function downloadAndExtract(url: string, maxMetaTagSize?: number | undefined) {
	const signal = AbortSignal.timeout(10000);
	const response = await fetch(url, { redirect: 'follow', signal });
	//   TODO: Better error handling
	if (response.status >= 400) {
		throw new ErrorResponse(`Request to ${url} failed`, response.status);
	}

	const headersToForward = extractCacheHeaders(response.headers);
	// TODO: Stream response until you see </head> and then stop
	const text = await response.text();

	return { data: extractMetaTags(text, TAG_PREFIXES, maxMetaTagSize), headersToForward };
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

function extractCacheHeaders(headers: Headers): { [k: string]: string | string[] } {
	const out: { [k: string]: string | string[] } = {};
	const cacheControl = headers.get('cache-control');
	if (cacheControl) {
		out['cache-control'] = cacheControl;
	}

	return out;
}
