import type { Server } from 'bun';
import { PORT } from './constants.ts';
import { handleRequest } from '../../src';

console.log(`Starting server on port ${PORT}`);

/**
 * Start the server on a given port
 * @param port Server port
 * @returns [Server](https://bun.sh/docs/api/http)
 */
export function start(port: number): Server {
	return Bun.serve({
		port,
		fetch(req) {
			return handleRequest(req);
		},
	});
}

function getPort() {
	if (process.env.PORT) {
		return parseInt(process.env.PORT);
	}
	return PORT;
}

start(getPort());

process.on('SIGINT', () => {
	console.log('Received SIGINT');
	process.exit(0);
});
