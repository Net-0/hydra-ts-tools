
type ElementClass = new(...args) => HTMLElement

export default function Element(tag: string, extend?: string) {
    return function(clazz: ElementClass) {
        customElements.define(tag, clazz, { extends: extend })
    }
}

// @Element('car', 'div')
// class Car extends HTMLDivElement {}