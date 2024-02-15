import { CORS_HEADERS } from "./constants";
import { InvalidRequestError, NoRedirectError } from "./errors";
import { extractMetaTags } from "./parser";
import type { GetMetadataResponse, PostRedirectResponse } from "./types";
import { getUrl, handleError } from "./utils";

export async function handleGet(req: Request) {
  try {
    const url = getUrl(req);
    console.log(`Processing get metadata request for ${url}`);
    if (!url) {
      return new Response("Missing url query param", { status: 400 });
    }
    const data = await downloadAndExtract(url);
    const res: GetMetadataResponse = {
      url,
      extractedTags: data,
    };

    return Response.json(res, {
      headers: {
        "content-type": "application/json",
        ...CORS_HEADERS,
      },
    });
  } catch (e) {
    return handleError(e as Error);
  }
}

export async function handlePost(req: Request) {
  try {
    const url = getUrl(req);
    const body = await req.json();
    console.log(`Processing POST request for ${url}`);
    if (!url) {
      return new Response("Missing url query param", { status: 400 });
    }
    const data = await postAndExtract(url, body);

    const res: GetMetadataResponse = {
      url,
      extractedTags: data,
    };

    return Response.json(res, {
      headers: {
        "content-type": "application/json",
        ...CORS_HEADERS,
      },
    });
  } catch (e) {
    console.error(e);
    if (e instanceof InvalidRequestError) {
      return new Response("Missing url query param", { status: 400 });
    }

    return new Response("Internal server error", { status: 500 });
  }
}

export async function handleRedirect(req: Request) {
  try {
    const url = getUrl(req);
    const body = await req.json();
    console.log(`Processing handleRedirect request for ${url}`);

    const res = await findRedirect(url, body);

    return Response.json(res, {
      headers: {
        "content-type": "application/json",
        ...CORS_HEADERS,
      },
    });
  } catch (e) {
    return handleError(e as Error);
  }
}

export async function handleMedia(req: Request) {
  try {
    const url = getUrl(req);
    console.log(`Processing handleImage request for ${url}`);

    const headers = new Headers();
    const acceptHeader = req.headers.get("accept");
    if (acceptHeader) {
      headers.set("accept", acceptHeader);
    }
    const response = await fetch(url, {
      headers,
    });

    return new Response(response.body, {
      headers: {
        "content-type": response.headers.get("content-type") || "image/png",
        ...CORS_HEADERS,
      },
    });
  } catch (e) {
    return handleError(e as Error);
  }
}

export async function postAndExtract(url: string, body: any) {
  const signal = AbortSignal.timeout(10000);
  const response = await fetch(url, {
    method: "POST",
    redirect: "follow",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
    signal,
  });

  if (response.status >= 400) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const text = await response.text();
  return extractMetaTags(text);
}

export async function downloadAndExtract(url: string) {
  const signal = AbortSignal.timeout(10000);
  const response = await fetch(url, { redirect: "follow", signal });
  //   TODO: Better error handling
  if (response.status >= 400) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  // TODO: Stream response until you see </head> and then stop
  const text = await response.text();
  return extractMetaTags(text);
}

export async function findRedirect(
  url: string,
  body: any
): Promise<PostRedirectResponse> {
  const signal = AbortSignal.timeout(10000);
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
    signal,
    redirect: "manual",
  });
  const location = response.headers.get("location");
  if (response.status !== 302 || !location) {
    throw new NoRedirectError();
  }

  return {
    originalUrl: url,
    redirectedTo: location,
  };
}
