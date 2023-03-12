interface Stack<T> {

    /** Number of Stack elements */
    // @ts-ignore
    readonly size: number

}

/** Stack is a data-structure of the LIFO concept (Last In First Out) */
class Stack<T> {

    private arr: T[] = []

    // @ts-ignore
    get size() { return this.arr.length }

    constructor(...elements: T[]) { this.arr = elements }

    /** Adds {@link elements} sequently in the top of the Stack and returns the new Stack size */
    push(...elements: T[]) { return this.arr.push(...elements) }

    /** Return and take out the element in the top of the Stack */
    pop(): T | undefined { return this.arr.pop() }

    /** Return the element in the top of the Stack */
    peek(): T | undefined { return this.arr[this.arr.length - 1] }

    /** Return if the Stack as some element */
    isEmpty(): boolean { return this.arr.length == 0 }

    /** Remove all elements in the Stack */
    clear() { this.arr = [] }

}

export default Stack

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