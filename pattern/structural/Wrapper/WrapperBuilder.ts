import { WRAPPER_WRAPPEDS } from "."
import { AnyFunc, Class, Keys } from "../../../../types"
import { Descriptor } from "../../../../utils/Descriptors"
import { Key } from "../../../../utils/Reflection"

type OnCallInterceptor<T extends AnyFunc = () => any> = (wrapped: T, thisArg: any, args: Parameters<T>) => ReturnType<T>
type OnNewInterceptor<T = {}> = (wrapped: T, argArray: any[], newTarget: Function) => object
type OnDefDescriptorInterceptor<T = {}> = (wrapped: T, key: Key, descriptor: Descriptor) => boolean
type OnDeleteInterceptor<T = {}> = (wrapped: T, key: Key) => boolean
type OnGetInterceptor<T extends Object = {}, K extends Keys<T> = any> = (wrapped: T, key: Key, wrapper: T) => T[K]
type OnSetInterceptor<T extends Object = {}, K extends Keys<T> = any> = (wrapped: T, key: Key, value: T[K], wrapper: T) => boolean

export type WrapperBuilder<T extends Object> =
    T extends Class
        ? Omit<_WrapperBuilder_<T>, 'onCall'>
        : T extends Function
            ? _WrapperBuilder_<T>
            : Omit< Omit<_WrapperBuilder_<T>, 'onCall'>, 'onNew' >


class WrapperBuilderError extends Error {}

export class _WrapperBuilder_<T extends Object> {

    constructor( private readonly wrapped: T ) {}
    static #DELETERS = new WeakMap<Object, Map<Key, OnDeleteInterceptor>>()
    static #GETTERS = new WeakMap<Object, Map<Key, OnGetInterceptor>>()
    static #SETTERS = new WeakMap<Object, Map<Key, OnSetInterceptor>>()

    private readonly handler: ProxyHandler<T> = {
        get(wrapped, key, wrapper) {
            const getter = _WrapperBuilder_.#GETTERS.get(wrapped).get(key)
            return getter ? getter(wrapped, key, wrapper) : wrapped[key]
        },
        set(wrapped, key, value, wrapper) {
            const setter = _WrapperBuilder_.#SETTERS.get(wrapped).get(key)
            return setter ? setter(wrapped, key, value, wrapper) : Reflect.set(wrapped, key, value)
        },
        deleteProperty(wrapped, key) {
            const deleter = _WrapperBuilder_.#DELETERS.get(wrapped).get(key)
            return deleter ? deleter(wrapped, key) : Reflect.deleteProperty(wrapped, key)
        }
    }

    /** Define an interceptor when calling {@link wrapped} */
    onCall(interceptor: OnCallInterceptor<T extends AnyFunc ? T : never>): _WrapperBuilder_<T> {
        if (!(this.wrapped instanceof Function))
            throw new WrapperBuilderError("Can't define an interceptor for when calling wrapped, because wrapped is not a function")

        this.handler.apply = interceptor
        return this
    }

    /** Define an interceptor when creating a new instance of {@link wrapped} */
    onNew(interceptor: OnNewInterceptor<T>): _WrapperBuilder_<T> {
        if (!(this.wrapped instanceof Function))
            throw new WrapperBuilderError("Can't define an interceptor for when creating a new instance of wrapped, because wrapped isn't a constructor")

        this.handler.construct = interceptor
        return this
    }

    /** Define an interceptor when defining a descriptor for a key */
    onDefDescriptor(interceptor: OnDefDescriptorInterceptor<T>): _WrapperBuilder_<T> {
        this.handler.defineProperty = interceptor
        return this
    }

    /** Define an interceptor when deleting a descriptor of a key */
    onDelete(key: Keys<T>, interceptor: OnDeleteInterceptor<T>): _WrapperBuilder_<T> {
        // this.handler.deleteProperty = interceptor
        _WrapperBuilder_.#DELETERS.get(this.wrapped).set(key, interceptor)
        return this
    }

    /** Define an interceptor when get value of a key in {@link wrapped} */
    onGet<K extends Keys<T>>(key: K, interceptor: OnGetInterceptor<T, K>): _WrapperBuilder_<T> {
        // this.handler.get = interceptor
        _WrapperBuilder_.#GETTERS.get(this.wrapped).set(key, interceptor)
        return this
    }

    /** Define an interceptor when set value of a key in {@link wrapped} */
    onSet<K extends Keys<T>>(key: K, interceptor: OnSetInterceptor<T, K>): _WrapperBuilder_<T> {
        // this.handler.set = interceptor
        _WrapperBuilder_.#SETTERS.get(this.wrapped).set(key, interceptor)
        return this
    }

    /** Returns a Wrapper builded with added interceptors */
    build(): T {
        const proxed = new Proxy(this.wrapped, this.handler)
        WRAPPER_WRAPPEDS.set(proxed, this.wrapped)
        return proxed
    }
}