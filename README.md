# OpenGraph Proxy

A simple proxy server to read Frames and Open Graph tags from a URL without revealing client IP addresses.

## Setup

To install dependencies you must be using yarn@v4

```bash
# Enable corepack
corepack enable
# Set the packageManager to the value specified in this package.json
corepack prepare
# Install dependencies
yarn
```

## Contents

- [Base proxy server](./packages/server)
- [Proxy client](./packages/client)
- [Cloudflare Workers example](./examples/workers)
- [NodeJS example](./examples/nodejs)

## Usage

While we recommend deploying your own Frames Proxy instance for production applications, you can test against the instance provided freely by XMTP Labs and hosted at `https://frames.xmtp.chat`

```sh
curl -L https://frames.xmtp.chat/\?url\=https://ogp.me
```

returns

```json
{
	"url": "https://ogp.me",
	"extractedTags": {
		"og:title": "Open Graph protocol",
		"og:type": "website",
		"og:url": "https://ogp.me/",
		"og:image": "https://ogp.me/logo.png",
		"og:image:type": "image/png",
		"og:image:width": "300",
		"og:image:height": "300",
		"og:image:alt": "The Open Graph logo",
		"og:description": "The Open Graph protocol enables any web page to become a rich object in a social graph."
	}
}
```

```sh
curl -L https://frames.xmtp.chat/\?url\=https://basequest.ai
```

returns

```json
{
	"url": "https://basequest.ai/",
	"extractedTags": {
		"fc:frame": "vNext",
		"fc:frame:button:1": "Start your Adventure! ▶️",
		"fc:frame:button:2": "Leaderboard 🏆",
		"fc:frame:image": "https://basequest.ai/api/image/splash?charactersCount=5925",
		"fc:frame:post_url": "https://basequest.ai/api/menu?buttons=start%2Cleaderboard",
		"og:title": "Base Quest - Start your Adventure!",
		"og:description": "AI Powered Text Adventure on Base L2",
		"og:image": "https://basequest.ai/api/image/splash"
	},
	"frameInfo": {
		"acceptedClients": { "farcaster": "vNext" },
		"image": { "content": "https://basequest.ai/api/image/splash?charactersCount=5925" },
		"buttons": { "1": { "label": "Start your Adventure! ▶️" }, "2": { "label": "Leaderboard 🏆" } },
		"postUrl": "https://basequest.ai/api/menu?buttons=start%2Cleaderboard"
	}
}
```

## Full API

- `GET /?url=$URL` Get the Frame metadata from a URL
- `POST /?url=$URL` POST a JSON body to the URL and return the Frame metadata from the response
- `POST /redirect?url=$URL` POST a JSON body to the URL and return the location that the server redirected you to
- `GET /media?url=$URL` Proxy a request for media (image, video, etc) to the server. Returns the full response payload

For more detailed examples, check out the [client](./packages/client)
