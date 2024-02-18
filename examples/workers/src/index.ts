import { handleRequest } from '@open-frames/proxy';

export interface Env {}

export default {
	async fetch(request: Request /** _env: Env, _ctx: ExecutionContext **/): Promise<Response> {
		return handleRequest(request);
	},
};
