import { createServer } from 'node:http';

import { handleRequest } from '@open-frames/proxy';
import { createServerAdapter } from '@whatwg-node/server';

const PORT = process.env.PORT || 8080;

// Use the adapter to create a node:http compatible server out of our request handler
const adapter = createServerAdapter((request: Request) => {
	return handleRequest(request);
});

console.log(`Starting server on port ${PORT}`);

// Create a node server using the adapter
const nodeServer = createServer(adapter);
nodeServer.listen(PORT);
