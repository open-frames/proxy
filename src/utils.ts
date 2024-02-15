import { InvalidRequestError, NoRedirectError } from "./errors";
import mime from "mime";

export function getUrl(req: Request) {
  const url = new URL(req.url).searchParams.get("url");
  if (!url) {
    throw new InvalidRequestError();
  }
  return url;
}

export function getRequestPath(req: Request): string {
  return new URL(req.url).pathname;
}

export function handleError(e: Error) {
  console.error(e);
  if (e instanceof InvalidRequestError) {
    return new Response("Missing url query param", { status: 400 });
  }

  if (e instanceof NoRedirectError) {
    return new Response("No redirect found", { status: 404 });
  }

  return new Response("Internal server error", { status: 500 });
}

export function getMimeType(url: string): string | null {
  const extension = new URL(url).pathname.split(".").pop();
  if (!extension) {
    return null;
  }

  return mime.getType(extension);
}

export function getProxySafeMediaHeaders(req: Request): Headers {
  const headers = new Headers();
  const acceptHeader = req.headers.get("accept");
  if (acceptHeader) {
    headers.set("accept", acceptHeader);
  }

  const acceptEncodingHeader = req.headers.get("accept-encoding");
  if (acceptEncodingHeader) {
    headers.set("accept-encoding", acceptEncodingHeader);
  }

  return headers;
}
