import { beforeAll, afterAll, describe, expect, test } from "bun:test";
import { findRedirect } from "../handlers";
import type { Server } from "bun";
import { NoRedirectError } from "../errors";
import { start } from "..";

describe("postRedirect", () => {
  const PORT = 7777;
  const REDIRECT_DESTINATION = "https://example.com";

  let server: Server;
  beforeAll(() => {
    server = Bun.serve({
      port: PORT,
      fetch(req: Request) {
        const path = new URL(req.url).pathname;
        const statusCode = parseInt(path.split("/")[1]);
        if (statusCode === 200) {
          return new Response("ok");
        }

        return new Response("redirected", {
          status: statusCode,
          headers: {
            location: REDIRECT_DESTINATION,
          },
        });
      },
    });
  });

  afterAll(() => {
    server?.stop();
  });

  test("should handle 302 correctly", async () => {
    const url = `http://localhost:${PORT}/302`;
    const data = await findRedirect(url, {});
    expect(data).toEqual({
      originalUrl: url,
      redirectedTo: REDIRECT_DESTINATION,
    });
  });

  test("should error on 301", async () => {
    const url = `http://localhost:${PORT}/301`;
    expect(findRedirect(url, {})).rejects.toThrow(new NoRedirectError());
  });

  test("should error on 200", async () => {
    const url = `http://localhost:${PORT}/200`;
    expect(findRedirect(url, {})).rejects.toThrow(new NoRedirectError());
  });
});

describe("media", () => {
  const MEDIA_PORT = 7778;
  const PROXY_PORT = 7779;

  let mediaServer: Server;
  let proxyServer: Server;

  beforeAll(() => {
    mediaServer = Bun.serve({
      port: MEDIA_PORT,
      fetch(req: Request) {
        const url = new URL(req.url);
        const path = url.pathname.split("/")[1];
        const contentType = url.searchParams.get("content-type");
        console.log(
          `Got a request for ${req.url} with content type ${contentType}`
        );
        const file = Bun.file(`src/test/fixtures/${path}`);

        return new Response(file, {
          status: 200,
          headers: {
            "content-type": contentType || "image/png",
          },
        });
      },
    });

    proxyServer = start(PROXY_PORT);
  });

  afterAll(() => {
    mediaServer?.stop();
    proxyServer.stop();
  });

  test("should stream image", async () => {
    const mediaUrl = `http://localhost:${MEDIA_PORT}/ogp.png?content-type=image/png`;
    const url = `http://localhost:${PROXY_PORT}/media?url=${encodeURIComponent(
      mediaUrl
    )}`;
    const response = await fetch(url);
    expect(response.headers.get("content-type")).toEqual("image/png");
    const blob = await response.arrayBuffer();
    const actualFile = await Bun.file(
      `src/test/fixtures/ogp.png`
    ).arrayBuffer();
    expect(blob).toEqual(actualFile);
  });

  test("should respect content type", async () => {
    const mediaUrl = `http://localhost:${MEDIA_PORT}/ogp.png?content-type=image/jpeg`;
    const url = `http://localhost:${PROXY_PORT}/media?url=${encodeURIComponent(
      mediaUrl
    )}`;
    const response = await fetch(url);
    // Use the content type from the media server, not just the file name
    expect(response.headers.get("content-type")).toEqual("image/jpeg");
  });
});
