import { Class } from "../../types"

class FactoryError extends Error {}

const FACTORY_CLASSES = new WeakMap<Class, FactoryOriginClass[]>()

export default function Factory<A extends any[]>(...factoryClasses: FactoryOriginClass<A>[]) {
    return function <C extends Class<{}, A>>(clazz: C) {
        
        FACTORY_CLASSES.set(clazz, factoryClasses)

        const handler: ProxyHandler<C> = {}
        handler.construct = (_clazz, args) => {
            const _factoryClasses = FACTORY_CLASSES.get(_clazz)
            const validClass = _factoryClasses.find(fclazz => fclazz.validate(...args))

            if (!validClass) throw new FactoryError(`Cannot create a instance of ${clazz.name} with this arguments: ${args}`)

            return new validClass(...args)
        }

        return new Proxy(clazz, handler)
    }
}

type Validator<ARGS extends any[]> = { validate: (...args: ARGS) => boolean }
type FactoryOriginClass<ARGS extends any[] = any[]> = Class<{}, ARGS, Validator<ARGS>>







// const platform: string = 'browser'

// class HtmlButton implements Button {
//     static validate(param1: string, ...args) { return platform == 'browser' }
//     constructor (param1, param2) { }
//     click = () => 'Html Button Click'
// }


// class WindowsButton implements Button {
//     static validate(param1, param2) { return platform == 'desktop' }
//     constructor (param1, param2) { }
//     click = () => 'Windows Button Click'
// }

// @Factory(HtmlButton, WindowsButton)
// class Button {
//     constructor (param1: string, param2: number) {}
//     click: () => string
// }



// const button = new Button('a', 3)
// button.click()