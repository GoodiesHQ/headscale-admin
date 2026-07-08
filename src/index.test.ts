import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/States.svelte', () => ({
	App: {
		debug: {
			value: false,
		},
	},
}));

import { redactDebugData } from '$lib/common/debug';

describe('debug redaction', () => {
	it('masks sensitive key fields without dropping safe data', () => {
		const result = redactDebugData({
			name: 'node-1',
			nodeKey: 'nodekey:1234567890abcdef',
			preAuthKey: {
				id: 'pak-1',
				key: 'pak-1234567890abcdef',
			},
		});

		expect(result).toEqual({
			name: 'node-1',
			nodeKey: 'node...cdef',
			preAuthKey: {
				id: 'pak-1',
				key: 'pak-...cdef',
			},
		});
	});

	it('handles circular references and repeated objects separately', () => {
		const shared = { name: 'shared' };
		const data: {
			first: typeof shared;
			second: typeof shared;
			self?: unknown;
		} = {
			first: shared,
			second: shared,
		};
		data.self = data;

		const result = redactDebugData(data);

		expect(result).toEqual({
			first: { name: 'shared' },
			second: { name: 'shared' },
			self: '[Circular]',
		});
	});
});
