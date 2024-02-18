export type PostRedirectResponse = {
	originalUrl: string;
	redirectedTo: string;
};

export type DeepPartial<T> = T extends object
	? {
			[P in keyof T]?: DeepPartial<T[P]>;
		}
	: T;

export type OpenFrameImage = {
	content: string;
	aspectRatio?: '1.91.1' | '1:1';
	alt?: string;
};

export type OpenFrameButton =
	| {
			action: 'link' | 'mint';
			target: string;
			label: string;
	  }
	| {
			action: 'post' | 'post_redirect';
			target?: string;
			label: string;
	  };

export type TextInput = {
	content: string;
};

export type AcceptedFrameClients = Record<string, string>;

export type OpenFrameResult = {
	acceptedClients: AcceptedFrameClients;
	image: OpenFrameImage;
	postUrl?: string;
	textInput?: TextInput;
	buttons?: { [k: string]: OpenFrameButton };
	ogImage: string;
};

export type GetMetadataResponse = {
	url: string;
	extractedTags: { [k: string]: string };
	frameInfo?: OpenFrameResult;
};
