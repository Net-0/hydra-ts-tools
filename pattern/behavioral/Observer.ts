export type Callback = (...args) => void

/** 
 * This class represents a generic multi-function implementation of Observer Design Pattern 
 * @Observation generict `T` should be a Function with void return
 */
export default class Observer<T extends Callback = Callback> {
    private readonly subscribers = new Set<T>
    private readonly thisArg: any

    constructor (thisArg?: any) {
        this.thisArg = thisArg
    }

    /** Subscribe {@link callback} to be called. Obs.: A callback just can be subscribed once */
    on(callback: T) {
        this.subscribers.add(callback)
        return this
    }
    
    /** Unsubscribe {@link callback} of be called and return if {@link callback} was subscribed */
    off(callback: T) { return this.subscribers.delete(callback) }

    /** Call subscibed callbacks */
    call(...args: Parameters<T>) { this.subscribers.forEach(callback => callback.call(this.thisArg, ...args)) }

}