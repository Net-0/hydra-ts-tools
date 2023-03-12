import { Key } from "../Reflection"
import { IntersectedObject, ClassStaticMembers, AnyFunc, Equals, TupleJoin, Keys, AnyFuncOfUnion, FunctionThis, Class } from "../../types"




/** This util type create a object type as a `this` instance type */
type ProtoThis<IM extends {}, P extends Class, I extends {}> = IntersectedObject< IM & I, InstanceType<P> >

/** This util type create a object type as a `this` class/static type */
type ProtoStaticThis<SM extends {}, P extends Class> = IntersectedObject< SM, ClassStaticMembers<P> >

/** This util type create a object type as a `this` instance type to be used inside a constructor */
type ProtoConstructorThis<IM extends {}, P extends Class, I extends {}> = IntersectedObject< IM & I, InstanceType<P> >



/** This type represents a Static Method for Prototype Sugar Classes */
export type ProtoStaticMethod<SM extends {}, PA extends Class> = AnyFunc<ProtoStaticThis<SM, PA>>

/** This type represents a Constructor for Prototype Sugar Classes */
export type ProtoConstructor<IM extends {}, CP extends any[], P extends Class, I extends {}> = 
    Equals<CP, []> extends true
        ? (this: ProtoConstructorThis<IM, P, I>, ...args: TupleJoin< ConstructorParameters<P>, any[] > ) => void
        : never

/** This type represents a Method for Prototype Sugar Classes */
export type ProtoMethod<IM extends {}, P extends Class, I extends {}, K extends Key> =
    ProtoThis<IM, P, I> extends infer $THIS
        ? K extends Keys<$THIS>
            ? AnyFuncOfUnion<$THIS[K]> extends AnyFunc
                ? FunctionThis<AnyFuncOfUnion<$THIS[K]>, $THIS>
                : never
            : AnyFunc<$THIS>
        : never

/** This type represents a Getter for Prototype Sugar Classes */
export type ProtoGetter<IM extends {}, P extends Class, I extends {}, V> = (this: ProtoThis<IM, P, I>) => V

/** This type represents a Setter for Prototype Sugar Classes */
export type ProtoSetter<IM extends {}, P extends Class, I extends {}, V> = (this: ProtoThis<IM, P, I>, value: V) => void

/** This type represents a Static Getter for Prototype Sugar Classes */
export type ProtoStaticGetter<SM extends {}, P extends Class, V> = (this: ProtoStaticThis<SM, P>) => V

/** This type represents a Static Setter for Prototype Sugar Classes */
export type ProtoStaticSetter<SM extends {}, P extends Class, V> = (this: ProtoStaticThis<SM, P>, value: V) => void




/** Object type with a new function member */
export type AddFunc<T extends {}, K extends Key, F extends Function> = T & { [_K in K]: OmitThisParameter<F> }

/** Object type with a new property member */
export type AddProp<T extends {}, K extends Key, V, W extends boolean> = 
    W extends true
        ? { [_K in K]: V } & T
        : { readonly[_K in K]: V }  & T

/** Object type with a new proxy member */
export type AddProxy<T extends {}, K extends Key, V> = T & { [_K in K]: V }
