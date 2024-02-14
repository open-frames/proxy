import { beforeAll, afterAll, describe, expect, test } from "bun:test";
import { downloadAndExtract } from "../handlers";
import type { Server } from "bun";

async function serveHtml(filePath: string, port: number = 3000) {
  const html = await Bun.file(filePath).text();
  return Bun.serve({
    port,
    fetch(req) {
      return new Response(html, {
        headers: {
          "content-type": "text/html",
        },
      });
    },
  });
}

const testCases = [
  {
    name: "github",
    expectedTags: {
      "og:title":
        "oven-sh/bun: Incredibly fast JavaScript runtime, bundler, test runner, and package manager – all in one",
      "og:image":
        "https://opengraph.githubassets.com/14c49397fbfdc07e07d589d265396ddb65eda364617f14d1976937a842bb0983/oven-sh/bun",
      "og:image:alt":
        "Incredibly fast JavaScript runtime, bundler, test runner, and package manager – all in one - oven-sh/bun: Incredibly fast JavaScript runtime, bundler, test runner, and package manager – all in one",
      "og:site_name": "Github",
    },
  },
  {
    name: "ogp",
    expectedTags: {
      "og:title": "Open Graph protocol",
      "og:type": "website",
      "og:url": "https://ogp.me/",
      "og:image": "https://ogp.me/logo.png",
    },
  },
];

let port = 6000;
for (const testCase of testCases) {
  port++;
  describe(testCase.name, () => {
    let server: Server | undefined;

    beforeAll(async () => {
      server = await serveHtml(`src/test/fixtures/${testCase.name}.html`, port);
    });

    afterAll(() => {
      server?.stop();
    });

    test("can extract tags", async () => {
      const data = await downloadAndExtract(`http://localhost:${server!.port}`);
      expect(data).toMatchObject(
        expect.objectContaining(testCase.expectedTags)
      );
    });
  });
}
