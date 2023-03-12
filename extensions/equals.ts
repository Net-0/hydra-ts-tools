interface Object {
    equals(obj: this): boolean
}

Object.prototype.equals = function(obj) {
    return this == obj
}


interface Array<T> {
    equals(obj: this): boolean
}

Array.prototype.equals = function(obj) {
    if (!(obj instanceof Array)) return false
    if (obj.length != this.length) return false
    if (obj == this) return true

    for (let i = 0; i < this.length; i++) {
        const e1 = this[i]
        const e2 = obj[i]
        if (!(e1?.equals?.(e2) ?? e1 == e2)) return false
    }
    return true
}