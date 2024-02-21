import type { GetMetadataResponse, PostRedirectResponse } from '@open-frames/proxy';

import { ApiError } from './errors.js';
import { JSONSerializable } from './types.js';

export async function readMetadata(url: string, proxyUrl: string): Promise<GetMetadataResponse> {
	const response = await fetch(`${proxyUrl}?url=${encodeURIComponent(url)}`);

	if (!response.ok) {
		throw new ApiError(`Failed to read metadata for ${url}`, response.status);
	}

	return (await response.json()) as GetMetadataResponse;
}

export async function post(url: string, payload: JSONSerializable, proxyUrl: string): Promise<GetMetadataResponse> {
	const response = await fetch(`${proxyUrl}?url=${encodeURIComponent(url)}`, {
		method: 'POST',
		body: JSON.stringify(payload),
		headers: {
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to post to frame: ${response.status} ${response.statusText}`);
	}

	return (await response.json()) as GetMetadataResponse;
}

export async function postRedirect(url: string, payload: JSONSerializable, proxyUrl: string): Promise<PostRedirectResponse> {
	const response = await fetch(`${proxyUrl}redirect?url=${encodeURIComponent(url)}`, {
		method: 'POST',
		body: JSON.stringify(payload),
		headers: {
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		throw new ApiError(`Failed to post to frame: ${response.statusText}`, response.status);
	}

	return (await response.json()) as PostRedirectResponse;
}

export function mediaUrl(url: string, proxyUrl: string): string {
	return `${proxyUrl}media?url=${encodeURIComponent(url)}`;
}
