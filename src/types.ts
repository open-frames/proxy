export type GetMetadataResponse = {
  url: string;
  extractedTags: { [k: string]: string };
};

export type PostRedirectResponse = {
  originalUrl: string;
  redirectedTo: string;
};
