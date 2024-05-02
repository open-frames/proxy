export type PostRedirectResponse = {
	originalUrl: string;
	redirectedTo: string;
};

export type OpenFrameImage = {
	content: string;
	aspectRatio?: '1.91:1' | '1:1';
	alt?: string;
};

export type OpenFrameButton =
	| {
			action: 'link' | 'mint';
			target: string;
			label: string;
			post_url: never;
	  }
	| {
			action: 'post' | 'post_redirect';
			target?: string;
			label: string;
			post_url?: string;
	  }
	| {
			action: 'tx';
			target: string;
			label: string;
			post_url: string;
	  };

export type OpenFrameButtonResult =
	| {
			action: 'link' | 'mint';
			target: string;
			label: string;
			postUrl?: never;
	  }
	| {
			action: 'post' | 'post_redirect';
			target?: string;
			label: string;
			postUrl?: string;
	  }
	| {
			action: 'tx';
			target: string;
			label: string;
			postUrl: string;
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
	buttons?: { [k: string]: OpenFrameButtonResult };
	ogImage: string;
	state?: string;
};

export type GetMetadataResponse = {
	url: string;
	extractedTags: { [k: string]: string };
	frameInfo?: OpenFrameResult;
};

export type TransactionResponse = {
	chainId: string;
	method: 'eth_sendTransaction';
	params: {
		abi: Array<unknown>;
		to: string;
		data?: string;
		value?: string;
	};
};
