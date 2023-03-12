// Interface que tráz um método para criar um Memento, onde objetos devem estende-la
// Mementos são objetos que só podem permitir o accesso ao Snapshot à classe original ( obs: Symbols privados são uma boa )
// Mementos devem ter Nome, Data, etc... valores sobre o estado salvo
// Transformar o ChangeHistory em MementoHistory com um TransientMemento

import { Class } from "../../types";
import Reflection, { Key } from "../../utils/Reflection"

function UUID() {
    // Generate a random hexadecimal string
    const hex = '0123456789abcdef';
    let randomHex = '';
    for (let i = 0; i < 32; i++) randomHex += hex[Math.floor(Math.random() * 16)]

    // Use a random value from the range 8-11 for the high 4 bits of the clock_seq_hi_and_reserved field
    const high = hex[(Math.floor(Math.random() * 4) + 8)]

    return `${randomHex.slice(0, 8)}-${randomHex.slice(8, 12)}-4${randomHex.slice(13, 16)}-${high}${randomHex.slice(17, 20)}-${randomHex.slice(20)}`
}


class Originator {
    saveSnapshot: () => Snapshot<this>
    loadSnapshot: (snapshot: Snapshot<this>) => void
}

type OriginatorOfKeys<KS extends Key[]> = { [K in KS[number]]: any } & Originator

class Snapshot<T> {
    readonly date = new Date()
    constructor(readonly content: T, readonly name = UUID()) {}
}



function proxedClass(clazz: Class) {
    const handler: ProxyHandler<typeof Originator> = {}
    handler.construct = (_clazz: any, args) => {
        const obj = new _clazz(...args)
        delete obj.loadSnapshot
        delete obj.saveSnapshot
        return obj
    }
    return new Proxy(clazz, handler) as any
}

function defaultLoadSnapshot(snapshot) {
    Object.defineProperties(this, Object.getOwnPropertyDescriptors(snapshot.content))
}


export default function Memento(clazz: typeof Originator) {
    clazz.prototype.saveSnapshot = function () { return new Snapshot(Reflection.clone(this)) }
    clazz.prototype.loadSnapshot = defaultLoadSnapshot
    return proxedClass(clazz)
}

Memento.ofKeys = <KS extends Key[]>(...keys: KS) => (clazz: Class<OriginatorOfKeys<KS>>) => {
    clazz.prototype.saveSnapshot = function() {
        const clone = {}
        const descriptors = Reflection.descriptors(this).filter(([key]) => keys.includes(key))
        Reflection.defDescriptors(clone, ...descriptors)
        return new Snapshot(clone) as any
    }
    clazz.prototype.loadSnapshot = defaultLoadSnapshot
    return proxedClass(clazz)
}

Memento.ignoreKeys = (...keys: Key[]) => (clazz: typeof Originator) => {
    clazz.prototype.saveSnapshot = function() {
        const clone = {}
        const descriptors = Reflection.descriptors(this).filter(([key]) => !keys.includes(key))
        Reflection.defDescriptors(clone, ...descriptors)
        return new Snapshot(clone) as any
    }
    clazz.prototype.loadSnapshot = defaultLoadSnapshot
    return proxedClass(clazz)
}




// @Memento
// class Car implements Originator {
//     saveSnapshot: () => Snapshot<this>
//     loadSnapshot: (snapshot: Snapshot<this>) => void
//     prop1 = 1
//     prop2 = 'b'
//     prop3 = []
// }

// let car = new Car()
// let snap = car.saveSnapshot()
// car.prop1 = 2
// car.prop2 = 'c'
// car.prop3 = [1,2,3]
// car
// car.loadSnapshot(snap)
// car




// @Memento.ofKeys('prop1')
// class Car implements Originator {
//     saveSnapshot: () => Snapshot<this>
//     loadSnapshot: (snapshot: Snapshot<this>) => void
//     prop1 = 1
//     prop2 = 'b'
//     prop3 = []
// }

// let car = new Car()
// let snap = car.saveSnapshot()
// car.prop1 = 2
// car.prop2 = 'c'
// car.prop3 = [1,2,3]
// car
// car.loadSnapshot(snap)
// car




// @Memento.ignoreKeys('prop1')
// class Car implements Originator {
//     saveSnapshot: () => Snapshot<this>
//     loadSnapshot: (snapshot: Snapshot<this>) => void
//     prop1 = 1
//     prop2 = 'b'
//     prop3 = []
// }

// let car = new Car()
// let snap = car.saveSnapshot()
// car.prop1 = 2
// car.prop2 = 'c'
// car.prop3 = [1,2,3]
// car
// car.loadSnapshot(snap)
// car