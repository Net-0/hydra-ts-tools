import '../../extensions'
import { Class } from '../../types.js'

class FlyweightError extends Error {}

const PROXED = new WeakMap<Class, Class>()
const CLASS_ARGUMENTS_INSTANCES = new WeakMap<Class, Map<any, any[]>>()

// Singleton baseado em argumentos
export default function Flyweight(clazz: Class) {
    CLASS_ARGUMENTS_INSTANCES.set(clazz, new Map())

    const handler: ProxyHandler<Class> = {}
    handler.construct = (_clazz, args) => {
        const ARGS_INST = CLASS_ARGUMENTS_INSTANCES.get(_clazz)
        for (let [instance, _args] of ARGS_INST.entries()) {
            if (_args.equals(args)) return instance
        }

        const obj = new _clazz(...args)
        ARGS_INST.set(obj, args)
        return obj
    }

    const proxed = new Proxy(clazz, handler)
    PROXED.set(proxed, clazz)
    return proxed as any
}

// Contabiliza a quantidade de Instancias de uma classe
Flyweight.InstanceCounter = (clazz: Class) => {
    const args_inst = CLASS_ARGUMENTS_INSTANCES.get(PROXED.get(clazz)) // Return the number of instances of a Class
    if (args_inst == null) throw new FlyweightError(`'${clazz.name}' isn't a Flyweight Class`)
    return args_inst.size
}




@Flyweight
class _File_ {
    constructor (path) {}
}

// Flyweight example
new _File_('/root/code.js') == new _File_('/root/code.js') // true
new _File_('/root/code.js') == new _File_('/root/code2.js') // true

Flyweight.InstanceCounter(_File_)