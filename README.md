# Open Frames Proxy

A simple proxy server to read Frames and Open Graph tags from a URL without revealing client IP addresses.

## Why do Frames developers need a proxy?

### 🙈 No IP leaks 🙈

If your client application is interacting with Frames servers to parse HTML and load Frames, loading images that come from Frames or Open Graph tags, or sending POST payloads to Frames servers: _you are leaking client IP addresses to Frames devs_. POST payloads are particularly dangerous, since they actually can tell the Frames developer the private IP address of a blockchain account.

A malicious developer can use this information to de-anonymize anoymous accounts, target phishing attacks to an account's home city, and determine if two wallets are controlled by the same person.

### 📃 Simplify HTML parsing 📃

In order to make sense of a Frame or page with Open Graph tags, you need to download and parse a HTML document and extract the information you need from meta tags (images, buttons, what URL to post to, etc). This can be an error-prone process, and requires client developers to be up-to-date on all the nuances of the Frames spec.

With this proxy, all parsing of the HTML and processing of the metatags happens on the server. Client devs can simply focus on rendering the information from a well-shaped data type.

Here is an example of a parsed Frame:

```json
{
	"acceptedClients": { "farcaster": "vNext" },
	"image": { "content": "https://fc-polls-five.vercel.app/api/image?id=01032f47-e976-42ee-9e3d-3aac1324f4b8" },
	"postUrl": "https://fc-polls-five.vercel.app/api/vote?id=01032f47-e976-42ee-9e3d-3aac1324f4b8",
	"buttons": { "1": { "label": "Yes", "action": "post" }, "2": { "label": "No", "action": "post" } }
}
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

## Contributing to this repository

To install dependencies you must be using yarn@v4

```bash
# Enable corepack
corepack enable
# Set the packageManager to the value specified in this package.json
corepack prepare
# Install dependencies
yarn
```
