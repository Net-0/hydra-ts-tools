import { Class, Equals } from "../../types"
import Reflection, { Key } from "../Reflection"
import ClazzBuilder from "./ClazzBuilder"
import ClazzMutator from "./ClazzMutator"


type Super<T extends Object, S extends Object> = 
    Equals<S, unknown> extends true
        ? T extends Function
            ? Function & Record<Key, any>
            : Record<Key, any>
        : S


/** A util to manipulate class */
export default class Clazz {

    /** Returns the class of {@link obj} */
    static of(obj: Object): Class { return Object.getPrototypeOf(obj).constructor }

    /** Define the class of {@link obj} */
    static def(obj: Object, clazz: Class) {
        if (obj instanceof Function) throw new Error("Can't define the class of a function, if you wana define the parent of a class, use Prototype.defParent")
        Object.setPrototypeOf(obj, clazz.prototype)
    }

    /** Returns the parent class of {@link clazz} */
    static parent(clazz: Class): Class { return Object.getPrototypeOf(clazz) }

    /** Define the parent class of {@link clazz} */
    static defParent(clazz: Class, parent: Class) { Object.setPrototypeOf(clazz, parent) }

    /** Sugar builder to create a Prototype/Class */
    static builder() { return new ClazzBuilder() }

    /** Sugar mutator to modify a class Prototype */
    static mutator<T extends Class>(clazz: T, clone = false) { return new ClazzMutator(clazz, clone) }
    
    /** Returns a Cloned Class */
    static clone<T extends Class>(clazz: T): T {
        function Constructor() {
            const obj = Reflect.construct(clazz, arguments) //new clazz(...arguments)
            Object.setPrototypeOf(obj, Constructor.prototype)
            return obj
        }

        const clone = Constructor as any as Class

        // Bind the descriptors of original class
        const clazzDescs = Object.getOwnPropertyDescriptors(clazz)
        delete clazzDescs.prototype
        Object.defineProperties(clone, clazzDescs)
        clone.prototype = Object.create(clazz.prototype)
        
        // Bind the parent of original class
        Clazz.defParent(clone, Clazz.parent(clazz))
        
        return clone as any
    }

    /** Returns a cloned object of {@link obj} but with this parent class */
    static super<S = unknown, T extends S = S>(obj: T): Super<T, S> {
        if (obj instanceof Function) {
            // Super of Class
            const parentClazz = Clazz.parent(obj as any)
            const cloned = Clazz.clone(parentClazz)

            Reflection
                .descriptors(obj)
                .filter(([,desc]) => !(desc.value instanceof Function))
                .forEach(([key,desc]) => Reflection.defDescriptor(cloned, key, desc))

            return cloned as any
        } else {
            // Super of Class Instance
            const clazz = Clazz.of(obj)
            const parentClazz = Clazz.parent(clazz)
            const $super = {...obj}
            Clazz.def($super, parentClazz)
            return $super as any
        }
    }

}

// class Car {

//     static sFunc = () => 'Func de Car'

//     static _sProp = 'Propriedade de Car'
//     static get sProp() { return this._sProp }

//     static get sJose() { return 'Jose de Car' }

//     static sMet() { return 'Retornando de Car' }
    


//     func = () => 'Func de Car'

//     _prop = 'Propriedade de Car'
//     get prop() { return this._prop }

//     get jose() { return 'Jose de Car' }
    
//     met() { return 'Retornando de Car' }
// }
// class Dodge extends Car {

//     static sFunc = () => 'Func de Dodge'
//     static sFunc2 = () => 'Func 2 de Dodge'

//     static _sProp = 'Propriedade de Dodge'
//     static get sProp() { return this._sProp }

//     static get sJose() { return 'Jose de Dodge' }

//     static sMet() {
//         super.sFunc() // Todas as funções são do parent
//         super['func2'] // Não pega nada da class
//         super._sProp // Propriedade vem do parent
//         super.sJose // Getter vem do super
//         super.sProp // Getter vem do super usando a propriedade da classe

//         return 'Retornando de Dodge'
//     }


    
//     func = () => 'Func de Dodge'
    
//     _prop = 'Propriedade de Dodge'
//     get prop() { return this._prop }

//     get jose() { return 'Jose de Dodge' }
    
//     met() {
//         super.func // Super não tem nem as propriedades de super e nem do filho
//         return 'Retornando de Dodge' 
//     }
// }

// new Dodge().met()

// Prototype.parent( Prototype.clone(Dodge) )

// Dodge.sMet()
// console.time('SC')
// const sSuper = Prototype.super<typeof Car>(Dodge)
// console.timeEnd('SC')
// const _super = Prototype.super<Car>(new Dodge())

// sSuper.sFunc()
// sSuper.sJose
// sSuper.sMet()
// sSuper.sProp
// sSuper._sProp

// console.time('P')
// Prototype.super<Car>(new Dodge())
// console.timeEnd('P')

