# Headscale 0.28 Breaking Changes Analysis

This document analyzes all breaking changes in Headscale 0.28 and tracks which ones have been addressed in this codebase.

## Summary

| Breaking Change | Status | Action Required |
|----------------|--------|-----------------|
| Node Tags API Change | ✅ FIXED | Done in commit 4fb6c26 |
| PreAuthKey API Change | ⚠️ NEEDS FIX | Update API calls to use ID-based operations |
| Tags Resolution Changes | ✅ HANDLED | Backend behavior, works with our changes |
| Database Migration | ✅ N/A | Server-side only |
| Remove Node Move | ✅ N/A | Not implemented in UI |
| OIDC Email Verification | ✅ N/A | Server config only |
| SSH Wildcard Removal | ⚠️ NEEDS REVIEW | ACL editor allows wildcards |
| SSH Policy Validation | ⚠️ NEEDS REVIEW | No validation in ACL editor |

---

## 1. ✅ Node Tags API Change (FIXED)

### Breaking Change
The Node message in the gRPC/REST API has been simplified:
- **Removed**: `forcedTags`, `invalidTags`, `validTags` fields
- **Added**: Single `tags` field containing all applied tags

### What We Fixed
- ✅ Updated `Node` type in `src/lib/common/types.ts`
- ✅ Simplified `NodeTags.svelte` component (~70 lines removed)
- ✅ Updated `filterNode()` in `src/lib/common/funcs.ts`
- ✅ Bumped version to 0.28.0 in `src/lib/common/debug.ts`
- ✅ Updated README examples to reference Headscale 0.28

### Impact
- UI no longer shows distinction between forced/valid/invalid tags
- Less visibility into ACL-rejected tags
- Simpler, cleaner code

---

## 2. ⚠️ PreAuthKey API Change (NEEDS FIX)

### Breaking Change
PreAuthKey operations now use ID-based operations instead of user+key combinations.

**Before (0.27):**
```bash
# Expire: POST /api/v1/preauthkey/expire
{ "user": "user-id", "key": "key-string" }
```

**After (0.28):**
```bash
# Expire: POST /api/v1/preauthkey/{id}/expire
# (no body needed)
```

### Current Implementation
**File**: `src/lib/common/api/modify.ts`
```typescript
export async function expirePreAuthKey(pak: PreAuthKey) {
    const path = `${API_URL_PREAUTHKEY}/expire`;
    const data = { user: pak.user.id, key: pak.key };  // ❌ OLD API
    await apiPost(path, data);
}
```

**File**: `src/lib/common/api/get.ts`
```typescript
export async function getPreAuthKeys(user_ids?: string[], init?: RequestInit): Promise<PreAuthKey[]> {
    // Still iterates over users to fetch keys
    user_ids.forEach(async (user_id: string) => {
        promises.push(
            apiGet<ApiPreAuthKeys>(API_URL_PREAUTHKEY + '?user=' + user_id, init),
        );
    });
}
```

### Required Changes

#### 1. Update `expirePreAuthKey()` in `src/lib/common/api/modify.ts`
```typescript
export async function expirePreAuthKey(pak: PreAuthKey) {
    const path = `${API_URL_PREAUTHKEY}/${pak.id}/expire`;
    await apiPost(path, undefined);  // No body needed
}
```

#### 2. Add `deletePreAuthKey()` in `src/lib/common/api/delete.ts`
```typescript
export async function deletePreAuthKey(pak: PreAuthKey) {
    const path = `${API_URL_PREAUTHKEY}/${pak.id}`;
    await apiDelete(path);
}
```

#### 3. Update `getPreAuthKeys()` in `src/lib/common/api/get.ts`
```typescript
export async function getPreAuthKeys(user_ids?: string[], init?: RequestInit): Promise<PreAuthKey[]> {
    // In 0.28, list all keys without user filter
    const { preAuthKeys } = await apiGet<ApiPreAuthKeys>(API_URL_PREAUTHKEY, init);
    
    // If user_ids provided, filter client-side for backwards compatibility
    if (user_ids !== undefined) {
        return preAuthKeys.filter(pak => user_ids.includes(pak.user.id));
    }
    
    return preAuthKeys;
}
```

#### 4. Update `createPreAuthKey()` in `src/lib/common/api/create.ts`
The `user` field in the request body is now optional (for tracking only):
```typescript
export async function createPreAuthKey(
    user: User,
    ephemeral: boolean,
    reusable: boolean,
    expiration: Date | string,
) {
    const data = {
        user: user.id,  // Optional in 0.28, but keep for tracking
        reusable,
        ephemeral,
        expiration: new Date(expiration).toISOString(),
    };
    const { preAuthKey } = await apiPost<ApiPreAuthKey>(API_URL_PREAUTHKEY, data);
    debug('Created PreAuthKey for user "' + user.name + '"');
    return preAuthKey;
}
```

### Testing Required
- Create PreAuthKey via UI
- List PreAuthKeys (should show all keys, not just per-user)
- Expire PreAuthKey via UI
- Delete PreAuthKey via UI (if implemented)

---

## 3. ✅ Tags Resolution Changes (HANDLED)

### Breaking Change
- Tags now resolved from node's stored `tags` field only
- `--advertise-tags` processed during registration, not on every policy evaluation
- PreAuthKey tagged devices ignore `--advertise-tags` from clients

### Status
**No action required** - This is backend behavior that works with our simplified tag model.

---

## 4. ✅ Database Migration (N/A)

### Breaking Change
Database migration support removed for pre-0.25.0 databases.

### Status
**No action required** - This is server-side only. Headscale Admin UI doesn't handle migrations.

---

## 5. ✅ Remove Node Move Functionality (N/A)

### Breaking Change
- `headscale nodes move` CLI command removed
- `MoveNode` API endpoint removed

### Status
**No action required** - The UI never implemented this feature. Verified with:
```bash
grep -r "moveNode\|MoveNode" src/
# No results
```

However, there IS a `changeNodeOwner()` function in `src/lib/common/api/modify.ts`:
```typescript
export async function changeNodeOwner(n: Node, newUserID: string): Promise<Node> {
    const path = `${API_URL_NODE}/${n.id}/user`;
    const { node } = await apiPost<ApiNode>(path, {user: newUserID});
    debug('Re-assigned Node from "' + n.user.name + '" to "' + node.user.name + '"');
    return node;
}
```

**VERIFY**: Check if this endpoint still exists in Headscale 0.28. If not, this function should be removed.

---

## 6. ✅ OIDC Email Verification (N/A)

### Breaking Change
New `oidc.email_verified_required` config option controls email verification.

### Status
**No action required** - This is server configuration only. The UI doesn't handle OIDC settings.

---

## 7. ⚠️ SSH Wildcard Removal (NEEDS REVIEW)

### Breaking Change
Wildcard (`*`) is no longer supported as an SSH destination.

**Before (0.27):**
```json
{ "action": "accept", "src": ["group:admins"], "dst": ["*"], "users": ["root"] }
```

**After (0.28):**
```json
{ "action": "accept", "src": ["group:admins"], "dst": ["autogroup:member", "autogroup:tagged"], "users": ["root"] }
```

### Current Implementation
The ACL editor in `src/lib/cards/acl/SshRuleListCard.svelte` allows arbitrary input including wildcards.

### Recommendations

#### Option 1: Add Validation
Add client-side validation to prevent wildcard usage:
```typescript
function validateSshDst(dst: string[]): string | null {
    if (dst.includes('*')) {
        return 'Wildcard (*) is no longer supported. Use autogroup:member or autogroup:tagged instead.';
    }
    return null;
}
```

#### Option 2: Auto-Migration
When loading ACL with wildcard in SSH rules, automatically suggest replacement:
```typescript
function migrateSshWildcard(dst: string[]): string[] {
    return dst.map(d => d === '*' ? 'autogroup:member,autogroup:tagged' : d);
}
```

#### Option 3: Documentation Only
Add a warning in the UI near SSH rule editing that wildcards are not supported.

### Testing Required
1. Load ACL with wildcard in SSH rules
2. Verify Headscale 0.28 rejects it with appropriate error
3. Test UI behavior when save fails

---

## 8. ⚠️ SSH Policy Validation (NEEDS REVIEW)

### Breaking Change
SSH source/destination validation now enforces Tailscale's security model:

**Rules:**
1. ❌ Tags cannot SSH to user-owned devices
   - `tag:*` or `autogroup:tagged` as source → cannot have `username@` or `autogroup:member` as destination

2. ❌ Username destinations require same-user source
   - If dst is `alice@`, src must be `alice@` only (or use `autogroup:self`)

3. ❌ Group to specific user not allowed
   - `group:admins` → `alice@` is invalid (use `autogroup:self`)

**Valid patterns:**
```json
// Users/groups can SSH to their own devices
{"src": ["group:admins"], "dst": ["autogroup:self"], ...}

// Users/groups can SSH to tagged devices
{"src": ["group:admins"], "dst": ["autogroup:tagged"], ...}

// Tagged devices can SSH to other tagged devices
{"src": ["autogroup:tagged"], "dst": ["autogroup:tagged"], ...}

// Same user can SSH to their own devices
{"src": ["alice@"], "dst": ["alice@"], ...}
```

### Current Implementation
The ACL editor (`src/lib/cards/acl/SshRuleListCard.svelte` and `src/lib/common/acl.svelte.ts`) does NOT validate these rules.

### Recommendations

#### Option 1: Add Comprehensive Validation
Add validation function to `ACLBuilder` class:

```typescript
class ACLBuilder {
    validateSshRule(rule: AclSshRule): string[] {
        const errors: string[] = [];
        
        // Check if src contains tags and dst contains user destinations
        const srcHasTags = rule.src.some(s => 
            s.startsWith('tag:') || s === 'autogroup:tagged'
        );
        const dstHasUserDestinations = rule.dst.some(d => 
            d.endsWith('@') || d === 'autogroup:member' || d === 'autogroup:self'
        );
        
        if (srcHasTags && dstHasUserDestinations) {
            errors.push('Tags cannot SSH to user-owned devices. Use autogroup:tagged instead.');
        }
        
        // Check username destinations
        const usernameDestinations = rule.dst.filter(d => d.endsWith('@'));
        if (usernameDestinations.length > 0) {
            usernameDestinations.forEach(dst => {
                const username = dst;
                if (!rule.src.includes(username)) {
                    errors.push(`Destination ${dst} requires ${username} as source. Use autogroup:self for same-user access.`);
                }
            });
        }
        
        return errors;
    }
    
    validateAllSshRules(): { idx: number, errors: string[] }[] {
        if (!this.ssh) return [];
        
        return this.ssh
            .map((rule, idx) => ({ idx, errors: this.validateSshRule(rule) }))
            .filter(result => result.errors.length > 0);
    }
}
```

#### Option 2: Show Warnings
Display warnings in the UI without blocking saves:
```svelte
{#if validationErrors.length > 0}
    <div class="alert variant-ghost-warning">
        <p>SSH Rule may be invalid in Headscale 0.28:</p>
        <ul>
            {#each validationErrors as error}
                <li>{error}</li>
            {/each}
        </ul>
    </div>
{/if}
```

#### Option 3: Server-Side Only
Let Headscale server validate and return errors. Show error in toast when save fails.

### Testing Required
1. Create SSH rule with tag source to user destination
2. Verify Headscale 0.28 rejects it
3. Test UI error handling

---

## Recommended Action Plan

### High Priority (Required for 0.28 Compatibility)

1. **Fix PreAuthKey API calls** ⚠️ CRITICAL
   - Update `expirePreAuthKey()` to use ID-based endpoint
   - Update `getPreAuthKeys()` to fetch all keys
   - Add `deletePreAuthKey()` function
   - Test all PreAuthKey operations

2. **Verify changeNodeOwner endpoint** ⚠️ BREAKING
   - Check if `/api/v1/node/{id}/user` endpoint still exists
   - If removed, delete `changeNodeOwner()` function
   - Check if UI uses this function anywhere

### Medium Priority (User Experience)

3. **Add SSH wildcard validation** ⚠️ RECOMMENDED
   - Warn users when using wildcard in SSH destinations
   - Suggest alternatives (autogroup:member, autogroup:tagged)

4. **Add SSH policy validation** ⚠️ RECOMMENDED
   - Validate SSH rules against new security model
   - Show helpful error messages

### Low Priority (Nice to Have)

5. **ACL migration helper**
   - Detect old ACL patterns
   - Suggest 0.28-compatible alternatives

---

## Testing Checklist

### Node Tags
- [x] List nodes shows tags correctly
- [x] Add/remove tags works
- [x] Search/filter by tags works
- [ ] Verify with actual Headscale 0.28 instance

### PreAuthKeys
- [ ] Create PreAuthKey
- [ ] List all PreAuthKeys (not filtered by user)
- [ ] Expire PreAuthKey by ID
- [ ] Delete PreAuthKey by ID
- [ ] Verify expired keys are hidden/marked correctly

### SSH Rules
- [ ] Load ACL with wildcard - check behavior
- [ ] Create SSH rule with invalid pattern - check error
- [ ] Save ACL with valid SSH rules - verify success

### General
- [ ] All API calls use correct 0.28 endpoints
- [ ] Error messages are helpful and actionable
- [ ] No console errors or warnings
- [ ] UI handles server validation errors gracefully

---

## Files That Need Changes

```
src/lib/common/api/modify.ts     - Fix expirePreAuthKey()
src/lib/common/api/get.ts        - Fix getPreAuthKeys()
src/lib/common/api/delete.ts     - Add deletePreAuthKey()
src/lib/common/acl.svelte.ts     - Add SSH validation (optional)
src/lib/cards/acl/SshRuleListCard.svelte - Show validation warnings (optional)
```

## Conclusion

**Current Status**: Partially compatible with Headscale 0.28

The major Node tags API change has been fixed, but PreAuthKey API operations still use the old 0.27 endpoints and will fail with Headscale 0.28.

**Priority**: Fix PreAuthKey API calls before merging to production or creating a release.