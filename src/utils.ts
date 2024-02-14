import { InvalidRequestError, NoRedirectError } from "./errors";

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
