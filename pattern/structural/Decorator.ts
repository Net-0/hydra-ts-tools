// Extensão 'simples' do Wrapper

import { Class } from "../../types"

/** This Map contains pairs where the key is a real decorator instance and the value is the decorated instance */
const DECORATORS = new WeakMap()

/** This Map contains pairs where the key is a proxy instance and the value is the real decorator instance */
const PROXED = new WeakMap()

/** Proxy Handler of a instance of a Decorated Class */
const instanceHandler: ProxyHandler<any> = {}

instanceHandler.apply = (_obj, thisArg, args) => Reflect.apply(DECORATORS.get(_obj), thisArg, args)
instanceHandler.construct = (_obj, args) => Reflect.construct(DECORATORS.get(_obj), args)
instanceHandler.defineProperty = (_obj, key, desc) => Reflect.defineProperty(DECORATORS.get(_obj), key, desc)
instanceHandler.deleteProperty = (_obj, key) => delete DECORATORS.get(_obj)[key]
instanceHandler.get = (_obj, key) => DECORATORS.get(_obj)[key]
instanceHandler.getOwnPropertyDescriptor = (_obj, key) => Reflect.getOwnPropertyDescriptor(DECORATORS.get(_obj), key)
instanceHandler.getPrototypeOf = (_obj) => Reflect.getPrototypeOf(DECORATORS.get(_obj))
instanceHandler.has = (_obj, key) => key in DECORATORS.get(_obj)
instanceHandler.isExtensible = (_obj) => Reflect.isExtensible(DECORATORS.get(_obj))
instanceHandler.ownKeys = (_obj) => Reflect.ownKeys(DECORATORS.get(_obj))
instanceHandler.preventExtensions = (_obj) => Reflect.preventExtensions(DECORATORS.get(_obj))
instanceHandler.set = (_obj, key, value) => Reflect.set(DECORATORS.get(_obj), key, value)
instanceHandler.setPrototypeOf = (_obj, proto) => Reflect.setPrototypeOf(DECORATORS.get(_obj), proto)


/** Mutate a Class to instances of this class be decorators */
export default function Decorator<C extends Class>(clazz: C) {
    const handler: ProxyHandler<C> = {}

    handler.construct = (_clazz, args) => {
        const obj = Object.create(_clazz.prototype)
        const decorated = new _clazz(...args)
        DECORATORS.set(obj, decorated)

        const proxed = new Proxy(obj, instanceHandler)
        PROXED.set(proxed, obj)
        return proxed
    }

    return new Proxy(clazz, handler)
}

/** Define the {@link decorated} as the decorated of {@link decorator} */
Decorator.define = <T extends Object>(decorator: T, decorated: T) => { DECORATORS.set(PROXED.get(decorator), decorated) }

/** Returns if {@link obj} is a Decorator Instance */
Decorator.is = (obj: Object) => DECORATORS.has(PROXED.get(obj))

/** Returns the decorated of {@link obj} */
Decorator.of = <T extends Object>(obj: T) => DECORATORS.get(obj) as T|undefined



// @Decorator
// class Car {
//     ligar: () => string
// }


// class LuxuryCar {
//     ligar() { return 'ligando LuxuryCar' }
// }

// class SportCar {
//     ligar() { return 'ligando SportCar' }
// }

// const car = new Car()
// Decorator.is(car)
// car.ligar?.()
// Decorator.define(car, new LuxuryCar())
// car.ligar()
// Decorator.define(car, new SportCar())
// car.ligar()