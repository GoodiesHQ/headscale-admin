import { API_URL_NODE, API_URL_POLICY, API_URL_PREAUTHKEY, API_URL_ROUTES, API_URL_USER, apiGet } from '$lib/common/api';
import { ApiNotFoundError } from './base';
import type {
	ApiNodes,
	ApiPolicy,
	ApiPreAuthKeys,
  ApiRoutes,
	ApiUsers,
	Node,
	PreAuthKey,
  Route,
	User,
} from '$lib/common/types';

export async function getPreAuthKeys(
	userIds?: string[],
	init?: RequestInit,
): Promise<PreAuthKey[]> {
	if (userIds == undefined) {
		userIds = (await getUsers(init)).map((u) => u.id);
	}
	const promises: Promise<ApiPreAuthKeys>[] = [];
	let preAuthKeysAll: PreAuthKey[] = [];

	userIds.forEach(async (userId: string) => {
		if(userId != ""){
			promises.push(
				apiGet<ApiPreAuthKeys>(API_URL_PREAUTHKEY + '?user=' + userId, init),
			);
		}
	});

	promises.forEach(async (p) => {
		const { preAuthKeys } = await p;
		preAuthKeysAll = preAuthKeysAll.concat(preAuthKeys);
	});

	await Promise.all(promises);
	return preAuthKeysAll;
}

// Helper function to get preauth keys by usernames (for backward compatibility)
export async function getPreAuthKeysByUsernames(
	usernames?: string[],
	init?: RequestInit,
): Promise<PreAuthKey[]> {
	if (usernames == undefined) {
		return getPreAuthKeys(undefined, init);
	}

	// Get all users to map usernames to user IDs
	const users = await getUsers(init);
	const userIds: string[] = [];

	usernames.forEach((username: string) => {
		const user = users.find(u => u.name === username);
		if (user) {
			userIds.push(user.id);
		}
	});

	return getPreAuthKeys(userIds, init);
}

type GetUserOptions = 
	{id: string, name?: never, email?: never} |
	{id?: never, name: string, email?: never} |
	{id?: never, name?: never, email: string}

export async function getUsers(init?: RequestInit, options?: GetUserOptions): Promise<User[]> {
	let url = API_URL_USER;
	if (options !== undefined){
		if(options.id !== undefined) {
			url += "?id=" + options.id
		} else if (options.name !== undefined) {
			url += "?name=" + options.name
		} else if (options.email !== undefined) {
			url += "?email=" + options.email
		} else {
			throw new Error("Invalid User Parameters")
		}
	}
	const { users } = await apiGet<ApiUsers>(url, init);
	return users;
}

export async function getNodes(): Promise<Node[]> {
	const { nodes } = await apiGet<ApiNodes>(API_URL_NODE);
	return nodes;
}

export async function getRoutes(): Promise<Route[]> {
	try {
		// Try the primary routes endpoint first
		const { routes } = await apiGet<ApiRoutes>(API_URL_ROUTES);
		return routes;
	} catch (error) {
		// Check if this is a 404 error (routes endpoint not available)
		if (error instanceof ApiNotFoundError) {
			// Fallback to extracting routes from nodes endpoint
			return await getRoutesFromNodes();
		}
		// Re-throw other errors
		throw error;
	}
}

/**
 * Fallback function to extract route information from nodes endpoint
 * for newer Headscale versions where routes are included in node data
 */
async function getRoutesFromNodes(): Promise<Route[]> {
	const { nodes } = await apiGet<ApiNodes>(API_URL_NODE);
	const routes: Route[] = [];

	nodes.forEach(node => {
		// Extract routes from the three route fields in newer Headscale versions
		const allRouteStrings = [
			...(node.approvedRoutes || []),
			...(node.availableRoutes || []),
			...(node.subnetRoutes || [])
		];

		// Remove duplicates and create Route objects
		const uniqueRoutes = [...new Set(allRouteStrings)];

		uniqueRoutes.forEach((routePrefix) => {
			// Generate a synthetic route ID based on node ID and route prefix
			const routeId = `${node.id}-${routePrefix.replace(/[^a-zA-Z0-9]/g, '-')}`;

			// Determine if route is enabled (approved routes are considered enabled)
			const isEnabled = (node.approvedRoutes || []).includes(routePrefix);

			// Create Route object matching the expected format
			const route: Route = {
				id: routeId,
				createdAt: node.createdAt, // Use node creation time as fallback
				deletedAt: '', // Not available in node data
				node: node,
				machine: undefined as never, // Legacy field
				prefix: routePrefix,
				advertised: (node.availableRoutes || []).includes(routePrefix) ||
						   (node.subnetRoutes || []).includes(routePrefix),
				enabled: isEnabled,
				isPrimary: false // Cannot determine from node data
			};

			routes.push(route);
		});
	});

	return routes;
}

export async function getPolicy(): Promise<string> {
	const { policy } = await apiGet<ApiPolicy>(API_URL_POLICY)
	return policy
}
