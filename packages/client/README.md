# Open Frames Proxy Client

## Setup

```sh
corepack enable
corepack prepare
yarn
```

## Usage

### Basic usage

```ts
import { readMetadata, post, postRedirect, mediaUrl } from '@open-frames/proxy-client';

const PROXY_URL = 'https://frames.xmtp.chat/';
const FRAME_URL = 'https://myframe.xyz';

// Get the frame metadata, which will include the parsed `frameInfo` object
const initialFrame = await readMetadata(FRAME_URL, PROXY_URL);
// Get a URL for the Open Graph image that will be run through the proxy
const proxiedOgImage = mediaUrl(initialFrame.frameInfo.ogImage, PROXY_URL);
// Print out the content from the first button
console.log(initialFrame.buttons['1'].content);
// Post a button click to the correc URL. If the button has a `post_url` set, use that. If not, use the `post_url` field
// set on the frame. If neither are present, post to the original URL of the frame.
const updatedFrameAfterPost = await post(
	initialFrame.buttons['1'].postUrl || initialFrame.target || FRAME_URL,
	{ ...MY_POST_PAYLOAD },
	PROXY_URL,
);
// Frame will be updated after posting. Print the new content of the first button
console.log(updatedFrameAfterPost.buttons['1'].content);
if (updatedFrameAfterPost.buttons['1'].action === 'post_redirect') {
	const postUrl = updatedFrameAfterPost.buttons['1'].target || updatedFrameAfterPost.postUrl || FRAME_URL;
	const { redirectedTo } = await postRedirect(postUrl, { ...SOME_POST_PAYLOAD }, PROXY_URL);
	window.open(redirectedTo, '_blank');
}
```

### Transaction frame usage

```ts
import { readMetadata, post, postTransaction } from '@open-frames/proxy-client';

const FRAME_URL = 'https://frames.xmtp.chat/';

const initialFrame = await readMetadata(FRAME_URL);

// Extract from above
const action = initialFrame.buttons['1'].action;
const target = initialFrame.buttons['1'].target;
const postUrl = initialFrame.buttons['1'].post_url;

// If this is a transaction frame, do the below steps
const isTransaction = action === 'tx' && target && postUrl;

// First, make a POST request to the `target` URL to fetch data about the transaction, with a signed frame action payload in the POST body including the address of the connected wallet in the `address` field.
const transactionInfo: {
	chainId: string;
	method: 'eth_sendTransaction';
	params: {
		abi: Abi | [];
		to: `0x${string}`;
		value?: string;
		data?: `0x${string}`;
	};
} = await postTransaction(target, { address: `0x${string}` });

// The response from the server is a 200 with JSON describing the transaction.

// The client then sends a tx request to the user's connected wallet. Note: this step is out of scope of this package.

// The client should then send a POST request to the postURL with the transaction hash returned from the step above in the transactionId field. Importantly, this postUrl should come from the button and *not* the `frameInfo` postUrl.

await post(postUrl, { transactionId: 'transactionHash from above response' });
// The response from the frame server should be a 200 OK and include another frame.
```

You may also use the `OpenFramesProxy` class to set the proxy URL once and use the same methods

```ts
import { OpenFramesProxy } from '@open-frames/proxy-client';

// Make sure to keep the trailing slash
const PROXY_URL = 'https://frames.xmtp.chat/';
const FRAME_URL = 'https://myframe.xyz';

const client = new OpenFramesProxy(PROXY_URL);

// Read the metadata from the FRAME_URL using the proxy
const metadata = await client.readMetadata(FRAME_URL);
```
