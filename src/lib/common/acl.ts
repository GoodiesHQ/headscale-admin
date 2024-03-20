import { isValidCIDR } from "$lib/common/funcs";

export type AclGroups = { [key: string]: string[] }
export type AclTagOwners = { [key: string]: string[] }
export type AclHosts = { [key: string]: string }
export type AclAcls = {
    action: 'accept' | 'deny',
    proto?: string,
    src: string[],
    dst: string[],
}[]

export type TagOwners = { users?: string[], groups?: string[] }

export type ACL = {
    groups: AclGroups, // keys must start with "group:"
    tagOwners: AclTagOwners, // keys must start with "tag:"
    hosts: AclHosts, // keys are DNS-style hostnames
    acls: AclAcls,
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
    constructor(
        public groups: AclGroups,
        public tagOwners: AclTagOwners,
        public hosts: AclHosts,
        public acls: AclAcls,
    ) { }

    static emptyACL(): ACLBuilder {
        return new ACLBuilder({}, {}, {}, []);
    }

    private static getPrefix(name: string): PrefixType | null {
        for(const [prefixType, prefix] of Object.entries(Prefixes)){
            if(name.startsWith(prefix)){
                return prefixType as PrefixType
            }
        }
        return null
    }

    // remove the group: prefix if it exists
    private static stripPrefix(name: string): string {
        const nameLower = name.toLowerCase();
        for(const prefix of Object.values(Prefixes)) {
            if(nameLower.startsWith(prefix)) {
                return name.substring(prefix.length)
            }
        }
        return name;
    }

    private static addPrefix(name: string, type: PrefixType): string {
        return Prefixes[type] + name
    }
    
    private static normalizePrefix(name: string, type: PrefixType): {prefixed: string, stripped: string} {
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
        if(!RegexHostName.test(name)) {
            throw new Error("Host name is limited to: lowercase alphabet, digits, dashes, and periods")
        }
        return name
    }

    static validateHostCIDR(cidr: string): string {
        if(isValidCIDR(cidr)){
            return cidr;
        }
        throw new Error("Invalid IP CIDR Notation")
    }

    // deep clone of current ACL
    private clone(): ACLBuilder {
        return JSON.parse(JSON.stringify(this))
    }

    createGroup(name: string): ACLBuilder {
        name = ACLBuilder.validateGroupName(name);
        const {stripped, prefixed} = ACLBuilder.normalizePrefix(name, 'group')

        if (this.groups[prefixed] !== undefined) {
            throw new Error(`Group '${stripped}' already exists`)
        }

        this.groups[prefixed] = []
        return this
    }

    createHost(name: string, cidr: string): ACLBuilder {
        return this.setHost(name, cidr)
    }

    getHostCIDR(name: string): string {
        return this.hosts[name]
    }

    setHost(name: string, cidr: string): ACLBuilder {
        name = ACLBuilder.validateHostName(name);
        cidr = ACLBuilder.validateHostCIDR(cidr);
        this.hosts[name] = cidr
        return this
    }

    renameHost(nameOld: string, nameNew: string): ACLBuilder {
        nameOld = ACLBuilder.validateHostName(nameOld);
        nameNew = ACLBuilder.validateHostName(nameNew);
        if(this.hosts[nameOld] === undefined) {
            throw new Error(`Group '${nameOld}' does not exist`)
        }
        if(this.hosts[nameNew] !== undefined) {
            throw new Error(`Group '${nameNew}' already exists`)
        }
        this.hosts[nameNew] = this.hosts[nameOld]
        delete this.hosts[nameNew]
        return this
    }

    getHostNames(): string[] {
        return Object.keys(this.hosts);
    }

    deleteHost(name: string): ACLBuilder {
        if(this.hosts[name] !== undefined){
            delete this.hosts[name];
        }
        return this
    }

    createTagOwners(name: string): ACLBuilder {
        name = ACLBuilder.validateTagName(name);
        const { prefixed } = ACLBuilder.normalizePrefix(name, 'tag')
        this.tagOwners[prefixed] = [];
        return this
    }


    renameGroup(nameOld: string, nameNew: string): ACLBuilder {
        nameNew = ACLBuilder.validateGroupName(nameNew);
        const {prefixed: prefixedNew} = ACLBuilder.normalizePrefix(nameNew, 'group')
        const {stripped: strippedOld, prefixed: prefixedOld} = ACLBuilder.normalizePrefix(nameOld, 'group')

        // if names are equal, don't do anything
        if (prefixedNew === prefixedOld) {
            return this
        }

        if (this.groups[prefixedOld] === undefined) {
            throw new Error(`Group '${strippedOld}' doesn't exist`);
        }
        this.createGroup(prefixedNew)
        this.setGroupMembers(prefixedNew, this.getGroupMembers(strippedOld) ?? [])
        this.deleteGroup(strippedOld)

        //TODO: change all references from old group to new group

        return this
    }

    deleteGroup(name: string): ACLBuilder {
        const {stripped, prefixed} = ACLBuilder.normalizePrefix(name, 'group')

        if (this.groups[prefixed] === undefined) {
            throw new Error(`Group '${stripped}' doesn't exist`);
        }

        delete this.groups[prefixed];
        return this
    }

    deleteTagOwner(name: string): ACLBuilder {
        const {stripped, prefixed} = ACLBuilder.normalizePrefix(name, 'group')

        if (this.groups[prefixed] === undefined) {
            throw new Error(`Group '${stripped}' doesn't exist`);
        }

        return this
    }

    setTagOwners(name: string, owners: TagOwners): ACLBuilder {
        const {prefixed} = ACLBuilder.normalizePrefix(name, 'group')
        const ownersAll = [] as string[];

        owners.users?.map(u => ownersAll.push(u));
        owners.groups?.map(g => ownersAll.push(ACLBuilder.addPrefix(g, 'tag')));

        this.tagOwners[prefixed] = ownersAll

        return this
    }

    getTagOwners(name: string): TagOwners {
        const {stripped, prefixed} = ACLBuilder.normalizePrefix(name, 'tag')

        if(this.tagOwners[prefixed] === undefined) {
            throw new Error(`Tag ${stripped} does not exist`);
        }

        const owners = {users: [], groups: []} as TagOwners;
        for(const owner of this.tagOwners[prefixed]) {
            if(ACLBuilder.getPrefix(owner) == 'group') {
                const {stripped: strippedOwner} = ACLBuilder.normalizePrefix(owner, 'group')
                if(owners.groups == undefined){
                    owners.groups = []
                }
                owners.groups.push(strippedOwner)
            } else {
                if(owners.users == undefined){
                    owners.users = []
                }
                owners.users.push(owner)
            }
        }

        return owners
    }

    setGroupMembers(name: string, members: string[]): ACLBuilder {
        const {stripped, prefixed} = ACLBuilder.normalizePrefix(name, 'group')

        /*if (this.groups[prefixed] === undefined) {
            throw new Error(`Group '${stripped}' doesn't exist`);
        }*/

        this.groups[prefixed] = [...members];
        return this
    }

    getGroupNames(): string[] {
        const names = []
        for(const name of Object.keys(this.groups)){
            const { stripped } = ACLBuilder.normalizePrefix(name, 'group')
            names.push(stripped)
        }
        return names
    }

    groupExists(name: string): boolean {
        const {prefixed} = ACLBuilder.normalizePrefix(name, 'group')
        return this.groups[prefixed] !== undefined
    }

    getGroupMembers(name: string): string[] | undefined {
        const {prefixed} = ACLBuilder.normalizePrefix(name, 'group')
        return this.groups[prefixed]
    }
}