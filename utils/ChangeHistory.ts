import Observer from "../pattern/behavioral/Observer"
import Stack from '../data-structure/Stack'

export type ChangeCallback<T> = (change: T) => void

/** This class represents a Pattern of History of Changes, that control and have callbacks for thens */
export default class ChangeHistory<T> {

    private readonly done: Stack<T>
    private readonly undone: Stack<T>
    
    constructor(done: T[] = [], undone: T[] = []) {
        this.done = new Stack(...done)
        this.undone = new Stack(...undone)
    }

    /** Observers of `do` change */
    private readonly doObserver = new Observer<ChangeCallback<T>>()

    /** Subscribe {@link callback} to be called on `do` change */
    onDo(callback: ChangeCallback<T>) { this.doObserver.on(callback) }
    
    /** Unsubscribe {@link callback} of be called on `do` change */
    offDo(callback: ChangeCallback<T>) { this.doObserver.off(callback) }
    
    /** Will do the {@link change}, if the {@link change} wasn't informed, will try do last undone change */
    do(change?: T) {
        if (change) this.undone.clear()
        const toDo = change ?? this.undone.pop()
        if (!toDo) throw new Error('Havent any change to do')
        this.done.push(toDo)
        this.doObserver.call(toDo)
    }

    /** Observers of `undo` change */
    private readonly undoObserver = new Observer<ChangeCallback<T>>()
    
    /** Subscribe {@link callback} to be called on `undo` change */
    onUndo(callback: ChangeCallback<T>) { this.undoObserver.on(callback) }
    
    /** Unsubscribe {@link callback} of be called on `undo` change */
    offUndo(callback: ChangeCallback<T>) { this.undoObserver.off(callback) }
    
    /** Undo the last done change */
    undo() {
        const toUndo = this.done.pop()
        if (!toUndo) throw new Error('Havent any change to undo')
        this.undone.push(toUndo)
        this.undoObserver.call(toUndo)
    }

}