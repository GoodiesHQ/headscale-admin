/**
 * API Response Mappers
 * 
 * Converts API responses to frontend types with proper handling of legacy/new formats
 * and missing fields.
 */

import { PreAuthKey, type User } from '$lib/common/types';
import { debug } from '../debug';

/**
 * Maps raw API response to PreAuthKey object
 * Handles both new and legacy (old format) pre-auth keys
 */
export function mapApiPreAuthKey(data: any, user: User): PreAuthKey {
	// Handle snake_case from gRPC-Gateway
	const id = data.id || data.ID || '';
	const key = data.key || data.Key || '';
	const reusable = data.reusable ?? data.Reusable ?? false;
	const ephemeral = data.ephemeral ?? data.Ephemeral ?? false;
	const used = data.used ?? data.Used ?? false;
	const expiration = data.expiration || data.Expiration || '';
	const createdAt = data.createdAt || data.CreatedAt || data.created_at || '';
	const aclTags = data.aclTags || data.AclTags || data.acl_tags || [];

	// Validate required fields
	if (!id || !key) {
		debug('Invalid PreAuthKey data:', { id, key });
		throw new Error('Invalid PreAuthKey: missing id or key');
	}

	// Create PreAuthKey instance
	const pak = new PreAuthKey(
		user,
		String(id),
		key,
		Boolean(reusable),
		Boolean(ephemeral),
		Boolean(used),
		String(expiration),
		String(createdAt),
		Array.isArray(aclTags) ? aclTags : []
	);

	debug('Mapped PreAuthKey:', {
		id: pak.id,
		keyLen: pak.key.length,
		keyPreview: pak.key.substring(0, 20),
		reusable: pak.reusable,
		ephemeral: pak.ephemeral,
		used: pak.used,
		isLegacy: !pak.key.includes('*') && !pak.key.startsWith('hskey-auth-'),
		hasExpiration: !!pak.expiration
	});

	return pak;
}

/**
 * Maps raw API response list to PreAuthKey array
 */
export function mapApiPreAuthKeys(dataList: any[], user: User): PreAuthKey[] {
	return dataList
		.map(data => {
			try {
				return mapApiPreAuthKey(data, user);
			} catch (e) {
				debug('Failed to map PreAuthKey:', data, e);
				return null;
			}
		})
		.filter((pak): pak is PreAuthKey => pak !== null);
}
