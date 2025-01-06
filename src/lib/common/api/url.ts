export type ApiEndpoints = {
	User: string;
	Node: string;
	Routes: string;
	ApiKey: string;
	PreAuthKey: string;
	Policy: string;
	Debug: string;
};

export const API_URL_USER = '/api/v1/user';
export const API_URL_NODE = '/api/v1/node';
export const API_URL_POLICY = '/api/v1/policy';
export const API_URL_MACHINE = '/api/v1/machine';
export const API_URL_ROUTES = '/api/v1/routes';
export const API_URL_APIKEY = '/api/v1/apikey';
export const API_URL_PREAUTHKEY = '/api/v1/preauthkey';
export const API_URL_DEBUG = '/api/v1/debug';

export function defaultApiEndpoints(): ApiEndpoints {
	return {
		User: API_URL_USER,
		Node: API_URL_MACHINE,
		Routes: API_URL_ROUTES,
		ApiKey: API_URL_APIKEY,
		PreAuthKey: API_URL_PREAUTHKEY,
		Policy: API_URL_POLICY,
		Debug: API_URL_DEBUG,
	};
}

/*export function urlJoin<T extends { toString(): string }>(...parts: T[]): string {
	return parts.map((part) => part.toString()).join('/');
}*/
