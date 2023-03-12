import { AnyFunc } from "../types";

export type Descriptor<T = any> = {
    enumerable: boolean
    configurable: boolean
    writable?: boolean
    value?: T
    get?: () => T
    set?: (value: T) => void
}

export class PropertyDescriptor<T = any> {
    constructor(
        public configurable: boolean,
        public enumerable: boolean,
        public value?: T,
        public writable?: boolean
    ) {}
}

export class MethodDescriptor<T extends AnyFunc = (...args) => unknown> {
    writable = false;
    constructor(
        public configurable: boolean,
        public enumerable: boolean,
        public func: T
    ) {}
}

export class ProxyDescriptor<T = any> {
    constructor(
        public configurable: boolean,
        public enumerable: boolean,
        public get?: () => T,
        public set?: (value: T) => void
    ) {}
}