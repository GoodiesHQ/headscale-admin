import JWCC from 'json5'
import { isValidCIDR } from "$lib/common/funcs";

export type TagOwners = string[];
export type TagOwnersTyped = { users: string[], groups: string[] }

export type AclGroups = { [key: string]: string[] }
export type AclTagOwners = { [key: string]: TagOwners }
export type AclHosts = { [key: string]: string }
export type AclPolicies = AclPolicy[]
export type AclSshRules = AclSshRule[]
export type AclPoliciesIndexed = {policy: AclPolicy, idx: number}[]
export type AclSshRulesIndexed = {rule: AclSshRule, idx: number}[]
export type AclPolicy = {
    action: 'accept',
    proto?: string,
    src: string[],
    dst: string[],
}
export type AclSshRule = {
    action: 'accept',
    src: string[],
    dst: string[],
    users: string[],
}

export type ACL = {
    groups: AclGroups, // keys must start with "group:"
    tagOwners: AclTagOwners, // keys must start with "tag:"
    hosts: AclHosts, // keys are DNS-style hostnames
    acls: AclPolicies,
    ssh?: AclSshRules,
}

export type PrefixType = "group" | "tag";

const Prefixes: Record<PrefixType, string> = {
    "group": "group:",
    "tag": "tag:",
}

const RegexGroupName = /^[a-z0-9-\.]+$/
const RegexTagName = /^[^\s:]+$/
const RegexHostName = /^[a-z0-9-\.]+$/

export class ACLBuilder implements ACL {
    groups = $state<AclGroups>({})
    tagOwners = $state<AclTagOwners>({})
    hosts = $state<AclHosts>({})
    acls = $state<AclPolicies>([])
    ssh = $state<AclSshRules|undefined>(undefined)

    constructor(
        groups: AclGroups,
        tagOwners: AclTagOwners,
        hosts: AclHosts,
        acls: AclPolicies,
        ssh?: AclSshRules,
    ) {
        this.groups = groups
        this.tagOwners = tagOwners
        this.hosts = hosts
        this.acls = acls
        this.ssh = ssh
    }

    JSON(space: number = 0): string {
        return JSON.stringify({
            groups: this.groups,
            tagOwners: this.tagOwners,
            hosts: this.hosts,
            acls: this.acls,
            ssh: this.ssh,
        }, null, space)
    }

    static emptyACL(): ACLBuilder {
        return new ACLBuilder({}, {}, {}, [], []);
    }

    static fromPolicy(acl: ACL | string): ACLBuilder {
        if (typeof acl === "string"){
            return this.fromPolicy(JWCC.parse<ACL>(acl))
        }

        const ssh = acl.ssh ? [...acl.ssh] : []

        return new ACLBuilder(
            {...acl.groups},
            {...acl.tagOwners},
            {...acl.hosts},
            [...acl.acls],
            [...ssh],
        )
    }

    private static getPrefix(name: string): PrefixType | null {
        for (const [prefixType, prefix] of Object.entries(Prefixes)) {
            if (name.startsWith(prefix)) {
                return prefixType as PrefixType
            }
        }
        return null
    }

    // remove the group: prefix if it exists
    private static stripPrefix(name: string): string {
        const nameLower = name.toLowerCase();
        for (const prefix of Object.values(Prefixes)) {
            if (nameLower.startsWith(prefix)) {
                return name.substring(prefix.length)
            }
        }
        return name;
    }

    private static addPrefix(name: string, type: PrefixType): string {
        return Prefixes[type] + name
    }

    private static normalizePrefix(name: string, type: PrefixType): { prefixed: string, stripped: string } {
        const stripped = this.stripPrefix(name)
        const prefixed = this.addPrefix(stripped, type)
        return { prefixed, stripped }
    }

    // throws an error if the name is invalid, otherwise returns the normalized group name
    static validateGroupName(name: string): string {
        name = this.stripPrefix(name)
        if (name.toLowerCase() !== name) {
            throw new Error("Group name must be lowercase")
        }
        if (!RegexGroupName.test(name)) {
            throw new Error("Group name is limited to: lowercase alphabet, digits, dashes, and periods")
        }
        return name
    }

    // tag names can contain anything but spaces
    static validateTagName(name: string): string {
        name = this.stripPrefix(name)
        if (!RegexTagName.test(name)) {
            throw new Error("Tag name must contain no spaces")
        }
        return name
    }

    // host names can contain anything but spaces
    static validateHostName(name: string): string {
        name = name.toLowerCase()
        if (!RegexHostName.test(name)) {
            throw new Error("Host name is limited to: lowercase alphabet, digits, dashes, and periods")
        }
        return name
    }

    static validateHostCIDR(cidr: string): string {
        if (isValidCIDR(cidr)) {
            return cidr;
        }
        throw new Error("Invalid IP CIDR Notation")
    }

    // deep clone of current ACL
    clone(): ACLBuilder {
        return JSON.parse(JSON.stringify(this)) as ACLBuilder
    }

    /*
     * Host:
     * --------------------------------
     * createHost(name, cidr)
     * getHostCIDR(name)
     * setHost(name, cidr)
     * renameHost(nameOld, nameNew)
     * getHostNames() string[]
     * getHosts(name) [string, string][]
     * hostExists(name)
     * deleteHost(name)
     */


    createHost(name: string, cidr: string) {
        this.setHost(name, cidr)
    }

    getHostCIDR(name: string): string | undefined {
        return this.hosts[name]
    }

    setHost(name: string, cidr: string) {
        name = ACLBuilder.validateHostName(name);
        cidr = ACLBuilder.validateHostCIDR(cidr);
        this.hosts[name] = cidr
    }

    renameHost(nameOld: string, nameNew: string) {
        nameOld = ACLBuilder.validateHostName(nameOld);
        nameNew = ACLBuilder.validateHostName(nameNew);
        if (this.hosts[nameOld] === undefined) {
            throw new Error(`Host '${nameOld}' does not exist`)
        }
        if (this.hosts[nameNew] !== undefined) {
            throw new Error(`Host '${nameNew}' already exists`)
        }

        const hosts: AclHosts = {}
        Object.entries(this.hosts).forEach(([name, value])=>{
            hosts[name === nameOld ? nameNew : name] = value;
        })
        this.hosts = hosts;

        this.acls.forEach(acl => {
            acl.src = acl.src.map(src => (src === nameOld ? nameNew : src));
            acl.dst = acl.dst.map(dst => (ACLBuilder.getPolicyDstHost(dst) === nameOld ? nameNew + ":" + ACLBuilder.getPolicyDstPorts(dst) : dst));
        });
    }

    getHostNames(): string[] {
        return Object.keys(this.hosts);
    }

    getHosts(): [string, string][] {
        return Object.entries(this.hosts);
    }

    deleteHost(name: string) {
        if (this.hosts[name] !== undefined) {
            delete this.hosts[name];
        }
    }


    /*
     * Tags:
     * --------------------------------
     * createTag(name)
     * renameTag(nameOld, nameNew)
     * setTagOwners(name, members[])
     * getTagNames() string[]
     * getTagOwners(name) [string, string[]]
     * getTagOwnersTyped(name) {users: string[], groups: string[]}
     * tagExists(name)
     * deleteTag(name)
     */

    createTag(name: string) {
        name = ACLBuilder.validateTagName(name);
        const { prefixed } = ACLBuilder.normalizePrefix(name, 'tag')
        this.tagOwners[prefixed] = [];
    }

    renameTag(nameOld: string, nameNew: string) {
        nameNew = ACLBuilder.validateTagName(nameNew);
        const { prefixed: prefixedNew } = ACLBuilder.normalizePrefix(nameNew, 'tag')
        const { stripped: strippedOld, prefixed: prefixedOld } = ACLBuilder.normalizePrefix(nameOld, 'tag')

        // if names are equal, don't do anything
        if (prefixedNew === prefixedOld) {
            return
        }

        if (this.tagOwners[prefixedOld] === undefined) {
            throw new Error(`Tag '${strippedOld}' doesn't exist`);
        }

        const tagOwners: AclTagOwners = {}
        Object.entries(this.tagOwners).forEach(([name, owners]) => {
            tagOwners[name === prefixedOld ? prefixedNew : name] = owners;
        })
        this.tagOwners = tagOwners

        this.acls.forEach(acl => {
            acl.src = acl.src.map(src => (src === prefixedOld ? prefixedNew : src));
            acl.dst = acl.dst.map(dst => (ACLBuilder.getPolicyDstHost(dst) === prefixedOld ? prefixedNew + ":" + ACLBuilder.getPolicyDstPorts(dst) : dst));
        });
        if (this.ssh !== undefined) {
            for (const rule of this.ssh) {
                rule.src = rule.src.map(src => (src === prefixedOld ? prefixedNew : src))
                rule.dst = rule.dst.map(dst => (dst === prefixedOld ? prefixedNew : dst))
            }
        }
    }

    setTagOwners(name: string, owners: TagOwners) {
        const { prefixed } = ACLBuilder.normalizePrefix(name, 'tag')
        const ownersAll = [...owners]
        this.tagOwners[prefixed] = ownersAll
    }

    getTagNames(withPrefix: boolean = false): string[] {
        return Object.keys(this.tagOwners).map(name => {
            let {stripped, prefixed} = ACLBuilder.normalizePrefix(name, 'tag')
            return withPrefix ? prefixed : stripped;
        })
    }

    getTagOwners(name: string): string[]{
        const { stripped, prefixed } = ACLBuilder.normalizePrefix(name, 'tag')
        const owners = this.tagOwners[prefixed] 
        if (owners === undefined) {
            throw new Error(`Tag ${stripped} does not exist`);
        }
        return owners
    }

    static TagOwnersByType(owners: TagOwners): TagOwnersTyped {
        const ownersTyped: TagOwnersTyped = {
            users: [],
            groups: [],
        };

        for (const owner of owners) {
            const prefix = ACLBuilder.getPrefix(owner)
            if (prefix === 'group') {
                ownersTyped.groups.push(owner)
            } else {
                ownersTyped.users.push(owner)
            }
        }

        return ownersTyped
    }

    getTagOwnersTyped(name: string): TagOwnersTyped {
        const { stripped, prefixed } = ACLBuilder.normalizePrefix(name, 'tag')
        const owners = this.tagOwners[prefixed]
        if (owners === undefined) {
            throw new Error(`Tag ${stripped} does not exist`);
        }
        return ACLBuilder.TagOwnersByType(owners)
    }

    tagExists(name: string): boolean {
        const { prefixed } = ACLBuilder.normalizePrefix(name, 'tag')
        return this.tagOwners[prefixed] !== undefined;
    }

    deleteTag(name: string) {
        const { stripped, prefixed } = ACLBuilder.normalizePrefix(name, 'tag')

        if (this.tagOwners[prefixed] === undefined) {
            throw new Error(`Tag '${stripped}' doesn't exist within the ACL`);
        }

        delete this.tagOwners[prefixed]
    }


    /*
     * GROUPS:
     * --------------------------------
     * createGroup(name)
     * renameGroup(nameOld, nameNew)
     * setGroupMembers(name, members[])
     * getGroupNames() string[]
     * getGroupMembers(name)
     * groupExists(name)
     * deleteGroup(name)
     */
    createGroup(name: string) {
        name = ACLBuilder.validateGroupName(name);
        const { stripped, prefixed } = ACLBuilder.normalizePrefix(name, 'group')

        if (this.groups[prefixed] !== undefined) {
            throw new Error(`Group '${stripped}' already exists`)
        }

        this.groups[prefixed] = []
    }

    renameGroup(nameOld: string, nameNew: string) {
        nameNew = ACLBuilder.validateGroupName(nameNew);
        const { prefixed: prefixedNew } = ACLBuilder.normalizePrefix(nameNew, 'group')
        const { stripped: strippedOld, prefixed: prefixedOld } = ACLBuilder.normalizePrefix(nameOld, 'group')

        // if names are equal, don't do anything
        if (prefixedNew === prefixedOld) {
            return
        }

        if (this.groups[prefixedOld] === undefined) {
            throw new Error(`Group '${strippedOld}' doesn't exist`);
        }

        const groups: AclGroups = {}
        Object.entries(this.groups).forEach(([name, members]) => {
            groups[name === prefixedOld ? prefixedNew : name] = members;
        })
        this.groups = groups

        this.acls.forEach(acl => {
            acl.src = acl.src.map(src => (src === prefixedOld ? prefixedNew : src));
            acl.dst = acl.dst.map(dst => (ACLBuilder.getPolicyDstHost(dst) === prefixedOld ? prefixedNew + ":" + ACLBuilder.getPolicyDstPorts(dst) : dst));
        });

        for (const key in this.tagOwners) {
            this.tagOwners[key] = this.tagOwners[key].map(owner =>
                owner === prefixedOld ? prefixedNew : owner
            );
        }
        if (this.ssh !== undefined) {
            for (const rule of this.ssh) {
                rule.src = rule.src.map(src => (src === prefixedOld ? prefixedNew : src))
                rule.dst = rule.dst.map(src => (src === prefixedOld ? prefixedNew : src))
            }
        }
    }

    setGroupMembers(name: string, members: string[]) {
        const { prefixed } = ACLBuilder.normalizePrefix(name, 'group')

        this.groups[prefixed] = [...members];
    }

    getGroupByName(name: string): string[] {
        const { stripped, prefixed } = ACLBuilder.normalizePrefix(name, 'group')
        return this.groups[name]
    }

    getGroupNames(withPrefix: boolean = false): string[] {
        const names = []
        for (const name of Object.keys(this.groups)) {
            const { stripped, prefixed } = ACLBuilder.normalizePrefix(name, 'group')
            names.push(withPrefix ? prefixed : stripped)
        }
        return names
    }

    getGroupMembers(name: string): string[] | undefined {
        const { prefixed } = ACLBuilder.normalizePrefix(name, 'group')
        return this.groups[prefixed]
    }

    groupExists(name: string): boolean {
        const { prefixed } = ACLBuilder.normalizePrefix(name, 'group')
        return this.groups[prefixed] !== undefined
    }

    deleteGroup(name: string) {
        const { stripped, prefixed } = ACLBuilder.normalizePrefix(name, 'group')

        if (this.groups[prefixed] === undefined) {
            throw new Error(`Group '${stripped}' doesn't exist`);
        }

        delete this.groups[prefixed];
    }
    /*
     * POLICIES:
     * --------------------------------
     * createPolicy(policy)
     * getAllPolicies()
     * getPolicy(idx)
     * setPolicy(idx, policy)
     * delPolicy(idx)
     * setPolicySrc(idx, src)
     * setPolicyDst(idx, dst)
     * setPolicyProto(idx, proto)
     */

	public static getPolicyDstHost(dst: string): string {
		const i = dst.lastIndexOf(':')
		return i < 0 ? dst : dst.substring(0, i)
	}

	public static getPolicyDstPorts(dst: string): string {
		const i = dst.lastIndexOf(':')
		return i < 0 ? dst : dst.substring(i+1, dst.length)
	}


    createPolicy(policy: AclPolicy) {
        this.acls.push(policy)
    }

    getAllPolicies(): AclPolicies {
        return this.acls
    }

    getPolicy(idx: number): AclPolicy {
        this.validatePolicyIndex(idx)
        return this.acls[idx]
    }

    private validatePolicyIndex(idx: number) {
        if (idx >= this.acls.length || idx < 0) {
            throw new Error(`Policy does not exist at index '${idx}'`)
        }
    }

    public static DefaultPolicy(): AclPolicy {
        return {
            action: "accept",
            proto: undefined,
            src: [],
            dst: [],
        }
    }

    setPolicySrc(idx: number, src: string[]) {
        this.validatePolicyIndex(idx)
        this.acls[idx].src = src
    }

    setPolicyDst(idx: number, dst: string[]) {
        this.validatePolicyIndex(idx)
        this.acls[idx].dst = dst
    }

    setPolicyProto(idx: number, proto: string | undefined) {
        this.validatePolicyIndex(idx)
        this.acls[idx].proto = proto
    }

    setPolicy(idx: number, policy: AclPolicy) {
        this.validatePolicyIndex(idx)
        this.acls[idx] = {
            action: policy.action,
            proto: policy.proto,
            src: policy.src,
            dst: policy.dst,
        }
    }

    delPolicy(idx: number) {
        this.validatePolicyIndex(idx)
        this.acls.splice(idx, 1)
    }

    /*
     * SSH Rules:
     * --------------------------------
     * createSshRule(rule)
     * getAllPolicies()
     * getPolicy(idx)
     * setPolicy(idx, policy)
     * delPolicy(idx)
     * setPolicySrc(idx, src)
     * setPolicyDst(idx, dst)
     * setPolicyProto(idx, proto)
     */

    createSshRule(rule: AclSshRule) {
        if (this.ssh === undefined){
            this.ssh = []
        }
        this.ssh.push(rule)
    }

    getAllSshRules(): AclSshRules|undefined {
        return this.ssh
    }

    getSshRule(idx: number): AclSshRule {
        this.validateSshRuleIndex(idx)
        if (this.ssh !== undefined){
            return this.ssh[idx]
        }
        throw new Error("No SSH Rules defined")
    }

    private validateSshRuleIndex(idx: number) {
        if (this.ssh === undefined || idx >= this.ssh.length || idx < 0) {
            throw new Error(`SSH Rule does not exist at index '${idx}'`)
        }
    }

    public static DefaultSshRule(): AclSshRule {
        return {
            action: "accept",
            src: [],
            dst: [],
            users: [],
        }
    }

    setSshRuleSrc(idx: number, src: string[]) {
        this.validateSshRuleIndex(idx)
        if (this.ssh != undefined) {
            this.ssh[idx].src = src
        }
    }

    setSshRuleDst(idx: number, dst: string[]) {
        this.validateSshRuleIndex(idx)
        if (this.ssh !== undefined) {
            this.ssh[idx].dst = dst
        }
    }

    setSshRuleUsers(idx: number, users: string[]) {
        this.validateSshRuleIndex(idx)
        if (this.ssh !== undefined) {
            this.ssh[idx].users = users
        }
    }

    setSshRule(idx: number, rule: AclSshRule) {
        this.validateSshRuleIndex(idx)
        if (this.ssh !== undefined) {
            this.ssh[idx] = {
                action: rule.action,
                src: rule.src,
                dst: rule.dst,
                users: rule.users,
            }
        }
    }

    delSshRule(idx: number) {
        this.validateSshRuleIndex(idx)
        if (this.ssh !== undefined) {
            this.ssh.splice(idx, 1)
        }
    }
}