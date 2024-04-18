import { readFile } from 'node:fs/promises';
import { createServer, OutgoingHttpHeaders, Server } from 'node:http';

import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';

import { ErrorResponse } from './errors.js';
import { findRedirect, handleMedia, postTransaction } from './handlers.js';

describe('postRedirect', () => {
	const PORT = 7777;
	const REDIRECT_DESTINATION = 'https://example.com';

	let server: Server;
	beforeAll(() => {
		server = createServer((req, res) => {
			const path = req.url ? new URL(req.url, `http://localhost:${PORT}`).pathname : '/';
			const statusCode = parseInt(path.split('/')[1]);
			if (statusCode === 200) {
				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end('ok');
			} else {
				res.writeHead(statusCode, { Location: REDIRECT_DESTINATION });
				res.end('redirected');
			}
		}).listen(PORT);
	});

	afterAll(() => {
		server?.close();
	});

	test('should handle 302 correctly', async () => {
		const url = `http://localhost:${PORT}/302`;
		const data = await findRedirect(url, {});
		expect(data).toEqual({
			originalUrl: url,
			redirectedTo: REDIRECT_DESTINATION,
		});
	});

	test('should error on 301', async () => {
		const url = `http://localhost:${PORT}/301`;
		expect(findRedirect(url, {})).rejects.toThrow(new ErrorResponse('No redirect found', 404));
	});

	test('should error on 200', async () => {
		const url = `http://localhost:${PORT}/200`;
		expect(findRedirect(url, {})).rejects.toThrow(new ErrorResponse('No redirect found', 404));
	});
});

describe('media', () => {
	const MEDIA_PORT = 7778;

	let mediaServer: Server;

	beforeAll(() => {
		mediaServer = createServer(async (req, res) => {
			if (!req.url) {
				throw new Error('No URL');
			}
			const url = new URL(req.url, `http://localhost:${MEDIA_PORT}`);
			const path = url.pathname.split('/')[1];
			const headers: OutgoingHttpHeaders = {};
			const contentType = url.searchParams.get('content-type');
			if (contentType) {
				console.log('Overriding content type', contentType);
				headers['content-type'] = contentType;
			}
			const filePath = `fixtures/${path}`;
			try {
				const file = await readFile(filePath);
				res.writeHead(200, headers);
				res.end(file);
			} catch (e) {
				res.writeHead(404);
				res.end('Not found');
			}
		}).listen(MEDIA_PORT);
	});

	afterAll(() => {
		mediaServer?.close();
	});

	test('should stream image', async () => {
		const mediaUrl = `http://localhost:${MEDIA_PORT}/ogp.png?content-type=image/png`;
		const mediaRequest = new Request(`http://localhost/media?url=${encodeURIComponent(mediaUrl)}`);
		const response = await handleMedia(mediaRequest);
		expect(response.headers.get('content-type')).toEqual('image/png');
		const blob = await response.arrayBuffer();
		const actualFile = (await readFile(`fixtures/ogp.png`)).buffer;
		expect(blob).toEqual(actualFile);
	});

	test('should respect content type', async () => {
		const mediaUrl = `http://localhost:${MEDIA_PORT}/ogp.png?content-type=image/jpeg`;
		const mediaRequest = new Request(`http://localhost/media?url=${encodeURIComponent(mediaUrl)}`);
		const response = await handleMedia(mediaRequest);
		// Use the content type from the media server, not just the file name
		expect(response.headers.get('content-type')).toEqual('image/jpeg');
	});

	test('should default to file extension', async () => {
		// Don't force a content type. Let the handler figure it out from the file extension
		const mediaUrl = `http://localhost:${MEDIA_PORT}/ogp.png`;
		const mediaRequest = new Request(`http://localhost/media?url=${encodeURIComponent(mediaUrl)}`);
		const response = await handleMedia(mediaRequest);
		// Use the content type from the media server, not just the file name
		expect(response.headers.get('content-type')).toEqual('image/png');
	});

	test('should pass through status when non-200', async () => {
		const mediaUrl = `http://localhost:${MEDIA_PORT}/doesnotexist.png`;
		const mediaRequest = new Request(`http://localhost/media?url=${encodeURIComponent(mediaUrl)}`);
		const response = await handleMedia(mediaRequest);
		// Use the content type from the media server, not just the file name
		expect(response.status).toEqual(404);
	});
});

describe('postTransaction', () => {
	const mockValidResponse = {
		status: 200,
		json: () =>
			Promise.resolve({
				responseData: 'test123',
			}),
	} as Response;

	const mockInvalidResponse = {
		status: 400,
	} as Response;

	beforeAll(() => {
		vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockValidResponse);

		vi.mocked(fetch).mockResolvedValueOnce(mockValidResponse);
	});

	afterAll(() => {
		vi.spyOn(global, 'fetch').mockClear();
	});

	test('returns validated response on success', async () => {
		const result = await postTransaction('https://www.example.com', {});

		expect(await result.json()).toEqual({
			responseData: 'test123',
		});
	});

	test('throws error on invalid response', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockInvalidResponse);

		await expect(postTransaction('https://www.example.com', {})).rejects.toThrowError();
	});
});
