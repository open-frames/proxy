export type {
	GetMetadataResponse,
	OpenFrameButton,
	OpenFrameImage,
	OpenFrameResult,
	PostRedirectResponse,
	TransactionResponse,
} from '@open-frames/proxy-types';

type JSONPrimitive = string | number | boolean | null;
// eslint-disable-next-line no-use-before-define
type JSONObject = { [key: string]: JSONValue };
// eslint-disable-next-line no-use-before-define
interface JSONArray extends Array<JSONValue> {}
type JSONValue = JSONPrimitive | JSONObject | JSONArray;

// For a JSON serializable object specifically
export type JSONSerializable = JSONObject;
