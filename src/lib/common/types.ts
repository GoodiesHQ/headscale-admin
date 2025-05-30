export interface Named {
	id: string;
	createdAt: string;
	name: string;
	givenName?: string;
}

export type ItemTypeName = 'user' | 'node';

export type User = {
	id: string;
	name: string;
	createdAt: string;
	displayName: string;
	email: string;
	providerId: string;
	provider: string;
	profilePicUrl: string;
};

export type ExpirationMessage = {
	message: string;
	color: string;
};

export function isNamed(item: unknown): item is Named {
	if (item != null && typeof item === 'object') {
		return (
			typeof (item as Named).id === 'string' &&
			typeof (item as Named).name === 'string' &&
			typeof (item as Named).createdAt === 'string'
		);
	}
	return false;
}

export function isNode(item: Named): item is Node {
	return isNamed(item) && (item as Node).user !== undefined;
}

export function isUser(item: Named): item is User {
	return isNamed(item) && !isNode(item);
}

export function getUserDisplay(user: User): string {
	if(user.displayName) {
		return user.name + " (" + user.displayName + ")"
	} else {
		return user.name;
	}
}

export function getTypeName(item: Named): ItemTypeName {
	if (isNode(item)) {
		return 'node';
	}
	if (isUser(item)) {
		return 'user';
	}
	throw new Error('Item Provided is an Invalid Type');
}

export type ApiUsers = {
	users: User[];
};

export type ApiUser = {
	user: User;
};

export type ApiPreAuthKeys = {
	preAuthKeys: PreAuthKey[];
};

export type ApiPreAuthKey = {
	preAuthKey: PreAuthKey;
};

export class PreAuthKey {
	constructor(
		public user: User,
		public id: string,
		public key: string,
		public reusable: boolean,
		public ephemeral: boolean,
		public used: boolean,
		public expiration: string,
		public createdAt: string,
		public aclTags: string[],
	) { }
	isExpired: () => boolean = () => {
		return new Date() > new Date(this.expiration);
	};
}

export class PreAuthKeys {
	constructor(public preAuthKeys: PreAuthKey[]) { }
}

/*
export type Route = {
	id: string;
	createdAt: string;
	deletedAt: string;
	node: Node;
	machine: never;
	prefix: string;
	advertised: boolean;
	enabled: boolean;
	isPrimary: boolean;
};

export type ApiRoute = {
	route: Route;
};

export type ApiRoutes = {
	routes: Route[];
};
*/

export type ApiPolicy = {
	policy: string;
	updatedAt?: string;
}

export type Node = {
	id: string;
	machineKey: string;
	nodeKey: string;
	discoKey: string;
	ipAddresses: string[];
	name: string;
	user: User;
	lastSeen: string | null;
	lastSuccessfulUpdate: string | null;
	expiry: string | null;
	preAuthKey: string | null;
	createdAt: string;
	registerMethod:
	| 'REGISTER_METHOD_UNSPECIFIED'
	| 'REGISTER_METHOD_AUTH_KEY'
	| 'REGISTER_METHOD_CLI'
	| 'REGISTER_METHOD_OIDC';
	forcedTags: string[];
	invalidTags: string[];
	validTags: string[];
	givenName: string;
	online: boolean;
	approvedRoutes: string[];
	availableRoutes: string[];
	subnetRoutes: string[];
};

export type ApiNodes = {
	nodes: Node[];
};

export type ApiNode = {
	node: Node;
};

export type ApiMachine = {
	machine: Node;
};

export type ApiKey = {
	id: string;
	createdAt: string;
	prefix: string;
	expiration: string;
	lastSeen: string;
};
export type ApiApiKey = {
	apiKey: string;
};
export type ApiApiKeys = {
	apiKeys: ApiKey[];
};

export type ApiKeyInfo = {
	authorized: boolean | null;
	expires: string; // validity period of the API key. Alert the user if it is within 30 days.
	informedUnauthorized: boolean; // whether or not the user has been informed that the key is unauthorized
	informedExpiringSoon: boolean; // whether or not the user has been informed that the key is expiring soon
};

export type Direction = 'up' | 'down';
export type OnlineStatus = 'online' | 'offline' | 'all';

export type Deployment = {
	// general
	shieldsUp: boolean;
	generateQR: boolean;
	reset: boolean;
	operator: boolean;
	operatorValue: string;
	forceReauth: boolean;
	sshServer: boolean;
	usePreAuthKey: boolean;
	preAuthKeyUser: string;
	preAuthKey: string;
	unattended: boolean;
	// advertise
	advertiseExitNode: boolean;
	advertiseExitNodeLocalAccess: boolean;
	advertiseRoutes: boolean;
	advertiseRoutesValues: string[];
	advertiseTags: boolean;
	advertiseTagsValues: string[];
	// accept
	acceptDns: boolean;
	acceptRoutes: boolean;
	acceptExitNode: boolean;
	acceptExitNodeValue: string;
};
