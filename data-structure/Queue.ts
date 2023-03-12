export default interface Queue<T> {
    
    /** Number of items in the queue */
    // @ts-ignore
    readonly size: number

}


/** Queue is a data-structure of the FIFO concept (First In First Out) */
export default class Queue<T> {

    private arr: T[] = []

    // @ts-ignore
    get size() { return this.arr.length }

    constructor(...elements: T[]) { this.arr = elements }

    /** Add {@link elements} in the end of Queue */
    enqueue(...elements: T[]) { this.arr.push(...elements) }

    /** Returns and take out the first element of Queue */
    dequeue(): T | undefined { return this.arr.shift() }

    /** Returns the first element of Queue */
    peek(): T | undefined { return this.arr[0] }

    /** Returns if the Queue hasn't elements */
    isEmpty(): boolean { return this.arr.length == 0 }

    /** Clear all elements of the Queue */
    clear() { this.arr = [] }

}

// const stack = new Stack({}, {})
// console.time('ArrStack')
// for (let i = 0; i < (10000*100); i++) stack.push({})
// stack.size
// // arrStack.clear()
// // console.log('ArrStack Len: ' + arrStack.size)
// console.timeEnd('ArrStack')

// const arr = [{}, {}]
// console.time('Array')
// for (let i = 0; i < (10000*100); i++) arr.push({})
// // for (let i = 0; i < (10000*100); i++) arr.pop()
// // console.log('Array Len: ' + arr.length)
// console.timeEnd('Array')

// stack.push('Element 2')
// stack.push('Element 3')
// stack.push('Element 4')
// stack.push('Element 5')
// stack.push('Element 6')

// console.log('Peek', stack.peek())

// while (!stack.isEmpty()) {
//     console.log(stack.pop())
// }