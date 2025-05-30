import { Mutex } from 'async-mutex';

import { browser } from '$app/environment';
import type { User, Node, PreAuthKey, ApiKeyInfo, ApiApiKeys, Deployment } from '$lib/common/types';
import { getUsers, getPreAuthKeys, getNodes } from '$lib/common/api/get';
import type { ToastStore } from '@skeletonlabs/skeleton';
import { apiGet } from './common/api';
import { arraysEqual, clone, toastError, toastWarning } from './common/funcs';
import { debug } from './common/debug';

export type LayoutStyle = 'tile' | 'list';

function toggledLayout(style: LayoutStyle): LayoutStyle {
    return style === 'list' ? 'tile' : 'list';
}

export type Valued<T> = {
    value: T
}

export class State<T> {
    #value = $state<T>() as T;
    #effect?: (value?: T) => void

    get value(): T {
        return this.#value
    }

    set value(value: T) {
        this.#value = value
        if (this.#effect !== undefined) {
            this.#effect(value)
        }
    }

    constructor(value: T, effect?: (value?: T) => void) {
        this.#value = value
        this.#effect = effect
    }
}


// state that is wrapped in LocalStorage
export class StateLocal<T> {
    #key: string;
    #value = $state<T>() as T;
    #effect?: (value?: T) => void;
    // #saver = $derived(this.save(this.#value))

    get key() {
        return this.#key;
    }

    get value(): T {
        return this.#value;
    }

    set value(value: T) {
        this.#value = value;
        // this.save(this.#value);
        if(this.#effect !== undefined) {
            this.#effect(value);
        }
    }

    save(value: T) {
        debug(`Saving '${this.#key}' in localStorage...`);
        localStorage.setItem(this.#key, this.serialize(value));
    }


    constructor(key: string, valueDefault: T, effect?: (value?: T) => void) {
        this.#key = key;
        this.#effect = effect;

        if(browser){
            const storedValue = localStorage.getItem(this.#key);
            if (storedValue) {
                this.#value = this.deserialize(storedValue);
            } else {
                this.#value = valueDefault;
            }
        
            // how do I clean this up?
            $effect.root(()=>{
                $effect(()=>{
                    this.save(this.#value);
                })
            })
        }
    }

    serialize(value: T): string {
        return JSON.stringify(value);
    }

    deserialize(item: string): T {
        return JSON.parse(item);
    }
}

// application data states
export class HeadscaleAdmin {
    users = new State<User[]>([]);
    nodes = new State<Node[]>([]);
    // routes = new State<Route[]>([]);
    preAuthKeys = new State<PreAuthKey[]>([]);

    // debugging status
    debug = new StateLocal<boolean>('debug', false);

    // theme information
    theme = new StateLocal<string>('theme', 'skeleton', (themeName) => {
        if(themeName !== undefined) {
            document.body.setAttribute('data-theme', themeName);
        }
    })

    // api info
    apiValid = $state<boolean>(false);
    apiUrl = new StateLocal<string>('apiUrl', '');
    apiKey = new StateLocal<string>('apiKey', '');
    apiTtl = new StateLocal<number>('apiTTL', 10000);
    apiKeyInfo = new StateLocal<ApiKeyInfo>('apiKeyInfo', {
        authorized: null,
        expires: '',
        informedUnauthorized: false,
        informedExpiringSoon: false,
    })
    hasApiKey = $derived<boolean>(isInitialized() && !!this.apiKey.value)
    hasApiUrl = $derived<boolean>(isInitialized() && !!this.apiUrl.value)
    hasApi = $derived(this.hasApiKey && this.hasApiUrl)
    hasValidApi = $derived(this.hasApi && this.apiKeyInfo.value.authorized === true)

    // layouts
    layoutUser = new StateLocal<LayoutStyle>('layoutUser', 'list');
    layoutNode = new StateLocal<LayoutStyle>('layoutNode', 'list');
    layoutRoute = new StateLocal<LayoutStyle>('layoutRoute', 'list');

    toggleLayoutUser() {
        this.layoutUser.value = toggledLayout(this.layoutUser.value)
    }

    toggleLayoutNode() {
        this.layoutNode.value = toggledLayout(this.layoutNode.value)
    }

    // deployments
    deploymentDefaults = new StateLocal<Deployment>('deploymentDefaults', {
        // general
        shieldsUp: false,
        generateQR: false,
        reset: false,
        operator: false,
        operatorValue: '$USER',
        forceReauth: false,
        sshServer: false,
        usePreAuthKey: false,
        preAuthKeyUser: '',
        preAuthKey: '',
        unattended: false,
        // advertise
        advertiseExitNode: false,
        advertiseExitNodeLocalAccess: false,
        advertiseRoutes: false,
        advertiseRoutesValues: [],
        advertiseTags: false,
        advertiseTagsValues: [],
        // accept
        acceptDns: false,
        acceptRoutes: false,
        acceptExitNode: false,
        acceptExitNodeValue: '',
    })

    async populateUsers(users?: User[]): Promise<boolean> {
        if (users === undefined) {
            users = await getUsers()
        }
        if(!arraysEqual(this.users.value, users)){
            this.users.value = users
            return true
        }
        return false
    }

    async populateNodes(nodes?: Node[]): Promise<boolean> {
        if (nodes === undefined) {
            nodes = await getNodes()
        }
        if(!arraysEqual(this.nodes.value, nodes)){
            this.nodes.value = nodes
            return true
        }
        return false
    }

    /*
    async populateRoutes(routes?: Route[]): Promise<boolean> {
        if (routes === undefined) {
            routes = await getRoutes()
        }
        if(!arraysEqual(this.routes.value, routes)){
            this.routes.value = routes
            return true
        }
        return false
    }
    */

    async populatePreAuthKeys(preAuthKeys?: PreAuthKey[]): Promise<boolean> {
        if (preAuthKeys === undefined) {
            preAuthKeys = await getPreAuthKeys()
        }
        if(!arraysEqual(this.preAuthKeys.value, preAuthKeys)){
            this.preAuthKeys.value = [...preAuthKeys]
            return true
        }
        return false
    }

    async populateApiKeyInfo(): Promise<boolean> {
        const { apiKeys } = await apiGet<ApiApiKeys>(`/api/v1/apikey`);
        const myKey = apiKeys.filter((key) => this.apiKey.value.startsWith(key.prefix))[0];
        const apiKeyInfo = this.apiKeyInfo.value
        apiKeyInfo.expires = myKey.expiration;
        apiKeyInfo.authorized = true;
        this.apiKeyInfo.value = {...apiKeyInfo};
        return true;
    }

    async populateAll(handler?: (err: unknown) => void, repeat: boolean = true){
        if (this.hasValidApi) {
            const promises = []
            promises.push(this.populateUsers());
            promises.push(this.populateNodes());
            promises.push(this.populatePreAuthKeys());
            // promises.push(this.populateRoutes());
            promises.push(this.populateApiKeyInfo());
            await Promise.allSettled(promises);
            promises.forEach((p) => p.catch(handler));
            debug('Completed all store population requests.');
        }

        if (repeat === true) {
            setTimeout(() => {
                this.populateAll(handler, true)
            }, this.apiTtl.value)
        }
    }

    toggleLayout(layout?: Valued<LayoutStyle>) {
        if (layout) {
            layout.value = (layout.value === 'tile' ? 'list' : 'tile');
        }
    }

    saveDeploymentDefaults(deployment: Deployment) {
        const d = clone(deployment)
        d.preAuthKeyUser = ''
        d.preAuthKey = ''
        this.deploymentDefaults.value = d
    }

    updateValue(valued: Valued<Identified[]>, item: Identified) {
        valued.value = valued.value.map((itemOld) => (itemOld.id === item.id ? item : itemOld));
    }
}

export const App = $state<HeadscaleAdmin>(new HeadscaleAdmin())


function isInitialized(): boolean {
    return true
    // return typeof window !== 'undefined';
}

interface Identified {
	id: string;
}

export function updateItem(items: Identified[], item: Identified): Identified[] {
    return items.map((itemOld) => (itemOld.id === item.id ? item : itemOld))
}

const mu = new Mutex();

export function informUserUnauthorized(toastStore: ToastStore) {
	mu.runExclusive(() => {
		App.apiKeyInfo;
		if (App.apiKeyInfo.value.informedUnauthorized === true) {
			return;
		}
		App.apiKeyInfo.value.informedUnauthorized = true;
		App.apiKeyInfo.value.authorized = false;
		toastError('API Key is Unauthorized or Invalid', toastStore);
	});
}

export function informUserExpiringSoon(toastStore: ToastStore) {
	mu.runExclusive(() => {
		if (App.apiKeyInfo.value.informedExpiringSoon === true) {
			return;
		}
		App.apiKeyInfo.value.informedUnauthorized = true;
		App.apiKeyInfo.value.authorized = false;
		toastWarning('API Key Expires Soon', toastStore);
	});
}