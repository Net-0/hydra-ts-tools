import { WrapperBuilder, _WrapperBuilder_ } from "./WrapperBuilder"
import { WrapperMutator } from "./WrapperMutator"


export const WRAPPER_WRAPPEDS = new WeakMap()

export default class Wrapper {

    /** This object contains all methods relationed to create a new Wrapper object */
    static builder<T extends Object>(target: T): WrapperBuilder<T> { return new _WrapperBuilder_(target) as any }

    /** This object contains all methods relationed to mutate a object to be a Wrapper */
    static mutate<T extends Object>(target: T) { return new WrapperMutator(target) }

    /** Get the Wrapped of Wrapper {@link wrapper} */
    static get<T extends Object>(wrapper: T) { return WRAPPER_WRAPPEDS.get(wrapper) }

    /** Set the {@link wrapped} as the Wrapped to {@link wrapper} */
    static set<T extends Object>(wrapper: T, wrapped: T) { WRAPPER_WRAPPEDS.set(wrapper, wrapped) }

    /** Returns if {@link obj} is a Wrapper */
    static is(obj: Object) { return WRAPPER_WRAPPEDS.has(obj) }
}
