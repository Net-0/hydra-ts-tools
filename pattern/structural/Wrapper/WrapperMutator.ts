import { WRAPPER_WRAPPEDS } from "."
import Reflection, { Key } from "../../../utils/Reflection"

type OnGetInterceptor<T> = (wrapped: T, key: Key, wrapper: T) => any
type OnSetInterceptor<T> = (wrapped: T, key: Key, value: any, wrapper: T) => boolean

type ProxyEntry<T extends Object = Object> = {
    get: OnGetInterceptor<T>,
    set: OnSetInterceptor<T>
}

const PROXIES = new WeakMap<Object, ProxyEntry>()

export class WrapperMutator<T extends Object> {

    private static get defaultProxyEntry(): ProxyEntry {
        return {
            get: (wrapped, key) => wrapped[key],
            set: (wrapped, key, value) => { wrapped[key] = value; return true; }
        }
    }

    /** Wrapper Mutated */
    readonly wrapper: T

    constructor(toMutate: T ) {
        const wrapped = Reflection.clone(toMutate)
        this.wrapper = toMutate

        WRAPPER_WRAPPEDS.set(this.wrapper, wrapped)
        PROXIES.set(this.wrapper, WrapperMutator.defaultProxyEntry)

        Reflection
            .allKeys(wrapped)
            .forEach(key => {
                const getter = () => PROXIES.get(this.wrapper).get(wrapped, key, this.wrapper)

                const setter = function(value: any) {
                    const result = PROXIES.get(this.wrapper).set(wrapped, key, value, this.wrapper)
                    if (!result) throw new Error('Error in Set Interceptor of Wrapper Mutated')
                }

                Reflection.defProxy(this.wrapper, key, getter, setter)
            })
        Reflection.freeze(this.wrapper)
    }

    /** Define an interceptor when get value of a key in {@link wrapper} */
    onGet(interceptor: OnGetInterceptor<T>): WrapperMutator<T> {
        PROXIES.get(this.wrapper).get = interceptor
        return this
    }

    /** Define an interceptor when set value of a key in {@link wrapper} */
    onSet(interceptor: OnSetInterceptor<T>): WrapperMutator<T> {
        PROXIES.get(this.wrapper).set = interceptor
        return this
    }

}