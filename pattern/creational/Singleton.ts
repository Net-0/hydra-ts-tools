import { Class } from "../../types"

type SimpleClass = new() => any

const INSTANCES = new WeakMap<Class, any>()

/** Returns a Singleton Class of {@link clazz} */
export default function Singleton<T extends SimpleClass>(clazz: T) {
    const handler: ProxyHandler<T> = {}

    handler.construct = (_clazz, args, proxyClass: Class) => {
        if (!INSTANCES.has(proxyClass))
            INSTANCES.set(proxyClass, new _clazz())

        return INSTANCES.get(proxyClass)
    }

    return new Proxy(clazz, handler)
}

/** Returns if {@link clazz} is a Singleton Class */
Singleton.is = <T extends SimpleClass> (clazz: T) => INSTANCES.has(clazz)


// @Singleton
// class Car {
//     propCar = 1
// }

// class Car2 {
//     constructor(public propCar: number) {}
// }

// const Car$$Singleton = Singleton(Car)

// const obj = new Car()
// const proxedObj = new Car()

// console.log(obj == proxedObj)
// console.log('obj Prop', obj.propCar)
// console.log('proxed Prop', proxedObj.propCar)
// proxedObj.propCar = 3
// console.log('obj Prop', obj.propCar)
// console.log('proxed Prop', proxedObj.propCar)