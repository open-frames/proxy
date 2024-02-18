import { GetMetadataResponse, PostRedirectResponse } from '@open-frames/proxy';

import { mediaUrl, post, postRedirect, readMetadata } from './actions.js';
import { JSONSerializable } from './types.js';

export default class OpenFramesProxy {
	baseUrl: string;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
	}

	async readMetadata(url: string): Promise<GetMetadataResponse> {
		return readMetadata(url, this.baseUrl);
	}

	async post(url: string, payload: JSONSerializable): Promise<GetMetadataResponse> {
		return post(url, payload, this.baseUrl);
	}

	async postRedirect(url: string, payload: JSONSerializable): Promise<PostRedirectResponse> {
		return postRedirect(url, payload, this.baseUrl);
	}

	mediaUrl(url: string): string {
		return mediaUrl(url, this.baseUrl);
	}
}
