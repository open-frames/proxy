import type { GetMetadataResponse, PostRedirectResponse } from '@open-frames/proxy-types';

import { mediaUrl, post, postRedirect, postTransaction, readMetadata } from './actions.js';
import { JSONSerializable, TransactionResponse } from './types.js';

export class OpenFramesProxy {
	baseUrl: string;
	maxMetaTagSize: number | undefined;

	constructor(baseUrl: string, maxMetaTagSize?: number | undefined) {
		this.baseUrl = baseUrl;
		this.maxMetaTagSize = maxMetaTagSize;
	}

	async readMetadata(url: string): Promise<GetMetadataResponse> {
		return readMetadata(url, this.baseUrl, this.maxMetaTagSize);
	}

	async post(url: string, payload: JSONSerializable): Promise<GetMetadataResponse> {
		return post(url, payload, this.baseUrl, this.maxMetaTagSize);
	}

	async postRedirect(url: string, payload: JSONSerializable): Promise<PostRedirectResponse> {
		return postRedirect(url, payload, this.baseUrl);
	}

	async postTransaction(url: string, payload: JSONSerializable): Promise<TransactionResponse> {
		return postTransaction(url, payload, this.baseUrl, this.maxMetaTagSize);
	}

	mediaUrl(url: string): string {
		return mediaUrl(url, this.baseUrl);
	}
}
