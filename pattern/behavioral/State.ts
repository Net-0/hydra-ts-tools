// Variação do Wrapper porém com o Wrapped podendo ser um número limitado de instancias de classes

import { Class, Equals } from "../../types"
import { Key } from "../../utils/Reflection"

/** Type that represents a State Class */
type StateClass<SK extends Key, T extends Object> = Class<StateInstance<SK> & T>

/** Type that represents a State Instance */
type StateInstance<SK extends Key> = { [K in SK]: Key }

/** Typeof States Handler */
type RawStatesHandler<SI extends Object = {}> = Record<Key, SI|Class<SI>>

/** Typeof States Handler */
type StatesHandler<SI extends Object = {}> = Record<Key, SI>

class StateError extends Error {}

/** This util Class has accessors for values to States */
class StateUtils {

    /** Contains the States, where key are the Original Class and the value is a Map where key is a State Key and value is the States */
    private static readonly STATES = new WeakMap<Class, Map<Key, StatesHandler>>()

    /** Contains classes, where value are State Class Instance and value is the Original Class */
    private static readonly CLASSES = new WeakMap<Object, Class>()

    /** Contains the Wrapped States for each State Class Instance, where key is the State Class Instance and value is the Wrapped State.
     * 
     * Obs.: Wrapped State are a union of current states of State Class Instance, where all functions are binded to 'thisArg' be the State Class Instance
     */
    private static readonly WRAPPED_STATES = new WeakMap<Object, Object>()

    /** Contains all Original Classes, where key is the State Class and value is the Original Class */
    private static readonly STATE_CLASSES = new WeakMap<Class, Class>()

    /** Contains all State Classes, where key is the Original Class and value is the State Class */
    private static readonly STATE_CLASSES_REVERSE = new WeakMap<Class, Class>()


    /** Returns the states of {@link clazz} to {@link stateKey} */
    static statesOf<T extends Object = {}>(clazz: Class, stateKey: Key): StatesHandler<T> {
        return StateUtils.STATES.get(clazz).get(stateKey) as any
    }

    /** Returns the states of {@link clazz} to {@link stateKey} */
    static statesOfObject<T extends Object = {}>(obj: Object, stateKey: Key): StatesHandler<T> {
        const clazz = this.classOf(obj)
        return StateUtils.STATES.get(clazz).get(stateKey) as any
    }

    /** Returns the Class of the {@link obj} */
    static classOf(obj: Object) {
        return StateUtils.CLASSES.get(obj)
    }

    /** Returns the states keys of the {@link obj} */
    static statesKeysOf(obj: Object) {
        const clazz = this.classOf(obj)
        return [...StateUtils.STATES.get(clazz).keys()]
    }
    
    /** Returns if {@link clazz} is a State Class */
    static is(clazz: Class) { return this.STATE_CLASSES.has(clazz) }

    /** Define {@link stateClazz} as a State Class where {@link originalClazz} is the original Class */
    static defStateClass(stateClazz: Class, originalClazz: Class) {
        this.STATE_CLASSES.set(stateClazz, originalClazz)
        this.STATE_CLASSES_REVERSE.set(originalClazz, stateClazz)
    }

    /** Returns the original Class to {@link stateClazz} */
    static originalClassOf(stateClazz: Class) { return this.STATE_CLASSES.get(stateClazz) }

    /** Returns if already exists a State Class to {@link clazz} */
    static hasStateClass(clazz: Class) {
        return this.STATE_CLASSES.has(clazz) || this.STATE_CLASSES_REVERSE.has(clazz)
    }

    /** Returns the State Class to {@link originalClazz} */
    static stateClassOf(originalClazz: Class) {
        return this.STATE_CLASSES_REVERSE.get(originalClazz)
    }

    /** Define the states of {@link clazz} to {@link stateKey} */
    static defStates<T extends Object = {}>(clazz: Class, stateKey: Key, states: RawStatesHandler<T>): void {
        for (let key of Reflect.ownKeys(states)) {
            if (!(states[key] instanceof Function)) continue;
            states[key] = (states[key] as Function).prototype
            delete states[key].constructor
        }

        this.STATES.has(clazz)
            ? this.STATES.get(clazz).set(stateKey, states)
            : this.STATES.set(clazz, new Map().set(stateKey, states))
    }

    /** Define the states of {@link clazz} to {@link stateKey} */
    static addStates<T extends Object = {}>(clazz: Class, stateKey: Key, states: RawStatesHandler<T>): void {
        for (let key of Reflect.ownKeys(states)) {
            if (!(states[key] instanceof Function)) continue;
            states[key] = (states[key] as Function).prototype
            delete states[key].constructor
        }

        if (!this.STATES.has(clazz)) throw new StateError(`Dont exists states for this Class: ${clazz.name}`)
        if (this.STATES.get(clazz).has(stateKey)) throw new StateError(`Dont exists states for the class '${clazz.name}' with state key '${String(stateKey)}'`)

        const clazzStates = this.STATES.get(clazz).get(stateKey)
        for(let [stateValue, state] of Object.entries(states)) {
            if (stateValue in clazzStates)
                throw new StateError(`Already Exists a state for the class '${clazz.name}' with state key '${String(stateKey)}' and value '${String(stateValue)}'`)
            
            
        }
    }

    /** Define the Class of the {@link obj} */
    static defClass(obj: Object, clazz: Class) {
        StateUtils.CLASSES.set(obj, clazz)
    }

    /** Returns the Wrapper State of {@link obj} */
    static wrappeStateOf(obj: Object) {
        return StateUtils.WRAPPED_STATES.get(obj)
    }

    /** Update the Wrapper State of {@link obj} */
    static updateWrappedState(obj: Object) {
        const clazz = StateUtils.CLASSES.get(obj)
        const statesKeys = [...StateUtils.STATES.get(clazz).keys()]
        const wrappedState = {}
        
        for (let stateKey of statesKeys) {
            const stateValue = obj[stateKey]
            const states = this.statesOf(clazz, stateKey)
            const state = states[stateValue]
            
            if (!state) {
                const availableValues = Reflect.ownKeys(states).filter(k => states[k]).map(v => `\n- ${String(v)}`)
                throw new StateError(
                    `Value '${String(stateValue)}' isn't a valid value to property '${String(stateKey)}'. \nThese are the valid values: ${availableValues.join()}`
                )
            }

            for (let sk of Reflect.ownKeys(state)) {
                if (sk in wrappedState) throw new StateError(`Exists more than one State for the object with the member '${String(sk)}'`)

                const desc = Reflect.getOwnPropertyDescriptor(state, sk)
                Reflect.defineProperty(wrappedState, sk, desc)
            }
        }

        StateUtils.WRAPPED_STATES.set(obj, wrappedState)
    }

}

const instanceProxyHandler: ProxyHandler<any> = {}
instanceProxyHandler.get = (_obj, key) => _obj[key] ?? StateUtils.wrappeStateOf(_obj)[key]
instanceProxyHandler.set = (_obj, key, value) => {
    const result = Reflect.set(_obj, key, value)
    if ( StateUtils.statesKeysOf(_obj).includes(key) ) StateUtils.updateWrappedState(_obj)
    return result
}
instanceProxyHandler.defineProperty = (_obj, key, desc) => {
    const result = Reflect.defineProperty(_obj, key, desc)
    if ( StateUtils.statesKeysOf(_obj).includes(key) ) StateUtils.updateWrappedState(_obj)
    return result
}

export default function State<T extends Object, SK extends Key>(stateKey: SK, states: StatesHandler<T>) {
    return function (clazz: StateClass<SK, {}>) {
        
        // If 'clazz' already a State Class, we just add the 'stateKey' and 'states'
        if (StateUtils.is(clazz)) {
            const originClazz = StateUtils.originalClassOf(clazz)
            StateUtils.defStates(originClazz, stateKey, states)
            return clazz
        }

        StateUtils.defStates(clazz, stateKey, states)

        const proxyHandler: ProxyHandler<any> = {}
        proxyHandler.construct = (_clazz, args) => {
            const obj = new _clazz(...args)

            StateUtils.defClass(obj, clazz)
            StateUtils.updateWrappedState(obj)

            return new Proxy(obj, instanceProxyHandler)
        }

        const proxed = new Proxy(clazz, proxyHandler)
        StateUtils.defStateClass(proxed, clazz)
        return proxed

    }
}

/** Returns if {@link clazz} is really a State Class */
State.is = (clazz: Class) => StateUtils.is(clazz)









// class LowFuelState {
//     get _fuel_() { return 'low' }
//     ligar() { return 'Rum...rum..... rum... Carro ligado' }
// }

// const FullFuelState = {
//     get _fuel_() { return 'full' },
//     seila: 'abc',
//     ligar() { return 'Rum.. Carro ligado, ' + this.seila }
// }


// class EmptyBatteryState {
//     get _battery_() { return 'empty' }
//     acender() { return 'Não foi possível acender os farois.... Sem bateria....' }
// }

// class FullBatteryState {
//     get _battery_() { return 'full' }
//     acender() { return 'Luzes acessas' }
// }

// @State('battery', {
//     empty: EmptyBatteryState,
//     full: FullBatteryState
// })
// @State('fuel', {
//     low: LowFuelState,
//     full: FullFuelState
// })
// class Car {
//     fuel = 'low'
//     _fuel_: string
//     battery = 'empty'
//     _battery_: string
//     ligar: () => string
//     acender: () => string
// }

// const car = new Car()
// car.fuel = 'low'
// car._fuel_
// car.ligar()
// car.fuel = 'full'
// car._fuel_
// car.ligar()

// car.battery = 'empty'
// car.acender()
// car.battery = 'full'
// car.acender()