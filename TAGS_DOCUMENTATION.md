# Tailscale/Headscale Tags: Complete Developer Guide

**For Headscale 0.28+ Compatibility**

This document summarizes the official Tailscale tags documentation and explains how headscale-admin implements tags-as-identity in Headscale 0.28.

---

## Table of Contents

1. [What Are Tags?](#what-are-tags)
2. [Tags vs. User Authentication](#tags-vs-user-authentication)
3. [Critical Limitations](#critical-limitations)
4. [Use Cases](#use-cases)
5. [Implementation in headscale-admin](#implementation-in-headscale-admin)
6. [Best Practices](#best-practices)
7. [Common Patterns](#common-patterns)
8. [FAQ](#faq)

---

## What Are Tags?

**Official Definition:**
> "Tailscale tags are how you authenticate and identify non-user devices, such as servers and ephemeral nodes. They serve two primary purposes: to provide an identity to non-user devices and to let you manage access control policies based on purpose."

### Key Characteristics

- **Service Accounts with Flexibility**: Tags are essentially service accounts, but you can assign multiple tags to a single device
- **Multiple Tags per Device**: A device can have many tags for different purposes (e.g., `tag:postgresql`, `tag:internal-access`, `tag:web-server`)
- **Defined in Policy File**: Tags are created in the `tagOwners` section of the ACL policy
- **Ownership-Based**: Only designated tag owners can apply tags to devices
- **Mutually Exclusive with Users**: A device cannot simultaneously have a user and tags

### Examples

**Single-Purpose Tagged Device:**
```json
{
  "id": "123",
  "givenName": "web-server-01",
  "user": null,
  "tags": ["tag:web-server"]
}
```

**Multi-Purpose Tagged Device:**
```json
{
  "id": "456",
  "givenName": "db-server-prod",
  "user": null,
  "tags": ["tag:postgresql", "tag:prod", "tag:internal-access"]
}
```

**User-Owned Device (No Tags):**
```json
{
  "id": "789",
  "givenName": "alice-laptop",
  "user": {
    "id": "user-1",
    "name": "alice"
  },
  "tags": []
}
```

---

## Tags vs. User Authentication

### Fundamental Principle

**Tags and user accounts are PARALLEL authentication methods, not complementary.**

From official docs:
> "Tags are parallel to user authentication. They serve the same role as a user account, except they're intended for service-based devices, such as a web server or an app connector. As a result, it's impossible for a user account identity and a tag identity to exist on the same device."

### Mutual Exclusivity Rules

| Action | Result |
|--------|--------|
| Apply tag to user-owned device | **User is removed** |
| Authenticate device with user account | **All tags are removed** |
| Remove all tags from tagged device | **Not allowed** - device loses identity |

### Identity Matrix

| Device Type | User | Tags | Valid? |
|-------------|------|------|--------|
| User-owned laptop | ✅ alice | ❌ none | ✅ Yes |
| Tagged server | ❌ null | ✅ tag:server | ✅ Yes |
| Hybrid | ✅ alice | ✅ tag:server | ❌ **IMPOSSIBLE** |
| Orphaned | ❌ null | ❌ none | ❌ No identity |

---

## Critical Limitations

### 1. Cannot Remove All Tags from Tagged Device

**Limitation:**
> "You cannot remove all tags from a device. A device with a tag-based identity must have at least one tag."

**Why:** Tags provide the device's identity. Removing all tags would leave the device without authentication.

**Workaround:** To "remove tags," you must assign a user to the device instead (which replaces tag-based identity with user-based identity).

**Implementation in headscale-admin:**
```typescript
// NodeTags.svelte - Prevents removing all tags
if (!node.user && tags.length === 0) {
    showModal("Tagged nodes must have at least one tag for identity");
    return;
}
```

---

### 2. Tagged Devices Cannot SSH to User Devices

**Limitation:**
> "Devices with a tag-based identity can only SSH into other tagged devices; they cannot SSH into devices with a user-based identity."

**Why:** Security model - service accounts (tags) shouldn't access user devices.

**SSH Compatibility Matrix:**

| Source | Destination | SSH Works? |
|--------|-------------|------------|
| User device | User device | ✅ Yes |
| User device | Tagged device | ✅ Yes |
| Tagged device | Tagged device | ✅ Yes |
| Tagged device | User device | ❌ **NO** |

---

### 3. Cannot Remove Tags with Auth Key

**Limitation:**
> "You cannot remove tags using the --advertise-tags flag if the device uses an auth key. Instead, generate a new auth key with the latest set of tags."

**Reason:** Auth keys pre-define tags. Changes require re-authentication.

**Solution:** Generate new auth key with updated tags and re-authenticate device.

---

### 4. No IP Sets Support

**Limitation:**
> "IP sets do not support tags."

**Impact:** Cannot use tags in IP set definitions in ACL policy.

---

## Use Cases

### ✅ What Tags ARE For

**Service-Based Devices:**
- Web servers, application servers
- Database servers (PostgreSQL, MySQL, Redis, etc.)
- Queue servers (RabbitMQ, Kafka, etc.)
- CI/CD infrastructure
- Monitoring systems (Prometheus, Grafana, etc.)

**Network Infrastructure:**
- Exit nodes (route all traffic through this device)
- Subnet routers (access entire subnets)
- App connectors (route app-specific traffic)

**Shared Resources:**
- File servers
- Backup servers
- Development/staging environments
- Internal tools and dashboards

**Multi-User Management:**
- Devices that multiple users need to manage
- Infrastructure not tied to any single user
- Devices that should persist when users leave

### ❌ What Tags Are NOT For

**End-User Devices:**
- ❌ Laptops (MacBooks, Windows laptops, Linux workstations)
- ❌ Mobile devices (iPhones, Android phones, tablets)
- ❌ Desktop computers used by individual users

**User Identity:**
- ❌ Annotating user-owned devices
- ❌ Linking user devices with user accounts (use actual user auth)
- ❌ Substituting for proper user authentication

**Why NOT to Use Tags for User Devices:**
1. Tagged devices can't SSH to user devices
2. User devices need user-specific permissions and settings
3. Tags don't provide user-level audit trails
4. Security risk - device persists even if user is removed

---

## Implementation in headscale-admin

### Type Changes (Headscale 0.28)

**Node Type Definition:**
```typescript
export type Node = {
    id: string;
    name: string;
    user: User | null;  // ✅ Nullable for tagged nodes
    tags: string[];     // ✅ Unified tag array (simplified from 0.27)
    // ... other fields
};
```

**Before 0.28:**
```typescript
export type Node = {
    user: User;              // ❌ Always required
    forcedTags: string[];    // Separate arrays
    validTags: string[];
    invalidTags: string[];
};
```

### Helper Functions

```typescript
// Check if node is tagged (no user)
export function isTaggedNode(node: Node): boolean {
    return node.user === null && node.tags.length > 0;
}

// Check if node is user-owned
export function isUserOwnedNode(node: Node): boolean {
    return node.user !== null;
}

// Get display name for node owner
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

### UI Patterns

**Displaying Node Ownership:**
```svelte
{#if node.user}
    <!-- User-owned node -->
    <a href="..." onclick={() => openUserDrawer(node.user)}>
        {node.user.name}
    </a>
    <OnlineUserIndicator user={node.user} />
{:else if node.tags.length > 0}
    <!-- Tagged node -->
    <span class="badge variant-soft-secondary">
        Tagged: {node.tags.map(t => t.replace('tag:', '')).join(', ')}
    </span>
{:else}
    <!-- Node with no owner (should not happen) -->
    <span class="text-surface-500">No Owner</span>
{/if}
```

### UX Warnings (Added in Review)

**Warning: Adding Tags to User-Owned Node**
```typescript
// Shows confirmation modal before removing user
if (node.user && tags.length > 0 && node.tags.length === 0) {
    confirmModal({
        title: 'Remove User Ownership?',
        message: 'Applying tags will remove user ownership. Tags and users are mutually exclusive.',
        onConfirm: () => applyTags()
    });
}
```

**Warning: Assigning User to Tagged Node**
```typescript
// Shows confirmation modal before removing tags
if (isTagged && node.tags.length > 0) {
    confirmModal({
        title: 'Remove Tags?',
        message: 'Assigning a user will remove all tags. Tags and users are mutually exclusive.',
        onConfirm: () => assignUser()
    });
}
```

**Prevention: Removing All Tags**
```typescript
// Prevents removing last tag from tagged node
if (!node.user && tags.length === 0) {
    alertModal({
        title: 'Cannot Remove All Tags',
        message: 'Tagged nodes must have at least one tag. To remove tags, assign a user instead.'
    });
    return;
}
```

### Null-Safety Pattern

**All components use optional chaining:**
```typescript
// ✅ Safe: Won't crash if node.user is null
App.nodes.value.filter(n => n.user?.id === userId)

// ✅ Safe: Provides fallback
const ownerName = node.user?.name || 'tagged node'

// ✅ Safe: Conditional filtering
App.nodes.value.filter(n => n.online && n.user?.id === userId)
```

---

## Best Practices

### 1. Naming Conventions

**Use Descriptive, Hierarchical Names:**
```
tag:prod-db-postgresql
tag:dev-app-web-server
tag:prod-emea-app-finance-reporting
tag:nonprod-asiasouth-queue-rabbitmq
```

**Common Patterns:**
- `tag:{environment}-{role}` → `tag:prod-db`
- `tag:{environment}-{role}-{app}` → `tag:prod-app-finance`
- `tag:{environment}-{location}-{role}-{app}` → `tag:prod-emea-app-support`

### 2. Tag Organization Categories

**Server Role:**
- `tag:web-server`
- `tag:database`
- `tag:queue`
- `tag:cache`
- `tag:load-balancer`

**Environment:**
- `tag:prod` (production)
- `tag:staging`
- `tag:dev` (development)
- `tag:test`

**Location/Region:**
- `tag:americas`
- `tag:emea` (Europe, Middle East, Africa)
- `tag:asiasouth`
- `tag:us-west`

**Application/Service:**
- `tag:finance-reporting`
- `tag:support-console`
- `tag:ops-dashboard`
- `tag:customer-portal`

**Technology Stack:**
- `tag:postgresql`
- `tag:redis`
- `tag:nginx`
- `tag:docker`

### 3. Composite Tags for Complex Segmentation

**Why Composite Tags?**
ACL rules don't "join" tags. You can't write a rule for devices with BOTH `tag:prod` AND `tag:database`. Instead, use composite tags:

```
tag:prod-database       # Production databases
tag:nonprod-database    # Non-production databases
tag:prod-app            # Production app servers
tag:dev-app             # Development app servers
```

### 4. Documentation

**Maintain a Tag Registry:**
```markdown
# Tag Registry

## Production Infrastructure
- `tag:prod-db-postgresql` - Production PostgreSQL databases
- `tag:prod-app-api` - Production API servers
- `tag:prod-web-nginx` - Production Nginx web servers

## Development Infrastructure
- `tag:dev-db-postgresql` - Development PostgreSQL databases
- `tag:dev-app-api` - Development API servers

## Tag Ownership
- alice@example.com: Owns all `tag:prod-*` tags
- bob@example.com: Owns all `tag:dev-*` tags
- tag:deployment: Owns all infrastructure tags (for CI/CD)
```

### 5. Tag Ownership Hierarchy

**Simple Ownership:**
```json
{
  "tagOwners": {
    "tag:server": ["alice@example.com"],
    "tag:database": ["bob@example.com"]
  }
}
```

**Group Ownership:**
```json
{
  "groups": {
    "group:sre": ["alice@example.com", "bob@example.com"]
  },
  "tagOwners": {
    "tag:prod-server": ["group:sre"]
  }
}
```

**Tag Hierarchy (Tags Own Tags):**
```json
{
  "tagOwners": {
    "tag:deployment": ["alice@example.com"],
    "tag:prod": ["tag:deployment", "tag:prod"],
    "tag:staging": ["tag:deployment", "tag:staging"]
  }
}
```

**Note:** Tags implicitly own themselves UNLESS owned by another tag. Explicit self-ownership required for OAuth clients.

### 6. Auth Keys with Pre-Assigned Tags

**Generate Auth Keys with Tags:**
```bash
headscale preauthkeys create \
  --user infrastructure \
  --reusable \
  --expiration 24h \
  --tags tag:web-server,tag:prod
```

**Use in Automation:**
```bash
# CI/CD pipeline
tailscale up \
  --auth-key=${AUTH_KEY} \
  --advertise-tags=tag:prod-app,tag:ci-cd \
  --hostname=web-server-${BUILD_ID}
```

---

## Common Patterns

### Pattern 1: Environment-Based Segmentation

```json
{
  "tagOwners": {
    "tag:prod": ["group:sre"],
    "tag:staging": ["group:developers"],
    "tag:dev": ["group:developers"]
  },
  "acls": [
    {
      "action": "accept",
      "src": ["tag:prod"],
      "dst": ["tag:prod:*"]
    },
    {
      "action": "accept",
      "src": ["tag:staging"],
      "dst": ["tag:staging:*", "tag:dev:*"]
    }
  ]
}
```

### Pattern 2: Role-Based Access

```json
{
  "tagOwners": {
    "tag:database": ["group:dba"],
    "tag:web-server": ["group:webmasters"],
    "tag:cache": ["group:sre"]
  },
  "acls": [
    {
      "action": "accept",
      "src": ["tag:web-server"],
      "dst": ["tag:database:5432", "tag:cache:6379"]
    }
  ]
}
```

### Pattern 3: Multi-Purpose Infrastructure

```json
// Device with multiple tags for complex access patterns
{
  "id": "server-001",
  "tags": [
    "tag:web-server",      // Serves web traffic
    "tag:internal-access", // Accessible internally only
    "tag:prod",            // Production environment
    "tag:americas"         // Located in Americas region
  ]
}
```

Each tag can have different ACL rules, and they ALL apply to the device.

---

## FAQ

### Q: Can I convert a user-owned device to a tagged device?

**A:** Yes, but it's **destructive**. Applying tags removes the user. The UI shows a confirmation modal to prevent accidental conversion.

```typescript
// Before
{ user: "alice", tags: [] }

// After applying tag:server
{ user: null, tags: ["tag:server"] }
```

---

### Q: Can I convert a tagged device back to a user-owned device?

**A:** Yes, assign a user to the device. This removes all tags. The UI shows a confirmation modal.

```typescript
// Before
{ user: null, tags: ["tag:server", "tag:prod"] }

// After assigning to alice
{ user: "alice", tags: [] }
```

---

### Q: What happens if I try to remove all tags from a tagged device?

**A:** The operation is **blocked**. Tagged devices must have at least one tag for identity. The UI prevents this with an alert modal.

---

### Q: Can tagged devices access user devices via SSH?

**A:** No. Tagged devices can only SSH to other tagged devices. This is a security limitation.

---

### Q: Should I use tags for developer laptops?

**A:** **NO.** Tags are for servers and infrastructure, not end-user devices. Use proper user authentication for laptops, phones, etc.

---

### Q: What if I need to change tags on a device authenticated with an auth key?

**A:** You cannot remove tags with `--advertise-tags=`. Instead:
1. Generate a new auth key with the correct tags
2. Re-authenticate the device with the new key

---

### Q: Can a device have both tag:prod and tag:dev?

**A:** Technically yes, but it's **not recommended**. Use composite tags instead:
- `tag:prod-api` for production API servers
- `tag:dev-api` for development API servers

Mixing environment tags defeats the purpose of segmentation.

---

### Q: How do I audit which devices have which tags?

**A:** In headscale-admin:
1. Go to Nodes page
2. Use filter/search: type tag name (e.g., "server")
3. Tagged nodes show tags in badge format
4. Click node for full details

---

### Q: What's the difference between forcedTags and tags in 0.27 vs 0.28?

**A:**
- **0.27:** Had `forcedTags`, `validTags`, `invalidTags` (complex)
- **0.28:** Has single `tags` array (simplified)
- UI in 0.27 showed which tags were rejected by ACL
- UI in 0.28 only shows accepted tags (cleaner but less informative)

---

### Q: Do I need to update my ACL policy for Headscale 0.28?

**A:** No. ACL tag syntax hasn't changed. The change is in the API representation of tags on nodes, not in policy definitions.

---

### Q: Can I use tags with exit nodes?

**A:** Yes! In fact, it's recommended. Exit nodes are typically infrastructure, so using tags is the best practice:

```json
{
  "tagOwners": {
    "tag:exit-node": ["group:network-admins"]
  },
  "acls": [
    {
      "action": "accept",
      "src": ["autogroup:members"],
      "dst": ["tag:exit-node:*"]
    }
  ]
}
```

---

### Q: What's autogroup:tagged?

**A:** `autogroup:tagged` is a pre-defined group that selects ALL devices with a tag-based identity. Useful for ACL rules:

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["autogroup:tagged"],
      "dst": ["tag:monitoring:*"]
    }
  ]
}
```

**Note:** Cannot use `autogroup:tagged` to define IP sets or custom groups.

---

## References

- [Official Tailscale Tags Documentation](https://tailscale.com/kb/1068/acl-tags)
- [Headscale 0.28 Release Notes](https://github.com/juanfont/headscale/releases/tag/v0.28.0)
- [headscale-admin Breaking Changes Analysis](BREAKING_CHANGES_0.28.md)
- [headscale-admin Code Review](CODE_REVIEW.md)

---

**Last Updated:** 2024  
**Applies to:** Headscale 0.28+, headscale-admin 0.28+