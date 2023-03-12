import { Class } from "../../types"
import Reflection from "../../utils/Reflection"

type Keys<T> = keyof T
type KeysOfType<Target, Type> = { 
    [Key in Keys<Target>]: Key extends Type ? Key : never
}[Keys<Target>]

type iBuilder<T extends Record<string, any> > = {
    [key in KeysOfType<T, string> as `set${Capitalize<key>}`]: (value: T[key]) => iBuilder<T>
} & { build: () => T }

class BuilderError extends Error {}

function uncaptalize(str: string) { return str[0].toLowerCase() + str.substring(1) }

export default function Builder<T extends Class, I = InstanceType<T>>(clazz: T = Object as any): iBuilder<I> {
    const $builder = Object.create(Builder.prototype)
    $builder.memberHandler = Object.create(clazz.prototype)
    const handler: ProxyHandler<any> = {}

    handler.get = (_builder, key, proxed) => {

        if (typeof key != 'string') throw new BuilderError(`Invalid key type to access member. \n\t Type: ${typeof key} \n\t Key: ${String(key)}`)
        
        if (key === 'build') return () => Reflection.clone(_builder.memberHandler)
        
        if (key.startsWith('set')) return (value: any) => {
            const propName = uncaptalize( key.substring(3) )
            _builder.memberHandler[propName] = value
            return proxed
        }
        
        throw new BuilderError(`Your key isn't of a Builder member: ${key}`)
    }

    handler.defineProperty = () => { throw new BuilderError(`You can't define a Builder Property`) }
    handler.deleteProperty = () => { throw new BuilderError(`You can't delete a Builder member`) }
    handler.getOwnPropertyDescriptor = () => null
    // handler.getPrototypeOf = () => { throw new BuilderError(`You can't get the Prototype of a Builder`) }
    handler.has = () => false
    handler.isExtensible = () => false
    handler.ownKeys = () => []
    handler.preventExtensions = () => { throw new BuilderError(`You can't prevent a Builder to be extended`) }
    handler.set = () => { throw new BuilderError(`You can't set a Builder member`) }
    handler.setPrototypeOf = () => { throw new BuilderError(`You can't set the Prototype of a Builder`) }

    return new Proxy( $builder, handler ) as any
}

/** Returns if {@link obj} is a Builder */
Builder.is = (obj: Object) => obj instanceof Builder

// interface iDodge {
//     properti: number
//     nome: string
//     funcao: () => void
// }

// const build = Builder<Class, iDodge>()
//                 .setFuncao(() => console.log('chamando funcao'))
//                 .setNome('Nome setado')
//                 .setProperti(12)
//                 .build()

// class Car {
//     propCar = 1
//     prop = '123'
// }


// const builder = Builder(Car)
//                     .setProp('Prop setada')
//                     .setPropCar(123456)

// console.log(builder.build())
// console.log(builder)
// console.log(builder instanceof Builder)
// console.log(Builder.is(builder))