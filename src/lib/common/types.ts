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
		public user: string,
		public id: string,
		public key: string,
		public reusable: boolean,
		public ephemeral: boolean,
		public used: boolean,
		public expiration: string,
		public createdAt: string,
		public aclTags: string[],
	) {}
	isExpired: () => boolean = () => {
		return new Date() > new Date(this.expiration);
	};
}

export class PreAuthKeys {
	constructor(public preAuthKeys: PreAuthKey[]) {}
}

type RouteMachine = {
	id: string;
	createdAt: string;
	deletedAt: string;
	machine: Node;
	node: never;
	prefix: string;
	advertised: boolean;
	enabled: boolean;
	isPrimary: boolean;
};

type RouteNode = {
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

export type Route = RouteMachine | RouteNode;

export type ApiRoute = {
	route: Route;
};

export type ApiRoutes = {
	routes: Route[];
};

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
};

export type ApiNodes = {
	nodes: Node[];
};

export type ApiMachines = {
	machines: Node[];
};

export type ApiNode = {
	node: Node;
};

export type ApiMachine = {
	machine: Node;
};

export type ApiDevice = ApiNode | ApiMachine;
export type ApiDevices = ApiNodes | ApiMachines;

export function isApiNode(device: ApiDevice): device is ApiNode {
	return (device as ApiNode).node !== undefined;
}

export function isApiNodes(devices: ApiDevices): devices is ApiNodes {
	return (devices as ApiNodes).nodes !== undefined;
}

export function isApiMachine(device: ApiDevice): device is ApiMachine {
	return (device as ApiMachine).machine !== undefined;
}

export function isApiMachines(devices: ApiDevices): devices is ApiMachines {
	return (devices as ApiMachines).machines !== undefined;
}

export function getApiDeviceNode(device: ApiDevice): Node {
	if (isApiMachine(device)) {
		return device.machine;
	}
	if (isApiNode(device)) {
		return device.node;
	}
	throw new Error('invalid device type');
}

/*export type Nodes = {
	nodes: Node[];
};*/
