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
// Get a URL for the Open Graph image that will be runt hrough the proxy
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
