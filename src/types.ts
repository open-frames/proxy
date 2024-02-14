export type GetMetadataResponse = {
  url: string;
  metaTags: { [k: string]: string };
};

export type PostRedirectResponse = {
  originalUrl: string;
  redirectedTo: string;
};
