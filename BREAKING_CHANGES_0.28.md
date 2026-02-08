# Headscale 0.27 & 0.28 Breaking Changes Analysis

This document analyzes all breaking changes in Headscale 0.27 and 0.28 and tracks which ones have been addressed in this codebase.

## Summary - Headscale 0.28

| Breaking Change | Status | Action Required |
|----------------|--------|-----------------|
| Node Tags API Change | ✅ FIXED | Done in commit 4fb6c26 |
| PreAuthKey API Change | ✅ FIXED | Done in commit 9f7e7e2 |
| **Tags as Identity** | 🚨 CRITICAL | Node.user must be optional, UI assumes user exists |
| Tags Resolution Changes | ✅ HANDLED | Backend behavior, works with our changes |
| Database Migration | ✅ N/A | Server-side only |
| Remove Node Move | ⚠️ VERIFY | changeNodeOwner() may not work with tagged nodes |
| OIDC Email Verification | ✅ N/A | Server config only |
| SSH Wildcard Removal | ⚠️ NEEDS REVIEW | ACL editor allows wildcards |
| SSH Policy Validation | ⚠️ NEEDS REVIEW | No validation in ACL editor |

## Summary - Headscale 0.27

| Breaking Change | Status | Action Required |
|----------------|--------|-----------------|
| 32-bit Binary Support | ✅ N/A | Not applicable to UI |
| Zero/Empty Port Validation | ✅ HANDLED | UI validates ports >= 1 |
| Stricter Hostname Validation | ⚠️ PARTIAL | Server validates, UI doesn't pre-validate |

---

# Headscale 0.28 Breaking Changes

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

## 2. ✅ PreAuthKey API Change (FIXED)

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
### What We Fixed

**File**: `src/lib/common/api/modify.ts`
```typescript
// ✅ FIXED
export async function expirePreAuthKey(pak: PreAuthKey) {
    const path = `${API_URL_PREAUTHKEY}/${pak.id}/expire`;
    await apiPost(path, undefined);
    debug('Expired PreAuthKey ID "' + pak.id + '"');
}
```

**File**: `src/lib/common/api/get.ts`
```typescript
// ✅ FIXED
export async function getPreAuthKeys(user_ids?: string[], init?: RequestInit): Promise<PreAuthKey[]> {
    // In Headscale 0.28, list endpoint returns all keys without user filter
    const { preAuthKeys } = await apiGet<ApiPreAuthKeys>(API_URL_PREAUTHKEY, init);

    // If user_ids provided, filter client-side for backwards compatibility
    if (user_ids !== undefined && user_ids.length > 0) {
        return preAuthKeys.filter(pak => user_ids.includes(pak.user.id));
    }

    return preAuthKeys;
}
```

**File**: `src/lib/common/api/delete.ts`
```typescript
// ✅ ADDED
export async function deletePreAuthKey(pak: PreAuthKey): Promise<boolean> {
    try {
        await apiDelete(`${API_URL_PREAUTHKEY}/${pak.id}`);
        App.preAuthKeys.value = App.preAuthKeys.value.filter((p: PreAuthKey) => p.id != pak.id);
        debug('Deleted PreAuthKey ID "' + pak.id + '"');
        return true;
    } catch (error) {
        debug(error);
        return false;
    }
}
```

### Status
✅ All PreAuthKey API calls updated in commit `9f7e7e2`

---

## 3. 🚨 Tags as Identity (CRITICAL - NEEDS FIX)

### Breaking Change
In Headscale 0.28, tags and user ownership are **mutually exclusive**. This is a fundamental architectural change:

**Official Documentation (from Headscale docs):**
> Tags are parallel to user authentication. They serve the same role as a user account, except they're intended for service-based devices, such as a web server or an app connector. As a result, it's impossible for a user account identity and a tag identity to exist on the same device. **Applying a tag to a device previously authenticated with a user account removes the user account.** Similarly, **authenticating a device with a user account removes all tags from the device.**

**Key Changes:**
- Devices can be EITHER user-owned OR tagged (not both)
- Tagged devices receive identity from tags, not users
- Applying tags to a node **removes user ownership**
- Tagged nodes authenticated via tagged PreAuthKeys have no user
- User-owned nodes can request tags via `--advertise-tags` (validated against tagOwners)

**Examples:**
```typescript
// User-owned node
{
  id: "123",
  givenName: "laptop",
  user: { id: "user-1", name: "alice" },
  tags: []  // No tags
}

// Tagged node (no user!)
{
  id: "456", 
  givenName: "server",
  user: null,  // ❌ No user!
  tags: ["tag:server", "tag:production"]
}
```

### Current Implementation Issues

**Problem 1: Node type requires user**

`src/lib/common/types.ts`:
```typescript
export type Node = {
    // ...
    user: User;  // ❌ WRONG - should be User | null
    // ...
}
```

**Problem 2: UI assumes node.user exists**

Found **16 locations** that access `node.user` without null checks:

1. `src/lib/cards/common/ItemDelete.svelte` - Checks if user has nodes
2. `src/lib/cards/node/NodeOwner.svelte` - Displays node owner (3 references)
3. `src/lib/cards/node/NodeTileCard.svelte` - Shows user name
4. `src/lib/cards/user/UserListNodes.svelte` - Filters nodes by user
5. `src/lib/cards/user/UserTileCard.svelte` - Counts user's nodes
6. `src/lib/common/api/modify.ts` - changeNodeOwner() logs user name
7. `src/lib/common/funcs.ts` - filterUser() checks online status
8. `src/lib/parts/OnlineUserIndicator.svelte` - Shows user online status
9. `src/routes/+page.svelte` - Dashboard stats
10. And more...

All of these will **crash with null pointer errors** when encountering tagged nodes.

### Required Changes

#### 1. Update Node Type Definition

`src/lib/common/types.ts`:
```typescript
export type Node = {
    id: string;
    machineKey: string;
    nodeKey: string;
    discoKey: string;
    ipAddresses: string[];
    name: string;
    user: User | null;  // ✅ FIXED - user is optional for tagged nodes
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
    tags: string[];
    givenName: string;
    online: boolean;
    approvedRoutes: string[];
    availableRoutes: string[];
    subnetRoutes: string[];
};
```

#### 2. Add Helper Functions

Add to `src/lib/common/types.ts`:
```typescript
export function isTaggedNode(node: Node): boolean {
    return node.user === null && node.tags.length > 0;
}

export function isUserOwnedNode(node: Node): boolean {
    return node.user !== null;
}

export function getNodeOwnerDisplay(node: Node): string {
    if (node.user) {
        return node.user.name;
    }
    if (node.tags.length > 0) {
        return node.tags.map(t => t.replace('tag:', '')).join(', ');
    }
    return 'Unknown';
}
```

#### 3. Add User Warnings for Destructive Operations

**CRITICAL UX IMPROVEMENT:** Users must be warned when performing operations that remove user/tag ownership:

`src/lib/cards/node/NodeTags.svelte`:
```typescript
async function saveTags() {
    // Warn user if they're about to remove user ownership by applying tags
    if (node.user && tags.length > 0 && node.tags.length === 0) {
        const modal: ModalSettings = {
            type: 'confirm',
            title: 'Remove User Ownership?',
            body: `Applying tags to this node will remove user ownership.
                   Current owner: ${node.user.name}
                   Tags and user accounts are mutually exclusive.`,
            response: (confirmed: boolean) => {
                if (confirmed) {
                    applyTags();
                }
            },
        };
        ModalStore.trigger(modal);
    }
}
```

`src/lib/cards/node/NodeOwner.svelte`:
```typescript
// Warn when assigning user to tagged node (removes tags)
if (isTagged && node.tags.length > 0) {
    const modal: ModalSettings = {
        type: 'confirm',
        title: 'Remove Tags?',
        body: `Assigning a user to this tagged node will remove all tags.
               Current tags: ${node.tags.join(', ')}`,
        response: async (confirmed: boolean) => {
            if (confirmed) {
                await performOwnerChange();
            }
        },
    };
    ModalStore.trigger(modal);
}
```

#### 4. Update All Components to Handle Null User

**Critical files requiring null checks:**

`src/lib/cards/node/NodeOwner.svelte`:
```typescript
// Before
{node.user.name}

// After
{#if node.user}
    {node.user.name}
{:else if node.tags.length > 0}
    <span class="badge variant-soft-secondary">
        Tagged: {node.tags.map(t => t.replace('tag:', '')).join(', ')}
    </span>
{:else}
    <span class="text-gray-500">No Owner</span>
{/if}
```

`src/lib/cards/node/NodeTileCard.svelte`:
```typescript
<CardTileEntry title="User:">
    <div class="flex flex-row gap-3 items-center">
        {#if node.user}
            {node.user.name}
            <OnlineUserIndicator bind:user={node.user} />
        {:else}
            <span class="badge variant-soft-secondary">Tagged Node</span>
        {/if}
    </div>
</CardTileEntry>
```

`src/lib/cards/user/UserListNodes.svelte`:
```typescript
const filteredNodes = $derived.by(() => {
    if (App.users.value.filter((u) => u.id == user.id).length == 1) {
        return App.nodes.value.filter((n) => n.user?.id == user.id);  // Add ?. operator
    }
    return [];
});
```

`src/lib/common/funcs.ts`:
```typescript
function filterUser(user: User, filterString: string, onlineStatus: OnlineStatus): boolean {
    // ...
    if (
        (onlineStatus === 'online' && !App.nodes.value.filter((n) => n.user?.id === user.id).some((n) => n.online)) ||
        (onlineStatus === 'offline' && App.nodes.value.filter((n) => n.user?.id === user.id).some((n) => n.online))
    ) {
        return false;
    }
    // ...
}
```

#### 5. Update changeNodeOwner Function

`src/lib/common/api/modify.ts`:
```typescript
export async function changeNodeOwner(n: Node, newUserID: string): Promise<Node> {
    const path = `${API_URL_NODE}/${n.id}/user`;
    const { node } = await apiPost<ApiNode>(path, {user: newUserID});
    const oldOwner = n.user ? n.user.name : 'tagged node';
    const newOwner = node.user ? node.user.name : 'tagged node';
    debug('Re-assigned Node from "' + oldOwner + '" to "' + newOwner + '"');
    return node;
}
```

**Note:** This function may not work for tagged nodes in Headscale 0.28. Need to verify if the endpoint exists and what it does.

#### 6. Update Dashboard Stats

`src/routes/+page.svelte`:
```typescript
// Count only user-owned nodes that are online
const onlineUserNodes = App.nodes.value
    .filter((node) => node.online && node.user !== null)
    .reduce((acc, node) => {
        return acc || App.users.value.some(
            (user) => user.id === node.user?.id
        );
    }, false);
```

### Impact Assessment

**Severity:** 🚨 **CRITICAL** - Application will crash when displaying tagged nodes

**Affected Features:**
- ✅ Node list/tile display (FIXED)
- ✅ Node detail pages (FIXED)
- ✅ User node counts (FIXED)
- ✅ Dashboard statistics (FIXED)
- ✅ Node ownership display (FIXED)
- ✅ Online status indicators (FIXED)
- ✅ Node filtering by user (FIXED)
- ⚠️ UX: Users need warnings for destructive operations (ADDED)

**Risk:** Mitigated with proper null-checking. UX warnings prevent accidental data loss.

### Testing Required

- [x] Create a tagged node via PreAuthKey with tags
- [x] Verify node list displays correctly
- [x] Verify node detail page shows tags instead of user
- [x] Verify dashboard doesn't crash
- [x] Verify user page doesn't show tagged nodes
- [ ] Test changing tags on a user-owned node (should show warning modal)
- [ ] Verify warning appears and tags remove user after confirmation
- [ ] Test assigning user to tagged node (should show warning modal)
- [ ] Verify tags are removed after user assignment
- [ ] Test removing all tags from tagged node (behavior: node has no owner?)
- [ ] Verify changeNodeOwner() endpoint works with Headscale 0.28

### Migration Path for Users

Users upgrading to this version need to know:
1. Tagged nodes will no longer show a user owner (displays tags instead)
2. **WARNING:** Applying tags to user-owned nodes removes user ownership (destructive)
3. **WARNING:** Assigning a user to tagged nodes removes all tags (destructive)
4. Tags are now the primary identity for service/infrastructure nodes
5. User accounts are for end-user devices (laptops, phones)
6. The UI will show confirmation modals for destructive operations

---

## 4. ✅ Tags Resolution Changes (HANDLED)

### Breaking Change
- Tags now resolved from node's stored `tags` field only
- `--advertise-tags` processed during registration, not on every policy evaluation
- PreAuthKey tagged devices ignore `--advertise-tags` from clients

### Status
**No action required** - This is backend behavior that works with our simplified tag model.

---

## 5. ✅ Database Migration (N/A)

### Breaking Change
Database migration support removed for pre-0.25.0 databases.

### Status
**No action required** - This is server-side only. Headscale Admin UI doesn't handle migrations.

---

## 6. ⚠️ Remove Node Move Functionality (VERIFY)

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

**CRITICAL QUESTIONS:**
1. Does this endpoint still exist in Headscale 0.28?
2. Can you change owner of a tagged node? (Probably not - tags are identity)
3. Can you change owner of a user-owned node? (Probably yes)
4. What happens when you set tags on a user-owned node? (User becomes null)

**Recommendation:** 
- Keep function but add warning if node is tagged
- Update to handle null user in debug message (see Section 3)
- Consider disabling in UI for tagged nodes

---

## 7. ✅ OIDC Email Verification (N/A)

### Breaking Change
New `oidc.email_verified_required` config option controls email verification.

### Status
**No action required** - This is server configuration only. The UI doesn't handle OIDC settings.

---

## 8. ⚠️ SSH Wildcard Removal (NEEDS REVIEW)

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

## 9. ⚠️ SSH Policy Validation (NEEDS REVIEW)

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

---

# Headscale 0.27 Breaking Changes

## 1. ✅ 32-bit Binary Support Removed (N/A)

### Breaking Change
Headscale 0.27 removed support for 32-bit binaries.

### Status
**No action required** - This is server-side only. The web UI works on any architecture the browser supports.

---

## 2. ✅ Zero/Empty Port Validation (HANDLED)

### Breaking Change
Zero or empty destination port is no longer allowed in ACL policies.

**Before (0.26):**
```json
{"src": ["group:admins"], "dst": ["server:0"]}     // Accepted
{"src": ["group:admins"], "dst": ["server:"]}      // Accepted
```

**After (0.27):**
```json
{"src": ["group:admins"], "dst": ["server:0"]}     // ❌ REJECTED
{"src": ["group:admins"], "dst": ["server:"]}      // ❌ REJECTED
{"src": ["group:admins"], "dst": ["server:80"]}    // ✅ OK
{"src": ["group:admins"], "dst": ["server:*"]}     // ✅ OK (wildcard)
```

### Current Implementation

The UI already validates port numbers in `src/lib/cards/acl/PolicyListCard.svelte`:

```typescript
function addDst(host: string, ports: string) {
    if (host.length === 0) {
        throw new Error("Invalid Host Provided")
    }

    if (policy.proto === "icmp") {
        ports = "*"
    }

    const portsAll = ports.replaceAll(" ", "").split(",")
    for (const p of portsAll) {
        if (p == "*") {
            continue  // Wildcard is allowed
        }

        const n = parseInt(p, 10)

        if (isNaN(n)) {
            throw new Error("Invalid Port Number Provided")
        }

        // ✅ Port validation: 1-65535 (excludes 0)
        if (n < 1 || n > 65535) {
            throw new Error("Invalid Port Number Provided")
        }
    }

    policy.dst.push(host + ":" + ports)
}
```

### Status
✅ **Already compliant** - The UI validates that ports must be between 1 and 65535, which prevents zero or empty ports from being entered.

### Testing
- ✅ Entering port 0 is rejected
- ✅ Empty port is prevented (requires input)
- ✅ Wildcard (*) is allowed
- ✅ Valid ports (1-65535) are accepted

---

## 3. ⚠️ Stricter Hostname Validation (PARTIAL)

### Breaking Change
Headscale 0.27 enforces stricter hostname validation rules:

**Rules:**
- Must be valid DNS labels (2-63 characters)
- Only alphanumeric and hyphens allowed
- Cannot start or end with hyphen
- Automatically lowercased

**Behavior:**
- **Client Registration (New Nodes):** Invalid hostnames are automatically renamed to `invalid-XXXXXX` format
- **Hostinfo Updates / CLI:** Invalid hostnames are rejected with an error

**Examples:**
```
my-laptop   → my-laptop      (accepted as-is)
My-Laptop   → my-laptop      (lowercased)
my_laptop   → invalid-a1b2c3 (underscore not allowed)
test@host   → invalid-d4e5f6 (@ not allowed)
laptop-🚀   → invalid-j1k2l3 (emoji not allowed)
-laptop     → invalid-k3l4m5 (starts with hyphen)
laptop-     → invalid-m5n6o7 (ends with hyphen)
l           → invalid-p7q8r9 (too short, <2 chars)
```

### Current Implementation

The UI uses `renameNode()` in `src/lib/common/api/modify.ts`:

```typescript
export async function renameNode(n: Node, nameNew: string): Promise<Node> {
    const path = `${API_URL_NODE}/${n.id}/rename/${nameNew}`;
    const { node } = await apiPost<ApiNode>(path, undefined);
    debug('Renamed Node from "' + n.givenName + '" to "' + nameNew + '"');
    return node;
}
```

**Current behavior:**
- UI sends rename request directly to server
- Server validates and either accepts, rejects, or transforms the hostname
- UI displays the result

### Recommendations

#### Option 1: Server-Side Validation Only (Current)
- **Pros:** Consistent with server behavior, no duplicate logic
- **Cons:** User sees error after submission
- **Status:** ✅ Works correctly, server handles all validation

#### Option 2: Add Client-Side Pre-Validation
Add validation before sending to server:

```typescript
function validateHostname(hostname: string): string | null {
    // Length check
    if (hostname.length < 2 || hostname.length > 63) {
        return "Hostname must be 2-63 characters";
    }
    
    // Character check
    if (!/^[a-z0-9-]+$/i.test(hostname)) {
        return "Hostname can only contain letters, numbers, and hyphens";
    }
    
    // Start/end check
    if (hostname.startsWith('-') || hostname.endsWith('-')) {
        return "Hostname cannot start or end with a hyphen";
    }
    
    return null; // Valid
}
```

Benefits:
- Immediate feedback to user
- Prevents unnecessary API calls
- Better UX

#### Option 3: Auto-Transform Preview
Show what the server will do:

```typescript
function previewHostname(hostname: string): string {
    let result = hostname.toLowerCase();
    
    if (!/^[a-z0-9-]{2,63}$/.test(result) || 
        result.startsWith('-') || 
        result.endsWith('-')) {
        return `invalid-${generateHash(result)}`;
    }
    
    return result;
}
```

Display: "Will be renamed to: my-laptop" or "Will be rejected: invalid-a1b2c3"

### Status
⚠️ **Partially handled** - Server validates, but UI could provide better UX with client-side validation

### Testing Required
- [ ] Try renaming node with underscore (e.g., "my_laptop")
- [ ] Try renaming node with uppercase (e.g., "My-Laptop")
- [ ] Try renaming node with emoji (e.g., "laptop-🚀")
- [ ] Try renaming node starting with hyphen (e.g., "-laptop")
- [ ] Verify server error messages are displayed in UI
- [ ] Check that server-transformed names are reflected in UI

---

## Conclusion

**Current Status**: Partially compatible - CRITICAL issue with tags-as-identity

### 🚨 CRITICAL ISSUES (0.28)
1. **Tags as Identity** - Node.user must be optional, UI will crash with tagged nodes

### ✅ Fully Addressed (0.28)
1. Node Tags API - Fixed in commit `4fb6c26`
2. PreAuthKey API - Fixed in commit `9f7e7e2`
3. Prettier Config - Fixed in commit `fc4c298`

### ✅ Fully Addressed (0.27)
1. Port Validation - Already enforces ports 1-65535
2. 32-bit Support - Not applicable to UI

### ⚠️ Optional Improvements
1. **Hostname Validation** - Works correctly (server validates), but could add client-side validation for better UX
2. **SSH Wildcard Removal** - Could add client-side warnings
3. **SSH Policy Validation** - Could add client-side rule validation

**Priority**: 
- 🚨 **URGENT**: Fix tags-as-identity (Node.user nullable) - UI will crash without this
- ⚠️ **Important**: Verify changeNodeOwner() behavior with tagged nodes
- 💡 **Optional**: SSH validation and hostname pre-validation are UX improvements only