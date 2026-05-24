import { Mutex } from 'async-mutex';

import { browser } from '$app/environment';
import type { User, Node, PreAuthKey, ApiKeyInfo, ApiApiKeys, Deployment } from '$lib/common/types';
import { getUsers, getPreAuthKeys, getNodes } from '$lib/common/api/get';
import type { ToastStore } from '@skeletonlabs/skeleton';
import { apiGet } from './common/api';
import { setPolicy } from '$lib/common/api/modify';
import type { ACLBuilder } from '$lib/common/acl.svelte';
import { arraysEqual, clone, toastError, toastWarning } from './common/funcs';
import { debug } from './common/debug';
import { _ } from 'svelte-i18n';
import { get } from 'svelte/store';
import { getInitialLocale, persistLocalePreference, type SupportedLocale } from '$lib/i18n';

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


// state that is wrapped in LocalStorage or SessionStorage
export class StateLocal<T> {
    #key: string;
    #value = $state<T>() as T;
    #effect?: (value?: T) => void;
    #session: boolean;

    get key() {
        return this.#key;
    }

    get value(): T {
        return this.#value;
    }

    set value(value: T) {
        this.#value = value;
        if(this.#effect !== undefined) {
            this.#effect(value);
        }
    }

    get storage(): Storage | null {
        if (!browser) return null;
        return this.#session ? sessionStorage : localStorage;
    }

    save(value: T) {
        debug(`Saving '${this.#key}' in ${this.#session ? 'sessionStorage' : 'localStorage'}...`);
        this.storage?.setItem(this.#key, this.serialize(value));
    }


    constructor(
        key: string,
        valueDefault: T,
        effect?: (value?: T) => void,
        session: boolean = false,
        saveDefaultOnInit: boolean = true,
    ) {
        this.#key = key;
        this.#effect = effect;
        this.#value = valueDefault;
        this.#session = session;

        if(browser){
            const storedValue = this.storage?.getItem(this.#key);
            const hasStoredValue = storedValue !== null;
            if (storedValue) {
                this.#value = this.deserialize(storedValue);
            }

            let initialSaveSkipped = false;
            $effect.root(()=>{
                $effect(()=>{
                    if (!saveDefaultOnInit && !hasStoredValue && !initialSaveSkipped) {
                        initialSaveSkipped = true;
                        return;
                    }

                    initialSaveSkipped = true;
                    this.save(this.#value);
                })
            })
        }
    }

    serialize(value: T): string {
        return JSON.stringify(value);
    }

    deserialize(item: string): T {
        try {
            return JSON.parse(item) as T;
        } catch (error) {
            if (typeof this.#value === 'string') {
                return item as T;
            }

            debug(`Failed to deserialize '${this.#key}', falling back to default value.`, error);
            return this.#value;
        }
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

    // language settings  
    language = new StateLocal<SupportedLocale>(
        'locale',
        getInitialLocale(),
        (language) => {
            if (language !== undefined) {
                persistLocalePreference(language);
            }
        },
        false,
        false,
    )

    // api info
    apiValid = $state<boolean>(false);
    apiUrl = new StateLocal<string>('apiUrl', '');
    
    #apiKey = new StateLocal<string>('apiKey', '');
    #apiKeySession = new StateLocal<string>('apiKey', '', undefined, true);

    get apiKey(): StateLocal<string> {
        const key = this.apiRememberMe.value ? this.#apiKey : this.#apiKeySession;
        // If we switched from remember to not remember, or vice versa, ensure the key is transferred
        if (this.apiRememberMe.value && !this.#apiKey.value && this.#apiKeySession.value) {
            this.#apiKey.value = this.#apiKeySession.value;
            this.#apiKeySession.value = '';
        } else if (!this.apiRememberMe.value && !this.#apiKeySession.value && this.#apiKey.value) {
            this.#apiKeySession.value = this.#apiKey.value;
            this.#apiKey.value = '';
        }
        return key;
    }

    apiRememberMe = new StateLocal<boolean>('apiRememberMe', false);
    apiTtl = new StateLocal<number>('apiTTL', 10000);
    apiKeyInfo = new StateLocal<ApiKeyInfo>('apiKeyInfo', {
        authorized: null,
        expires: '',
        informedUnauthorized: false,
        informedExpiringSoon: false,
    })
    hasApiKey = $derived(isInitialized() && !!this.apiKey.value)
    hasApiUrl = $derived(isInitialized() && !!this.apiUrl.value)
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

        // Keep full keys (no asterisks) for a given ID if the new one is masked
        // This preserves the initially shown full key when API refreshes show masked version
        preAuthKeys = preAuthKeys.map((newKey) => {
            const existingKey = this.preAuthKeys.value.find(k => k.id === newKey.id);
            
            // Safety checks for key field
            if (existingKey && 
                newKey.key && existingKey.key &&
                typeof newKey.key === 'string' && 
                typeof existingKey.key === 'string') {
                
                // If new key is masked (has asterisks) and existing is not, keep the full key
                if (newKey.key.includes('*') && !existingKey.key.includes('*')) {
                    debug('Preserving full key for ID', newKey.id, '- old:', existingKey.key.substring(0, 20), 'new:', newKey.key.substring(0, 20));
                    return existingKey;
                }
            }
            
            return newKey;
        });

        if(!arraysEqual(this.preAuthKeys.value, preAuthKeys)){
            this.preAuthKeys.value = [...preAuthKeys]
            return true
        }
        return false
    }

    async populateApiKeyInfo(): Promise<boolean> {
        const { apiKeys } = await apiGet<ApiApiKeys>(`/api/v1/apikey`);
        const myKey = apiKeys.find((key) => {
            const cleanPrefix = key.prefix.replace(/\*+$/, '');
            return this.apiKey.value.startsWith(cleanPrefix);
        });

        const apiKeyInfo = this.apiKeyInfo.value
        apiKeyInfo.authorized = true;
        if (myKey) {
            apiKeyInfo.expires = myKey.expiration;
        }
        
        this.apiKeyInfo.value = {...apiKeyInfo};
        return true;
    }

    async populateAll(handler?: (err: unknown) => void, repeat: boolean = true){
        if (this.hasApi) {
            try {
                await this.populateApiKeyInfo();
            } catch (err) {
                handler?.(err);
            }

            if (this.hasValidApi) {
                const results = await Promise.allSettled([
                    this.populateUsers(),
                    this.populateNodes(),
                    this.populatePreAuthKeys(),
                    // this.populateRoutes(),
                    this.populateApiKeyInfo(),
                ]);

                results.forEach((result) => {
                    if (result.status === 'rejected') {
                        handler?.(result.reason);
                    }
                });

                debug('Completed all store population requests.');
            }
        }

        if (repeat === true) {
            setTimeout(() => {
                this.populateAll(handler, true)
            }, this.apiTtl.value)
        }
    }

    async setPolicy(acl: ACLBuilder) {
        await setPolicy(acl);
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

export const App = new HeadscaleAdmin()


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
		toastError(get(_)( 'settings.unauthorizedMessage' ), toastStore);
	});
}

export function informUserExpiringSoon(toastStore: ToastStore) {
	mu.runExclusive(() => {
		if (App.apiKeyInfo.value.informedExpiringSoon === true) {
			return;
		}
		App.apiKeyInfo.value.informedExpiringSoon = true;
		toastWarning(get(_)( 'settings.expiringSoonMessage' ), toastStore);
	});
}
