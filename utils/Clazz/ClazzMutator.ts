import { Key } from "../Reflection"
import { Class } from "../../types"
import { PropertyDescriptor } from "../Descriptors"
import { AddFunc, AddProp, AddProxy, ProtoMethod, ProtoStaticMethod } from "./types"
import { ProxyDescriptor } from '../Descriptors';
import Clazz from "."


class PrototypeMutatorError extends Error {
    constructor(public message: string) { super() }
}


/**
 * @template IM Instance Members
 * @template CP Constructor Parameters
 * @template SM Static Members
 * @template P Parent Class
 */
export default class ClazzMutator<
    IM extends {},
    CP extends any[],
    SM extends {},
    P extends Class<{}> = Class<{}>
> {

    /* It's define if will be modified the real Class or a clone */
    readonly cloned: boolean

    readonly class: Class<IM, CP, SM>

    constructor(clazz: Class<IM, CP, SM>, clone = false) {
        this.cloned = clone
        this.class = clone ? Clazz.clone(clazz) : clazz
    }

    private assertDescriptor(key: Key) {
        if (Object.getOwnPropertyDescriptor(this.class.prototype, key)?.configurable == false)
            throw new PrototypeMutatorError(`Already exists a descriptor non-configurable with the key '${String(key)}' `)
    }

    private assertStaticDescriptor(key: Key) {
        const reserved: Key[] = ['apply', 'arguments', 'bind', 'call', 'caller', 'length', 'name', 'prototype', 'toString']

        if (reserved.includes(key))
            throw new PrototypeMutatorError(`Cant create a static descriptor with key '${String(key)}' because is a reserved key`)

        if (Object.getOwnPropertyDescriptor(this.class, key)?.configurable == false)
            throw new PrototypeMutatorError(`Already exists a static descriptor non-configurable with the key '${String(key)}' `)
    }

    setMethod< K extends Key, F extends ProtoMethod<IM, P, {}, K> >(key: K, func: F, configurable = false, enumerable = false): ClazzMutator< AddFunc<IM, K, F>, CP, SM, P > {
        this.assertDescriptor(key)

        const desc = new PropertyDescriptor(configurable, enumerable, func, false)
        Object.defineProperty(this.class.prototype, key, desc)
        
        return this as any
    }

    // @ts-ignore
    setProperty<K extends Key, V, W extends boolean = true>(key: K, value?: V, writable: W = true, configurable = false, enumerable = false): ClazzMutator< AddProp<IM, K, V, W>, CP, SM, P > {
        this.assertDescriptor(key)

        const desc = new PropertyDescriptor(configurable, enumerable, value, writable)
        Object.defineProperty(this.class.prototype, key, desc)
        
        return this as any
    }


    setProxies<K extends Key, V>(key: K, getter: () => V, setter: (v: V) => void, configurable = false, enumerable = false): ClazzMutator< AddProxy<IM, K, V>, CP, SM, P > {
        this.assertDescriptor(key)

        const desc = new ProxyDescriptor(configurable, enumerable, getter, setter)
        Object.defineProperty(this.class.prototype, key, desc)
        
        return this as any
    }

    setGetter<K extends Key, V>(key: K, getter: () => V, configurable = false, enumerable = false): ClazzMutator< AddProxy<IM, K, V>, CP, SM, P > {
        this.assertDescriptor(key)

        const old = Object.getOwnPropertyDescriptor(this.class.prototype, key)
        const desc = new ProxyDescriptor(configurable, enumerable, getter, old?.set)
        Object.defineProperty(this.class.prototype, key, desc)
        
        return this as any
    }

    setSetter<K extends Key, V>(key: K, setter: (v: V) => void, configurable = false, enumerable = false): ClazzMutator< AddProxy<IM, K, V>, CP, SM, P > {
        this.assertDescriptor(key)

        const old = Object.getOwnPropertyDescriptor(this.class.prototype, key)
        const desc = new ProxyDescriptor(configurable, enumerable, old?.get, setter)
        Object.defineProperty(this.class.prototype, key, desc)
        
        return this as any
    }

    setStaticMethod<K extends Key, F extends ProtoStaticMethod<SM, P> >(key: K, func: F, configurable = false, enumerable = false): ClazzMutator< IM, CP, AddFunc<SM, K, F>, P > {
        this.assertStaticDescriptor(key)

        const desc = new PropertyDescriptor(configurable, enumerable, func, false)
        Object.defineProperty(this.class, key, desc)
        
        return this as any
    }

    // @ts-ignore
    setStaticProperty<K extends Key, V, W extends boolean = true>(key: K, value: V, writable: W = true, configurable = false, enumerable = false): ClazzMutator< IM, CP, AddProp<SM, K, V, W>, P > {
        this.assertStaticDescriptor(key)

        const desc = new PropertyDescriptor(configurable, enumerable, value, writable)
        Object.defineProperty(this.class, key, desc)
        
        return this as any
    }

    setStaticProxies<K extends Key, V>(key: K, getter: () => V, setter: (v: V) => void, configurable?: boolean, enumerable?: boolean): ClazzMutator< IM, CP, AddProxy<SM, K, V>, P > {
        this.assertStaticDescriptor(key)

        const desc = new ProxyDescriptor(configurable, enumerable, getter, setter)
        Object.defineProperty(this.class, key, desc)
        
        return this as any
    }

    setStaticGetter<K extends Key, V>(key: K, getter: () => V, configurable?: boolean, enumerable?: boolean): ClazzMutator< IM, CP, AddProxy<SM, K, V>, P > {
        this.assertStaticDescriptor(key)

        const old = Object.getOwnPropertyDescriptor(this.class, key)
        const desc = new ProxyDescriptor(configurable, enumerable, getter, old?.set)
        Object.defineProperty(this.class, key, desc)
        
        return this as any
    }

    setStaticSetter<K extends Key, V>(key: K, setter: (v: V) => void, configurable?: boolean, enumerable?: boolean): ClazzMutator< IM, CP, AddProxy<SM, K, V>, P > {
        this.assertStaticDescriptor(key)

        const old = Object.getOwnPropertyDescriptor(this.class, key)
        const desc = new ProxyDescriptor(configurable, enumerable, old?.get, setter)
        Object.defineProperty(this.class, key, desc)
        
        return this as any
    }

    setParent<_P extends Class> (parent: _P): ClazzMutator< IM, CP, SM, _P > {
        Object.setPrototypeOf(this.class, parent)
        return this as any
    }

}