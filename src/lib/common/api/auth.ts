import type {
	Node,
	ApiAuthRegisterRequest,
	ApiAuthRegisterResponse,
	ApiAuthApproveRequest,
	ApiAuthApproveResponse,
	ApiAuthRejectRequest,
	ApiAuthRejectResponse,
} from '$lib/common/types';
import { debug } from '../debug';
import { apiPost } from './base';
import { API_URL_AUTH } from './url';

/**
 * Register a pending auth request to a Headscale user (Headscale 0.29+).
 */
export async function authRegister(user: string, authId: string): Promise<Node> {
	const data: ApiAuthRegisterRequest = { user, authId };
	const { node } = await apiPost<ApiAuthRegisterResponse>(`${API_URL_AUTH}/register`, data);
	debug('Auth register: node "' + node.givenName + '" for user "' + user + '"');
	return node;
}

/**
 * Approve a pending authentication request (Headscale 0.29+).
 */
export async function authApprove(authId: string): Promise<void> {
	const data: ApiAuthApproveRequest = { authId };
	await apiPost<ApiAuthApproveResponse>(`${API_URL_AUTH}/approve`, data);
	debug('Auth approved: ' + authId);
}

/**
 * Reject a pending authentication request (Headscale 0.29+).
 */
export async function authReject(authId: string): Promise<void> {
	const data: ApiAuthRejectRequest = { authId };
	await apiPost<ApiAuthRejectResponse>(`${API_URL_AUTH}/reject`, data);
	debug('Auth rejected: ' + authId);
}
