import { AnyFunc, Class } from "../../types"
import { Key } from "../Reflection"
import { ProxyDescriptor, PropertyDescriptor, Descriptor } from "../Descriptors"
import { ProtoSetter, ProtoConstructor, ProtoGetter, ProtoMethod, ProtoStaticGetter, ProtoStaticSetter, ProtoStaticMethod, AddProp, AddProxy, AddFunc } from "./types"


class ClazzBuilderError extends Error {
    constructor( public message: string ) { super() }
}

/**
 * @template IM Instance Members
 * @template CP Constructor Parameters
 * @template SM Static Members
 * @template P Parent Class
 * @template I Implementations
 */
export default class ClazzBuilder< 
    IM extends {}, 
    CP extends any[] = [],
    SM extends {} = {},
    P extends Class = Class,
    I extends {} = {}
> {

    private name = ''
    private $constructor?: (...args: CP) => void
    private parent?: P
    private decriptors: Record<Key, Descriptor> = {}
    private staticDecriptors: Record<Key, Descriptor> = {}

    private assertDescriptor(key: Key) {
        if (this.decriptors[key]?.configurable === false) 
            throw new ClazzBuilderError(`Already exists a descriptor non-configurable with the key '${String(key)}' `)
    }

    private assertStaticDescriptor(key: Key) {
        const reserved: Key[] = ['apply', 'arguments', 'bind', 'call', 'caller', 'length', 'name', 'prototype', 'toString']

        if (reserved.includes(key))
            throw new ClazzBuilderError(`Cant create a static descriptor with key '${String(key)}' because is a reserved key`)

        if (this.staticDecriptors[key]?.configurable === false) 
            throw new ClazzBuilderError(`Already exists a static descriptor non-configurable with the key '${String(key)}' `)
    }

    /** Set the name for the prototype */
    setName(name: string): ClazzBuilder<IM, CP, SM, P, I> {
        const invalid = /[^\w\$]/

        if (this.name) throw new ClazzBuilderError('Prototype name is already defined!!!')
        if(invalid.test(name)) throw new ClazzBuilderError('Prototype name cant have this character: ' + name.match(invalid)![0] )

        this.name = name
        return this
    }

    /** 
     * Set the {@link func} as the constructor of the prototype 
     * @throws Error if {@link func} isn't a regular function
     * @throws Error where a constructor is already defined
     */
    setConstructor<F extends ProtoConstructor<IM, CP, P, I>>(func: F): ClazzBuilder< IM, Parameters<F>, SM, P, I > {
        const $func = func as AnyFunc

        if (this.$constructor) throw new ClazzBuilderError('Prototype constructor is already defined!!!')
        if (!$func.toString().trim().startsWith('function')) throw new ClazzBuilderError('This function cant be a constructor because it isnt a regular Function!!!')

        this.$constructor = func as any
        return this as any
    }
    
    /** 
     * Set the {@link parent} as the parent prototype
     * @throws Error where a parent prototype is already defined
     */
    setParent<_P extends P>(parent: _P): ClazzBuilder<IM, CP, SM, _P, I> {
        if (this.parent) throw new ClazzBuilderError('Prototype parent is already defined!!!')
        this.parent = parent as any

        return this as any
    }

    /**
     * Sugar method just to add type helper to interface of prototype when building it 
     *
     * {@link IMP} is the a object type to add to interface of prototype
     */
    setInterface<_I extends {}>(): ClazzBuilder< IM, CP, SM, P, I & _I> {
        return this as any
    }

    /** 
     * Set a property with {@link key} and {@link value} as a property
     * @throws Error where a property, getter, setter or method with {@link key} is already defined and isn't configurable
     */
    // @ts-ignore
    setProperty<K extends Key, V, W extends boolean = true>(key: K, value?: V, writable: W = true, configurable = false, enumerable = false): ClazzBuilder<AddProp<IM, K, V, W>, CP, SM, P, I> {
        this.assertDescriptor(key)
        this.decriptors[key] = new PropertyDescriptor(configurable, enumerable, value, writable)

        return this as any
    }

    /**
     * Set Getter and Setter with {@link key}
     * @throws Error when already defined a Getter or Setter that isnt configurable with {@link key}
     */
    setProxies<K extends Key, V>(key: K, getter: ProtoGetter<IM, P, I, V>, setter: ProtoSetter<IM, P, I, V>, configurable = false, enumerable = false): ClazzBuilder<AddProxy<IM, K, V>, CP, SM, P, I> {
        this.assertDescriptor(key)
        this.decriptors[key] = new ProxyDescriptor(configurable, enumerable, getter, setter)

        return this as any
    }

    /** 
     * Set a Getter with {@link key} where {@link getter} is the Getter Function
     * @throws Error where a getter, property, method with {@link key} is already defined and isnt configurable
     * @throws Error where already exists a Setter with {@link key} and {@link configurable} and {@link enumerable} arent the same
     */
    setGetter<K extends Key, V>(key: K, getter: ProtoGetter<IM, P, I, V>, configurable = false, enumerable = false): ClazzBuilder<AddProxy<IM, K, V>, CP, SM, P, I> {
        this.assertDescriptor(key)
        const old = this.decriptors[key]
        this.decriptors[key] = new ProxyDescriptor(configurable, enumerable, getter, old?.set)

        return this as any
    }
    
    /** 
     * Set a Setter with {@link key} where {@link setter} is the Setter Function
     * @throws Error where a Setter or Getter with {@link key} is already defined and isnt configurable
     */
    setSetter<K extends Key, V>(key: K, setter: ProtoSetter<IM, P, I, V>, configurable = false, enumerable = false): ClazzBuilder<AddProxy<IM, K, V>, CP, SM, P, I> {
        this.assertDescriptor(key)
        const old = this.decriptors[key]
        this.decriptors[key] = new ProxyDescriptor(configurable, enumerable, old?.get, setter)

        return this as any
    }
    
    /** 
     * Set a method with {@link key} where {@link func} is the method implementation
     * @throws Error where a method with {@link key} is already defined and isnt configurable
     * @throws Error where already exists a Setter with {@link key} and {@link configurable} and {@link enumerable} arent the same
     */
    setMethod<K extends Key, F extends ProtoMethod<IM, P, I, K>>(key: K, func: F, configurable = false, enumerable = false): ClazzBuilder<AddFunc<IM, K, F>, CP, SM, P, I> {
        this.assertDescriptor(key)
        this.decriptors[key] = new PropertyDescriptor(configurable, enumerable, func, false)

        return this as any
    }
    
    /** 
     * Set a property with {@link key} and {@link value} as a static property
     * @throws Error where a property with {@link key} is already defined and isn't writable or isn't configurable
     */
    // @ts-ignore
    setStaticProperty<K extends Key, V, W extends boolean = true>(key: K, value?: V, writable: W = true, configurable = false, enumerable = false): ClazzBuilder<IM, CP, AddProp<SM, K, V, W>, P, I> {
        this.assertStaticDescriptor(key)
        this.staticDecriptors[key] = new PropertyDescriptor(configurable, enumerable, value, writable)

        return this as any
    }
    
    /**
     * Set static Getter and Setter with {@link key}
     * @throws Error when already defined a Getter or Setter that isnt configurable with {@link key}
     */
    setStaticProxies<K extends Key, V>(key: K, getter: ProtoStaticGetter<SM, P, V>, setter: ProtoStaticSetter<SM, P, V>, configurable = false, enumerable = false): ClazzBuilder<IM, CP, AddProxy<SM, K, V>, P, I> {
        this.assertStaticDescriptor(key)
        this.staticDecriptors[key] = new ProxyDescriptor(configurable, enumerable, getter, setter)

        return this as any
    }

    /** 
     * Set a static Getter with {@link key} where {@link getter} is the Getter Function
     * @throws Error where a static Getter with {@link key} is already defined and isnt configurable
     */
    setStaticGetter<K extends Key, V>(key: K, getter: ProtoStaticGetter<SM, P, V>, configurable = false, enumerable = false): ClazzBuilder<IM, CP, AddProxy<SM, K, V>, P, I> {
        const old = this.staticDecriptors[key]
        this.assertStaticDescriptor(key)
        this.staticDecriptors[key] = new ProxyDescriptor(configurable, enumerable, getter, old?.set)

        return this as any
    }
    
    /** 
     * Set a static Setter with {@link key} where {@link setter} is the Setter Function
     * @throws Error where a static Setter with {@link key} is already defined and isnt configurable
     */
    setStaticSetter<K extends Key, V>(key: K, setter: ProtoStaticSetter<SM, P, V>, configurable = false, enumerable = false): ClazzBuilder<IM, CP, AddProxy<SM, K, V>, P, I> {
        const old = this.staticDecriptors[key]
        this.assertStaticDescriptor(key)
        this.staticDecriptors[key] = new ProxyDescriptor(configurable, enumerable, old?.get, setter)

        return this as any
    }
    
    /** 
     * Set a static method with {@link key} where {@link func} is the method implementation
     * @throws Error where a static method with {@link key} is already defined and isnt configurable
     */
    setStaticMethod<K extends Key, F extends ProtoStaticMethod<SM, P>>(key: K, func: F, configurable = false, enumerable = false): ClazzBuilder<IM, CP, AddFunc<SM, K, F>, P, I> {
        this.assertStaticDescriptor(key)
        this.staticDecriptors[key] = new PropertyDescriptor(configurable, enumerable, func, false)

        return this as any
    }

    /** 
     * Return the builded prototype
     * @throws Error where you dont defined a name to the Prototype
     */
    build(): Class<IM, CP, SM, P> {
        const $constructor: Function = this.$constructor ?? (() => {})
        const Parent = this.parent ?? class {}

        let clazz = class extends Parent {
            constructor(...args) {
                super(...args)
                $constructor.call(this,...args)
            }
        }

        if (this.name) Object.defineProperty(clazz, 'name', { value: this.name, writable: false })

        Object.defineProperties(clazz.prototype, this.decriptors)
        Object.defineProperties(clazz, this.staticDecriptors)

        return clazz as any
    }

}
