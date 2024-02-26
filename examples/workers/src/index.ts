import { handleRequest } from '@open-frames/proxy';

export interface Env {}

// Default cache to 1hr
const DEFAULT_CACHE_LENGTH = 60 * 60;

async function handleWithCache(request: Request, ctx: ExecutionContext): Promise<Response> {
	const cacheUrl = new URL(request.url);

	// Construct the cache key from the cache URL
	const cacheKey = new Request(cacheUrl.toString(), request);
	const cache = caches.default;
	let response = await cache.match(cacheKey);
	if (!response) {
		console.log(`Cache miss for ${request.url}`);
		response = await handleRequest(request);
		console.log(response.headers);
		const cacheControlValue = response.headers.get('cache-control');
		if (!cacheControlValue) {
			response.headers.append('cache-control', `s-maxage=${DEFAULT_CACHE_LENGTH}`);
		}
		ctx.waitUntil(cache.put(cacheKey, response.clone()));
	} else {
		console.log(`Cache hit for ${request.url}`);
	}
	return response;
}

export default {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method === 'GET') {
			return handleWithCache(request, ctx);
		}
		return handleRequest(request);
	},
};
