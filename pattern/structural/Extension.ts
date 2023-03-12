import { Class } from "../../types"
import { ProxyDescriptor } from "../../utils/Descriptors"
import { Key } from "../../utils/Reflection"

type ExtendedMember<KS extends Key[]> = { [K in KS[number]]: any }
type ExtendedInstance<K extends Key, KS extends Key[]> = { [K in KS[number]]: any } & { [_K in K]: ExtendedMember<KS> }
type ExtendedClass<K extends Key, KS extends Key[]> = Class<ExtendedInstance<K, KS>>

/** This Pattern do members of a object be a extension of members of a member */
export default function Extension<K extends Key, KS extends Key[]>(key: K, ...extendedKeys: KS) {
    return function<CC extends ExtendedClass<K, KS>>(clazz: CC) {
        
        for (const eKey of extendedKeys) {
            const get = function() {
                const content = this[key][eKey]
                return content instanceof Function ? content.bind(this[key]) : content
            }
            const set = function(value) {
                this[key][eKey] = value
            }

            Reflect.defineProperty(clazz.prototype, eKey, new ProxyDescriptor(false, false, get, set))
        }
        
        const handler: ProxyHandler<CC> = {}
        handler.construct = (_clazz, args) => {
            const obj = new _clazz(...args)
            for (const eKey of extendedKeys) delete obj[eKey]
            return obj as any
        }

        return new Proxy(clazz, handler)
    }
}




// class FuelTank {
//     teste = false
//     fuelLevel = 'seila'
//     fillFuel() {
//         console.log(this.teste)
//     }
// }

// @Extension('fuelTank', 'fuelLevel', 'fillFuel')
// class Car {
//     fuelTank = new FuelTank()
//     fuelLevel: string
//     fillFuel: () => void
// }

// const car = new Car()
// car.fillFuel()
// car.fuelLevel
// car.fuelLevel = 'seila2'
// car.fuelLevel
// car.fuelTank.fuelLevel