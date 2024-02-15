import type { Server } from "bun";
import { CORS_HEADERS, PORT } from "./constants.ts";
import {
  handleGet,
  handleMedia,
  handlePost,
  handleRedirect,
} from "./handlers.ts";
import { getRequestPath } from "./utils.ts";

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
      if (req.method === "OPTIONS") {
        return new Response("ok", { headers: CORS_HEADERS });
      }

      const path = getRequestPath(req);
      if (req.method === "GET") {
        if (path === "/media") {
          return handleMedia(req);
        }

        if (path === "/") {
          return handleGet(req);
        }
      }

      if (req.method === "POST") {
        if (path === "/redirect") {
          return handleRedirect(req);
        }

        return handlePost(req);
      }

      return new Response("Not found", { status: 404 });
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

process.on("SIGINT", () => {
  console.log("Received SIGINT");
  process.exit(0);
});
