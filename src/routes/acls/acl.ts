export type ACL = {
    groups: {
        [key: string]: string[],
    },
    tagOwners: {
        [key: string]: string[],
    },
    hosts: {
        [key: string]: string[],
    },
    acls: {
        action: string,
        proto?: string,
        src: string[],
        dst: string[],
    }[],
}

export function GetEmptyACL(): ACL {
    return {
        groups: {},
        tagOwners: {},
        hosts: {},
        acls: [],
    }
}