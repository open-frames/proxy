import { readFile } from 'node:fs/promises';
import { createServer, Server } from 'node:http';

import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { downloadAndExtract } from './handlers.js';
import { getFrameInfo } from './parser.js';
import { metaTagsToObject } from './utils.js';

const EXPECTED_FRAME_IMAGE = 'test-image';
const EXPECTED_FRAME_POST_URL = 'post-url';
const EXPECTED_FRAME_FARCASTER_VERSION = 'vNext';
const EXPECTED_FRAME_XMTP_VERSION = '1';
const EXPECTED_FRAME_VERSION = 'of-version';
const EXPECTED_IMAGE_ASPECT_RATIO = '1:1';
const EXPECTED_IMAGE_ALT = 'image-alt';

async function serveHtml(port: number) {
	const server = createServer(async (req, res) => {
		const fileName = req.url?.replace('/', '');
		const html = await readFile(`fixtures/${fileName}`, 'utf-8');
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.end(html);
	}).listen(port);

	return server;
}

const testCases = [
	{
		file: 'github.html',
		expectedTags: {
			'og:title': 'oven-sh/bun: Incredibly fast JavaScript runtime, bundler, test runner, and package manager – all in one',
			'og:image': 'https://opengraph.githubassets.com/14c49397fbfdc07e07d589d265396ddb65eda364617f14d1976937a842bb0983/oven-sh/bun',
			'og:type': 'object',
			'og:url': 'https://github.com/oven-sh/bun',
		},
	},
	{
		file: 'ogp.html',
		expectedTags: {
			'og:title': 'Open Graph protocol',
			'og:image': 'https://ogp.me/logo.png',
			'og:type': 'website',
			'og:url': 'https://ogp.me/',
			'og:image:alt': 'The Open Graph logo',
		},
	},
	{
		file: 'minimal-frame.html',
		expectedTags: {
			'fc:frame': EXPECTED_FRAME_FARCASTER_VERSION,
			'fc:frame:image': EXPECTED_FRAME_IMAGE,
			'fc:frame:post_url': EXPECTED_FRAME_POST_URL,
		},
		expectedFrameInfo: {
			acceptedClients: {
				farcaster: EXPECTED_FRAME_FARCASTER_VERSION,
			},
			image: {
				content: EXPECTED_FRAME_IMAGE,
			},
			postUrl: EXPECTED_FRAME_POST_URL,
		},
	},
	{
		file: 'minimal-open-frame.html',
		expectedTags: {
			'of:accepts:xmtp': '1',
			'of:image': EXPECTED_FRAME_IMAGE,
			'of:post_url': EXPECTED_FRAME_POST_URL,
		},
		expectedFrameInfo: {
			ogImage: EXPECTED_FRAME_IMAGE,
			acceptedClients: {
				xmtp: '1',
			},
			image: {
				content: EXPECTED_FRAME_IMAGE,
			},
			postUrl: EXPECTED_FRAME_POST_URL,
		},
	},
	{
		file: 'mixed-frame.html',
		expectedTags: {
			'fc:frame': EXPECTED_FRAME_FARCASTER_VERSION,
			'fc:frame:image': `fc-${EXPECTED_FRAME_IMAGE}`,
			'fc:frame:post_url': `fc-${EXPECTED_FRAME_POST_URL}`,
			'of:accepts:xmtp': EXPECTED_FRAME_XMTP_VERSION,
			'of:image': EXPECTED_FRAME_IMAGE,
			'of:post_url': EXPECTED_FRAME_POST_URL,
		},
		expectedFrameInfo: {
			ogImage: EXPECTED_FRAME_IMAGE,
			acceptedClients: {
				farcaster: EXPECTED_FRAME_FARCASTER_VERSION,
				xmtp: EXPECTED_FRAME_XMTP_VERSION,
			},
			image: {
				content: EXPECTED_FRAME_IMAGE,
			},
			postUrl: EXPECTED_FRAME_POST_URL,
		},
	},
	{
		file: 'frame-with-all-fields.html',
		expectedTags: {
			'of:version': EXPECTED_FRAME_VERSION,
			'of:accepts:xmtp': EXPECTED_FRAME_XMTP_VERSION,
			'of:accepts:lens': '2',
			'of:post_url': EXPECTED_FRAME_POST_URL,
			'of:image': EXPECTED_FRAME_IMAGE,
			'of:image:aspect_ratio': EXPECTED_IMAGE_ASPECT_RATIO,
			'of:image:alt': EXPECTED_IMAGE_ALT,
			'of:button:1': 'button-1',
			'of:button:1:action': 'post',
			'of:button:1:target': EXPECTED_FRAME_POST_URL,
			'of:button:2': 'button-2',
			'of:button:2:action': 'post_redirect',
			'of:button:3': 'button-3',
			'of:button:3:action': 'link',
			'of:button:3:target': 'link-url',
			'of:button:4': 'button-4',
			'of:button:4:action': 'mint',
			'of:button:4:target': 'mint-url',
			'og:image': EXPECTED_FRAME_IMAGE,
		},
		frameInfo: {
			ogImage: EXPECTED_FRAME_IMAGE,
			acceptedClients: {
				xmtp: EXPECTED_FRAME_XMTP_VERSION,
				lens: '2',
			},
			image: {
				content: EXPECTED_FRAME_IMAGE,
				aspectRatio: EXPECTED_IMAGE_ASPECT_RATIO,
				alt: EXPECTED_IMAGE_ALT,
			},
			postUrl: EXPECTED_FRAME_POST_URL,
			buttons: {
				'1': {
					action: 'post',
					label: 'button-1',
					target: EXPECTED_FRAME_POST_URL,
				},
				'2': {
					action: 'post_redirect',
					label: 'button-2',
				},
				'3': {
					action: 'link',
					label: 'button-3',
					target: 'link-url',
				},
				'4': {
					action: 'mint',
					label: 'button-4',
					target: 'mint-url',
				},
			},
		},
	},
] as const;

describe('metadata parsing', () => {
	const PORT = 4444;
	let server: Server;

	beforeAll(async () => {
		server = await serveHtml(PORT);
	});

	afterAll(() => {
		server?.close();
	});

	for (const testCase of testCases) {
		test(`can extract tags from ${testCase.file}`, async () => {
			const metaTags = await downloadAndExtract(`http://localhost:${PORT}/${testCase.file}`);

			const extractedTags = metaTagsToObject(metaTags);
			for (const [key, value] of Object.entries(testCase.expectedTags)) {
				expect(extractedTags[key]).toBe(value);
			}

			const frameInfo = getFrameInfo(metaTags);
			if ('expectedFrameInfo' in testCase) {
				expect(frameInfo).toMatchObject(testCase.expectedFrameInfo);
			}
		});
	}
});
