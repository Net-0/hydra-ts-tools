import { Class } from "../../types"

class AdapterError extends Error {}

const ADAPTERS = new WeakMap<Class, Map<Class, AdapterClass<any, any>>>()

type AdapterClass<I extends Class, O extends Class> = { adapt(output: InstanceType<O>): InstanceType<I> }

/** Define a Adapter based with {@link inputClass} and {@link outputClass} */
export default function Adapter<I extends Class, O extends Class>(inputClass: I, outputClass: O) {
    return function (clazz: AdapterClass<I, O>) {
        if (ADAPTERS.has(inputClass)) ADAPTERS.get(inputClass).set(outputClass, clazz)
        else ADAPTERS.set(inputClass, new Map().set(outputClass, clazz))
    }
}

/** Return a adapter with {@link inputClass} and {@link outputClass} handling {@link outputInstance} */
Adapter.adapt = <I extends Class, O extends Class>(inputClass: I, outputClass: O, outputInstance: InstanceType<O>) => {
    const adapter: AdapterClass<I, O> = ADAPTERS.get(inputClass).get(outputClass)
    if (!adapter) throw new AdapterError(`Don't exists adapter with input '${inputClass.name}' and output '${outputClass.name}'`)
    return adapter.adapt(outputInstance)
}





// class USAPowerSocket {
//     voltage = 110
//     pins = 3
// }

// class EUPowerSocket {
//     voltage = 115
//     pins = 2
// }

// class EUPowerSupply {}


// @Adapter(EUPowerSocket, USAPowerSocket)
// class AdapterEUToUSAPowerSocket {

//     static adapt(output: USAPowerSocket) {
//         return new AdapterEUToUSAPowerSocket()
//     }

//     voltage: number
//     pins: number
// }


// const usaSocket = new USAPowerSocket()
// const euSocket = Adapter.adapt(EUPowerSocket, USAPowerSocket, usaSocket)