// Prefixes for frames. Deliberately leaving out the trailing colon on fc:frame to allow for matching
// that token exactly. Requires some special care later to ensure it
export const FRAMES_PREFIXES = ['of:', 'fc:frame', 'hey:portal'] as const;
// OpenGraph tag prefixes + frames prefixes
export const TAG_PREFIXES = ['og:', ...FRAMES_PREFIXES] as const;
// Possible values for the action field in a button
export const ALLOWED_ACTIONS = ['post', 'post_redirect', 'link', 'mint'] as const;

// CORS headers to be attached to all requests.
// Leaving things wide open for now
export const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'OPTIONS, GET, POST',
	'Access-Control-Allow-Headers': '*',
};
