import { Class } from "../../types"
import { Descriptor } from "./Descriptors"

export type Key = string|symbol|number

class Locker {
    constructor(public locked: boolean, public sealed: boolean, public frozen: boolean) {}
}

/** Utils to interact with objects */
export default class Reflection {

    /** Store the lockers info */
    private static readonly lockers = new WeakMap<Object, Locker>()

    /** Validate if {@link target} has a own member or in prototype chain with {@link key} */
    static hasKey(target: Object, key: Key) {
        return key in target
    }

    /** Returns keys of {@link target} */
    static keys(target: Object) {
        return Reflect.ownKeys(target) as Key[]
    }

    /** Returns pairs of keys and values of {@link target} */
    static entries(target: Object) {
        return Reflect.ownKeys(target).map(key => [key, target[key]]) as [key: Key, value: any]
    }

    /** Returns the member descriptor of {@link key} in {@link target} */
    static descriptor(target: Object, key: Key) {
        return Reflect.getOwnPropertyDescriptor(target, key) as Descriptor
    }

    /** Define the member descriptor as {@link descriptor} of {@link key} in {@link target} */
    static defDescriptor(target: Object, key: Key, descriptor: Descriptor) {
        Reflect.defineProperty(target, key, descriptor)
    }

    /**
     * Define {@link value} as member at {@link key} of {@link target}
     * 
     * @param writable Define if member can bet setted. Default = `true`
     * @param enumerable Define if member will be showed in outputs. Default = `false`
     * @param configurable Define if member can be define again. Default = `false`
     */
    static defMember(target: Object, key: Key, value: any, writable = true, enumerable = false, configurable = false) {
        Reflect.defineProperty(target, key, { value, writable, enumerable, configurable })
    }

    /**
     * Define {@link get} and {@link set} as proxy member at {@link key} of {@link target}
     * 
     * @param enumerable Define if member will be showed in outputs. Default = `false`
     * @param configurable Define if member can be define again. Default = `false`
     */
    static defProxy(target: Object, key: Key, get: () => any, set?: (value: any) => void, enumerable = false, configurable = false) {
        Reflect.defineProperty(target, key, { get, set, enumerable, configurable })
    }

    /** Returns descriptors of {@link target} */
    static descriptors(target: Object) {
        const descriptors = Object.getOwnPropertyDescriptors(target) as Record<Key, Descriptor>
        return Reflect
                .ownKeys(target)
                .map(key => [key, descriptors[key]] as [key: Key, descriptor: Descriptor])
    }

    /** Define the {@link descriptors} in {@link target} */
    static defDescriptors(target: Object, ...descriptors: [key: Key, descriptor: Descriptor][]) {
        descriptors.forEach(([k,d]) => Reflect.defineProperty(target, k, d))
    }

    /** Lock addition of new members in {@link target} */
    static lock(target: Object) {
        if (this.lockers.has(target)) return;
        
        this.lockers.set(target, new Locker(true, false, false))
        Object.preventExtensions(target)
    }
    
    /** Extends {@link lock}, locking addition of new members and change existing members descriptors */
    static seal(target: Object) {
        if (this.lockers.get(target)?.sealed) return;
        
        this.lockers.set(target, new Locker(true, true, false))
        Object.seal(target)
    }

    /** Extends {@link seal}, locking addition of new members and change existing members descriptors and values */
    static freeze(target: Object) {
        if (this.lockers.get(target)?.frozen) return;

        this.lockers.set(target, new Locker(true, true, true))
        Object.freeze(target)
    }
    
    /** Returns if a object was locked by {@link lock} */
    static locked(target: Object) { return this.lockers.has(target) }

    /** Returns if a object was sealed by {@link seal} */
    static sealed(target: Object) { return this.lockers.get(target)?.sealed }

    /** Returns if a object was frozen by {@link freeze} */
    static frozen(target: Object) { return this.lockers.get(target)?.frozen }

    /** Returns a shallow clone of {@link target} */
    static clone<T extends Object>(target: T) {
        const cloned = {}
        Object.setPrototypeOf(cloned, Object.getPrototypeOf(target))
        Object.defineProperties(cloned, Object.getOwnPropertyDescriptors(target))
        return cloned as T
    }

    /** Returns all keys of {@link target}, including of prototype chain */
    static allKeys(target: Object, ignoreObjectDeprecated = true): Key[] {
        const result = []
        for (let proto = target; proto; proto = Reflect.getPrototypeOf(proto)) result.push(...Reflect.ownKeys(proto))

        const resultSet = [...new Set(result)]
        return ignoreObjectDeprecated
                ? resultSet
                    .filter(k => {
                        return k != 'constructor' &&
                               k != '__defineGetter__' &&
                               k != '__defineSetter__' &&
                               k != 'hasOwnProperty' &&
                               k != '__lookupGetter__' &&
                               k != '__lookupSetter__' &&
                               k != 'propertyIsEnumerable' &&
                               k != '__proto__'
                    })
                : resultSet.filter(k => k != 'constructor')
    }

}

// console.time('Original')
// Reflect.ownKeys(Array.prototype)
// console.timeEnd('Original')

// console.time('Wrapped')
// Reflection.keys(Array.prototype)
// console.timeEnd('Wrapped')

// class Car {
//     propCar = 2
//     static sPropCar = 2
// }

// class Dodge extends Car {
//     propDodge = 3
//     static sPropDodge = 3
// }

// console.time('1')
// Reflection.allKeys(new Dodge())
// console.timeEnd('1')
