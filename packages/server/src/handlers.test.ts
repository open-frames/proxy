import { createServer, OutgoingHttpHeaders, Server } from 'node:http';
import { beforeAll, afterAll, describe, expect, test } from 'vitest';
import { findRedirect, handleMedia } from './handlers';
import { ErrorResponse } from './errors';
import { readFile } from 'node:fs/promises';

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
			const file = await readFile(filePath);
			try {
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
});
