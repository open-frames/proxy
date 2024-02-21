export type { GetMetadataResponse, OpenFrameButton, OpenFrameImage, OpenFrameResult, PostRedirectResponse } from '@open-frames/proxy';

type JSONPrimitive = string | number | boolean | null;
// eslint-disable-next-line no-use-before-define
type JSONObject = { [key: string]: JSONValue };
// eslint-disable-next-line no-use-before-define
interface JSONArray extends Array<JSONValue> {}
type JSONValue = JSONPrimitive | JSONObject | JSONArray;

// For a JSON serializable object specifically
export type JSONSerializable = JSONObject;
