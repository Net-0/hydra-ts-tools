import Observer, { Callback } from "../pattern/behavioral/Observer"
import { Class, Keys } from "../types"
import { Key } from "./Reflection"


const GET_OBSERVERS = new WeakMap<any, Map<Key, Observer>>()
const SET_OBSERVERS = new WeakMap<any, Map<Key, Observer>>()

const REAL_INSTANCES = new WeakMap<any, any>()

type GetCallback<T> = (this: T) => void
type SetCallback<T, V = any> = (this: T, oldValue: V, newValue: V) => void

/** A extension of Observer Pattern, that notify when interact with object members */
export default function Observable<C extends Class>(clazz: C) {
    const handler: ProxyHandler<C> = {}
    
    handler.construct = (_clazz, args) => {
        const obj = new _clazz(...args)
        const instanceHandler: ProxyHandler<InstanceType<C>> = {}

        instanceHandler.set = (_obj, key, newValue) => {
            const oldValue = _obj[key]
            const result = Reflect.set(_obj, key, newValue)
            SET_OBSERVERS.get(_obj)?.get(key)?.call(oldValue, newValue)
            return result
        }

        instanceHandler.get = (_obj, key) => {
            GET_OBSERVERS.get(_obj)?.get(key)?.call()
            return Reflect.get(_obj, key)
        }

        const proxed = new Proxy(obj, instanceHandler)
        REAL_INSTANCES.set(proxed, obj)
        return proxed
    }

    return new Proxy(clazz, handler)
}


function defineObservers(obj: any, key: Key, func: Callback, observersMap: WeakMap<any, Map<Key, Observer>>) {
    if (observersMap.has(obj)) {
        const observers = observersMap.get(obj)
        if (observers.has(key)) observers.get(key).on(func)
        else observers.set(key, new Observer(obj).on(func))
    }
    else {
        const observers = new Map()
        observers.set(key, new Observer(obj).on(func))
        observersMap.set(obj, observers)
    }
}

interface Adder<T extends Object> {
    /** Add a Getter observer */
    get: <K extends Keys<T>>(key: K, func: GetCallback<T>) => void

    /** Add a Setter observer */
    set: <K extends Keys<T>>(key: K, func: SetCallback<T, T[K]>) => void
}

/** Return the object to add observers */
Observable.on = <T extends Object>(obj: T) => {
    const realObj = REAL_INSTANCES.get(obj)
    const Events = {} as Adder<T>

    Events.get = (key, func) => defineObservers(realObj, key, func, GET_OBSERVERS)
    Events.set = (key, func) => defineObservers(realObj, key, func, SET_OBSERVERS)

    return Events
}


interface Remover<T extends Object> {
    /** Remove a Getter observer */
    get: <K extends Keys<T>>(key: K, func: GetCallback<T>) => void

    /** Remove a Setter observer */
    set: <K extends Keys<T>>(key: K, func: SetCallback<T, T[K]>) => void
}

/** Return the object to remove observers */
Observable.off = <T extends Object>(obj: T) => {
    const realObj = REAL_INSTANCES.get(obj)
    const Events = {} as Remover<T>

    Events.get = (key, func) => GET_OBSERVERS.get(realObj)?.get(key)?.off(func)
    Events.set = (key, func) => GET_OBSERVERS.get(realObj)?.get(key)?.off(func)

    return Events
}


// @Observable
// class Car {
//     prop: number
// }

// const car = new Car()
// let getCounter = 0
// let setCounter = 0

// Observable.on(car).get('prop', function() {
//     getCounter++
//     console.log(this)
//     console.log('Getting')
// })
// Observable.on(car).set('prop', function(oldValue, newValue) {
//     setCounter++
//     console.log(this)
//     console.log(`Setting: ${oldValue} / ${newValue}`)
// })

// car.prop
// car.prop = 15
// car.prop