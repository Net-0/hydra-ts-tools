import { AnyFunc, Class, StringExtractEnd, StringKeys, UnifyTuple } from "../../types"
import { ProxyDescriptor } from "../../utils/Descriptors"
import { Key } from "../../utils/Reflection"

type Sender<KS extends string> = { [K in KS as `send${Capitalize<K>}`]: AnyFunc }

type MediatorClass<KS extends string[] = []> = Class<Sender< UnifyTuple<KS> >>

type MediatorKeys<C extends Class> = 
    InstanceType<C> extends infer I
        ? StringExtractEnd< StringKeys<I>, 'send' >
        : never

type Handler<C extends Class, K extends Key> = Record<K, InstanceType<C> | Set< InstanceType<C> > >

export type MediatorSenderClass<C extends Class, K extends Key> = Class< Sender<MediatorKeys<C>> & Handler<C, K> >

type Receiver<KS extends string> = { [K in KS as `receive${Capitalize<K>}`]: AnyFunc }

export type MediatorReceiverClass<C extends Class, K extends Key> = Class< Receiver<MediatorKeys<C>> & Handler<C, K> >




function capitalize(str: string) {
    return str.length > 1 ? str[0].toUpperCase() + str.substring(1) : str.toUpperCase()
}

class MediatorError extends Error {}

/** Store 'Receivers' of a Mediator Instance */
const MEDIATOR_RECEIVERS = new WeakMap<any, Set<any>>()

/** Store the 'Keys' to intermediate of a Mediator Class */
const MEDIATOR_KEYS = new WeakMap<Class, string[]>()

export default function Mediator<KS extends string[]>(...keys: KS) {
    return function<MC extends MediatorClass<KS>>(clazz: MC) {

        // Define the sender methods
        for(const key of keys) {
            clazz.prototype[`send${capitalize(key)}`] = function(...args) {
                MEDIATOR_RECEIVERS.get(this).forEach(receiver => receiver[`receive${capitalize(key)}`](...args))
            }
        }
        
        // Proxy to delete undefined members of sender methods and create the Set<any> of Receivers
        const handler: ProxyHandler<MC> = {
            construct(_clazz, args, proxed: any) {
                const obj = new _clazz(...args)
                MEDIATOR_RECEIVERS.set(obj, new Set())
                for (let key of MEDIATOR_KEYS.get(proxed)) delete obj[`send${capitalize(key)}`]
                return obj as any
            }
        }

        const proxed = new Proxy(clazz, handler)
        MEDIATOR_KEYS.set(proxed, keys) // Setted based on proxed because this will be the 'exposed class'
        return proxed
    }
}

/** Validate if a class is a Mediator Class */
Mediator.isClass = (clazz: Class) => MEDIATOR_KEYS.has(clazz)

/** Validate if a object is a Mediator instance */
Mediator.isInstance = (obj: Object) => MEDIATOR_RECEIVERS.has(obj)




/** Default Set of Sender's Mediator */
function defaultSetSenderMediator(_new: any) {
    if (typeof _new != 'object') throw new MediatorError(`New Value cannot be a Mediator Instance`)

    if (_new instanceof Set) {
        MEDIATORS_OF_RECEIVERS.set(this, _new)
    } else {
        if (_new && !Mediator.isInstance(_new)) throw new MediatorError(`New Value isn't a Mediator Instance: ${_new}`)
        MEDIATORS_OF_RECEIVERS.set(this, _new)
    }

    const old = MEDIATORS_OF_RECEIVERS.get(this)

    if (old instanceof Set) old.clear()
    else MEDIATOR_RECEIVERS.get(_new).add(this)
}

/** Store 'Mediators' of a Sender Instance */
const MEDIATORS_OF_SENDERS = new WeakMap<any, any | Set<any>>()

/** Define the Proxy (Getter/Setter) to a Mediator member of a Receiver and do the configuration */
function defineSenderMediatorProxy(target: any, mediatorKey: any, mediatorPossibleValue?: any) {
    const oldDesc = Reflect.getOwnPropertyDescriptor(target, mediatorKey)
    let newDesc: ProxyDescriptor< Object | Set<Object> > = { configurable: false, enumerable: false }
    
    if ('get' in oldDesc || 'set' in oldDesc) {
        newDesc.get = oldDesc.get
        newDesc.set = function(_new) {
            defaultSetSenderMediator.call(this, _new)
            oldDesc.set.call(this, _new)
        }
    }
    else if ('value' in oldDesc) {
        newDesc.get = function() { return MEDIATORS_OF_SENDERS.get(this) }
        newDesc.set = defaultSetSenderMediator
    }
    else throw new MediatorError(`Unknown Descriptor Type: ${oldDesc}`)


    const mediator = oldDesc.value ?? mediatorPossibleValue

    if (mediator instanceof Set) {
        MEDIATORS_OF_SENDERS.set(target, mediator)
    } else {
        if (mediator && !Mediator.isInstance(mediator)) throw new MediatorError(`Start Receiver's Mediator Value isn't a Mediator Instance: ${mediator}`)
        MEDIATORS_OF_SENDERS.set(target, mediator)
    }

    Reflect.defineProperty(target, mediatorKey, newDesc)
}

Mediator.Sender = <C extends Class, K extends Key = 'mediator'>(mediatorClazz: C, mediatorKey: K = 'mediator' as any) => {
    return function<MSC extends MediatorSenderClass<C, K>>(clazz: MSC) {
        
        const keys = MEDIATOR_KEYS.get(mediatorClazz)
        if (!keys) throw new MediatorError(`${mediatorClazz.name} isn't a Mediator Class`)

        // Define the sender methods
        for(let key of keys) {
            let sendKey = `send${capitalize(key)}`
            clazz.prototype[sendKey] = function(...args) {
                const mediator = this[mediatorKey]
                if (!mediator) return

                mediator instanceof Set
                    ? mediator.forEach(m => m[sendKey](...args))
                    : mediator[sendKey](...args)
            }
        }

        if (mediatorKey in clazz.prototype) defineSenderMediatorProxy(clazz.prototype, mediatorKey)
        
        // Proxy to delete undefined members of sender methods
        const handler: ProxyHandler<MSC> = {
            construct(_clazz, args) {
                const obj = new _clazz(...args) as any

                for (let key of MEDIATOR_KEYS.get(mediatorClazz)) delete obj[`send${capitalize(key)}`]
                const clazzMediator = MEDIATORS_OF_SENDERS.get(_clazz.prototype)
                if (mediatorKey in obj) defineSenderMediatorProxy(obj, mediatorKey, clazzMediator)
                
                return obj as any
            }
        }

        return new Proxy(clazz, handler)
    }
}







class ReceiverMediatorsSet implements Set<any> {
    readonly #WRAPPED: Set<any>
    readonly #RECEIVER: any

    readonly #MEDIATORS_TO_CLEAR = new Set()
    
    constructor(receiver: any, set: Set<any>) {
        this.#RECEIVER = receiver
        this.#WRAPPED = new Set()
        set.forEach(e => this.add(e))
    }

    add(mediator: any): this {
        if (!Mediator.isInstance(mediator)) throw new MediatorError(`This value isn't a Mediator Instance: ${mediator}`)
        
        this.#WRAPPED.add(mediator)
        MEDIATOR_RECEIVERS.get(mediator).add(this.#RECEIVER)
        this.#MEDIATORS_TO_CLEAR.add(mediator)
        return this
    }
    
    clear(): void {
        this.#MEDIATORS_TO_CLEAR.forEach(mediator => MEDIATOR_RECEIVERS.get(mediator).delete(this.#RECEIVER))
        this.#WRAPPED.clear()
        this.#MEDIATORS_TO_CLEAR.clear()
    }

    delete(mediator: any): boolean {
        return this.#WRAPPED.delete(mediator) && MEDIATOR_RECEIVERS.get(mediator).delete(this.#RECEIVER) && this.#MEDIATORS_TO_CLEAR.delete(mediator)
    }
    
    forEach(callback: (value: any, value2: any, set: Set<any>) => void, thisArg?: any): void { this.#WRAPPED.forEach(callback, thisArg) }

    has(value: any): boolean { return this.#WRAPPED.has(value) }

    get size() { return this.#WRAPPED.size }

    entries(): IterableIterator<[any, any]> { return this.#WRAPPED.entries() }

    keys(): IterableIterator<any> { return this.#WRAPPED.keys() }
    
    values(): IterableIterator<any> { return this.#WRAPPED.values() }
    
    [Symbol.iterator](): IterableIterator<any> { return this.#WRAPPED[Symbol.iterator]() }
    
    get [Symbol.toStringTag]() { return this.#WRAPPED[Symbol.toStringTag] }

}



/** Store the 'Mediators Instances' of a Receiver */
const MEDIATORS_OF_RECEIVERS = new WeakMap<Object, Object | Set<Object>>

/** Default Set of Receiver's Mediator */
function defaultSetReceiverMediator(_new: any) {
    if (typeof _new != 'object') throw new MediatorError(`New Value cannot be a Mediator Instance`)

    if (_new instanceof Set) {
        MEDIATORS_OF_RECEIVERS.set(this, new ReceiverMediatorsSet(this, _new))
    } else {
        if (_new && !Mediator.isInstance(_new)) throw new MediatorError(`New Value isn't a Mediator Instance: ${_new}`)
        MEDIATORS_OF_RECEIVERS.set(this, _new)
    }

    const old = MEDIATORS_OF_RECEIVERS.get(this)
    if (old instanceof Set) old.clear()
    else MEDIATOR_RECEIVERS.get(_new).add(this)
}

/** Define the Proxy (Getter/Setter) to a Mediator member of a Receiver and do the configuration */
function defineReceiverMediatorProxy(target: any, mediatorKey: any, mediatorPossibleValue?: any) {
    const oldDesc = Reflect.getOwnPropertyDescriptor(target, mediatorKey)
    let newDesc: ProxyDescriptor< Object | Set<Object> > = { configurable: false, enumerable: false }
    
    if ('get' in oldDesc || 'set' in oldDesc) {
        newDesc.get = oldDesc.get
        newDesc.set = function(_new) {
            defaultSetReceiverMediator.call(this, _new)
            oldDesc.set.call(this, _new)
        }
    }
    else if ('value' in oldDesc) {
        newDesc.get = function() { return MEDIATORS_OF_RECEIVERS.get(this) }
        newDesc.set = defaultSetReceiverMediator
    }
    else throw new MediatorError(`Unknown Descriptor Type: ${oldDesc}`)


    const mediator = oldDesc.value ?? mediatorPossibleValue

    if (mediator instanceof Set) {
        MEDIATORS_OF_RECEIVERS.set(target, new ReceiverMediatorsSet(target, mediator))
    } else {
        if (mediator && !Mediator.isInstance(mediator)) throw new MediatorError(`Start Receiver's Mediator Value isn't a Mediator Instance: ${mediator}`)
        MEDIATORS_OF_RECEIVERS.set(target, mediator)
    }

    Reflect.defineProperty(target, mediatorKey, newDesc)
}

Mediator.Receiver = <C extends Class, K extends Key = 'mediator'>(mediatorClazz: C, mediatorKey: K = 'mediator' as any) => {
    return function<MRC extends MediatorReceiverClass<C, K>>(clazz: MRC) {

        if (mediatorKey in clazz.prototype) defineReceiverMediatorProxy(clazz.prototype, mediatorKey)
        
        // Proxy to delete undefined members of sender methods
        const handler: ProxyHandler<MRC> = {
            construct(_clazz, args) {
                const obj = new _clazz(...args) as any

                for (let key of MEDIATOR_KEYS.get(mediatorClazz)) delete obj[`send${capitalize(key)}`]

                const clazzMediator = MEDIATORS_OF_RECEIVERS.get(_clazz.prototype)
                if (mediatorKey in obj) defineReceiverMediatorProxy(obj, mediatorKey, clazzMediator)

                return obj as any
            }
        }

        return new Proxy(clazz, handler)
    }
}

















// #receivers: Set< any >
// addReceiver(receiver: Object) { this.#receivers.add(receiver) }
// removeReceiver(receiver: Object) { this.#receivers.delete(receiver) }
// @Mediator('message')
// class ChatMediator {
//     sendMessage: (msg: string) => void
// }

// const consoleReceiver = {} as any
// consoleReceiver.receiveMessage = (msg) => console.log(`ConsoleReceiver received message: ${msg}`)

// const mediator = new ChatMediator()
// MEDIATOR_RECEIVERS.get(mediator).add(consoleReceiver)
// mediator.sendMessage('aaaaaa')






// @Mediator.Sender(ChatMediator)
// class KeyboardSingle {
//     mediator = new ChatMediator()
//     sendMessage: (msg: string) => void
// }

// const consoleReceiver = {} as any
// consoleReceiver.receiveMessage = (msg) => console.log(`ConsoleReceiver received message: ${msg}`)

// const singleSender = new KeyboardSingle()
// MEDIATOR_RECEIVERS.get(singleSender.mediator).add(consoleReceiver)
// singleSender.sendMessage('aaaaaa')


// @Mediator.Sender(ChatMediator)
// class KeyboardMulti {
//     mediator = new Set<ChatMediator>()//new Set([ new ChatMediator(), new ChatMediator() ])
//     sendMessage: (msg: string) => void
// }

// const consoleReceiver1 = {} as any
// consoleReceiver1.receiveMessage = (msg) => console.log(`ConsoleReceiver1 received message: ${msg}`)
// const consoleReceiver2 = {} as any
// consoleReceiver2.receiveMessage = (msg) => console.log(`ConsoleReceiver2 received message: ${msg}`)

// const multiSender = new KeyboardMulti()
// const [ m1, m2 ] = multiSender.mediator.values()
// MEDIATOR_RECEIVERS.get(m1).add(consoleReceiver1)
// MEDIATOR_RECEIVERS.get(m2).add(consoleReceiver2)
// multiSender.sendMessage('aaaaaa')




// @Mediator.Receiver(ChatMediator, 'chatMediator')
// class ChatSingle {
//     chatMediator = new ChatMediator() // Mediator where it will receive messages
//     receiveMessage(msg: string) { console.log(`Chat Received Message: ${msg}`) }
// }

// const receiver = new ChatSingle()
// const sender = new KeyboardSingle()

// receiver.chatMediator = sender.mediator
// sender.sendMessage('amoeba')


// @Mediator.Receiver(ChatMediator, 'chatMediator')
// class ChatMulti {
//     chatMediator = new Set([ new ChatMediator(), new ChatMediator() ]) // Mediator where it will receive messages
//     receiveMessage(msg: string) { console.log(`Chat Received Message: ${msg}`) }
// }

// const receiver = new ChatMulti()
// const sender1 = new KeyboardSingle()
// const sender2 = new KeyboardSingle()

// receiver.chatMediator.add(sender1.mediator).add(sender2.mediator)

// sender1.sendMessage('Message 1')
// sender2.sendMessage('Message 2')