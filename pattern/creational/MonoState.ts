import { Class } from "../../types"

type SimpleClass = new() => any
const INSTANCES = new WeakMap<Class, any>()

/** Returns a MonoState Class of {@link clazz} */
export default function MonoState<T extends SimpleClass>(clazz: T) {
    const construct = () => {
        if (!INSTANCES.has(clazz)) 
            INSTANCES.set(clazz, new clazz())

        return new Proxy(INSTANCES.get(clazz), {})
    }

    return new Proxy(clazz, { construct })
}


/** Returns if {@link clazz} is a MonoState Class */
MonoState.is = <T extends SimpleClass> (clazz: T) => INSTANCES.has(clazz)

// const ab = null as ClassDecorator


// @MonoState
// class Car {
//     propCar = 1
// }

// class Car2 {
//     constructor(public propCar: number) {}
// }

// // const Car$$MonoState = MonoState(Car)

// const obj = new Car()
// const proxedObj = new Car()

// console.log(obj == proxedObj)
// console.log('obj Prop', obj.propCar)
// console.log('proxed Prop', proxedObj.propCar)
// proxedObj.propCar = 3
// console.log('obj Prop', obj.propCar)
// console.log('proxed Prop', proxedObj.propCar)