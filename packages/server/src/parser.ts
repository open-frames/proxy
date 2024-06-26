import type {
	OpenFrameButton,
	OpenFrameButtonResult,
	OpenFrameImage,
	OpenFrameResult,
	TransactionResponse,
} from '@open-frames/proxy-types';
import { load } from 'cheerio';

import { ALLOWED_ACTIONS, FRAMES_PREFIXES, TAG_PREFIXES } from './constants.js';
import type { DeepPartial } from './types.js';
import { getStrByteSize } from './utils.js';

type MetaTag = [string, string];

export function extractMetaTags(html: string, tagPrefixes = TAG_PREFIXES, maxMetaTagSize: number | undefined) {
	const $ = load(html);
	const metaTags = $('meta');
	const metaTagsArray = Array.from(metaTags);

	return metaTagsArray.reduce((acc: MetaTag[], metaTag) => {
		const metaName = metaTag.attribs.name;
		const property = metaTag.attribs.property || metaName;
		const content = metaTag.attribs.content;

		if (!property || !content) {
			return acc;
		}

		const hasPrefix = tagPrefixes.some((prefix) => property.startsWith(prefix));

		if (!hasPrefix) {
			return acc;
		}

		if (maxMetaTagSize && getStrByteSize(content) > maxMetaTagSize) {
			return acc;
		}

		acc.push([property, content]);

		return acc;
	}, []);
}

const requiredFrameFields: (keyof OpenFrameResult)[] = ['acceptedClients', 'image'];

export function getFrameInfo(metaTags: MetaTag[]): OpenFrameResult | undefined {
	const frameInfo: DeepPartial<OpenFrameResult> = {};
	for (const [key, value] of metaTags) {
		if (key === 'og:image') {
			frameInfo.ogImage = value;
			continue;
		}
		for (const prefix of FRAMES_PREFIXES) {
			if (key.startsWith(prefix)) {
				const cleanedKey = removeFramesPrefix(key, prefix);
				updateFrameResult(frameInfo, cleanedKey, value);
				break;
			}
		}
	}
	if (!requiredFrameFields.every((field) => field in frameInfo)) {
		return undefined;
	}
	return frameInfo as OpenFrameResult;
}

function updateFrameResult(frameInfo: DeepPartial<OpenFrameResult>, key: string, value: string) {
	switch (true) {
		// This would be fc:frame
		case key === '':
			frameInfo.acceptedClients = frameInfo.acceptedClients || {};
			frameInfo.acceptedClients.farcaster = value;
			break;
		// fc:frame:image or of:image
		case key === 'image':
			frameInfo.image = frameInfo.image || {};
			frameInfo.image.content = value;
			break;
		// fc:frame:post_url or of:post_url
		case key === 'post_url':
			frameInfo.postUrl = value;
			break;
		// fc:frame:input:text or of:input:text
		case key === 'input:text':
			frameInfo.textInput = { content: value };
			break;
		// fc:frame:image:aspect_ratio or of:image:aspect_ratio
		case key === 'image:aspect_ratio':
			frameInfo.image = frameInfo.image || {};
			// Not currently validating aspect ratios to avoid breaking if new ratios are introduced
			frameInfo.image.aspectRatio = value as OpenFrameImage['aspectRatio'];
			break;
		// of:image:alt
		case key === 'image:alt':
			frameInfo.image = frameInfo.image || {};
			frameInfo.image.alt = value;
			break;
		case key === 'state':
			frameInfo.state = value;
			break;
		case key.startsWith('button:'):
			updateFrameButton(frameInfo, key, value);
			break;
		case key.startsWith('accepts:'):
			frameInfo.acceptedClients = frameInfo.acceptedClients || {};
			frameInfo.acceptedClients[key.replace('accepts:', '')] = value;
			break;
	}
}

function updateFrameButton(frameInfo: DeepPartial<OpenFrameResult>, key: string, value: string) {
	const [, buttonIndex, maybeField] = key.split(':');
	if (!buttonIndex || isNaN(parseInt(buttonIndex))) {
		return;
	}
	frameInfo.buttons = frameInfo.buttons || {};
	const button = (frameInfo.buttons[buttonIndex] as OpenFrameButtonResult) || {};
	if (maybeField) {
		const field = maybeField as keyof OpenFrameButton;
		if (field === 'action' && isAllowedAction(value)) {
			button.action = value;
		}
		if (field === 'target') {
			button.target = value;
		}
		if (field === 'post_url') {
			button.postUrl = value;
		}
	} else {
		button.label = value;
	}
	frameInfo.buttons[buttonIndex] = button;
}

function isAllowedAction(action: string): action is OpenFrameButton['action'] {
	return ALLOWED_ACTIONS.includes(action as OpenFrameButton['action']);
}

function removeFramesPrefix(str: string, prefix: string) {
	const newString = str.replace(prefix, '');
	if (newString[0] === ':') {
		return newString.slice(1);
	}
	return newString;
}

function isEvmChainId(chainId: string): boolean {
	const prefixPattern = /^eip155:/;
	if (!prefixPattern.test(chainId)) {
		return false;
	}
	const chainNumber = chainId.split(':')[1];
	return !!Number(chainNumber);
}

export function parseAndValidateTransactionResponse(response: TransactionResponse): TransactionResponse | null {
	try {
		if (response.method === 'eth_sendTransaction') {
			if (!isEvmChainId(response.chainId)) {
				return null;
			}
			const { abi, to, value, data } = response.params;
			if (
				!Array.isArray(abi) ||
				!to ||
				typeof to !== 'string' ||
				(value && typeof value !== 'string') ||
				(data && typeof data !== 'string')
			) {
				return null;
			} else {
				return response;
			}
		} else {
			return response;
		}
	} catch (error) {
		return null;
	}
}
