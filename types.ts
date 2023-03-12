import { Key } from "./utils/Reflection"



type ClassLike = new(...args) => {}
type ClassCP<ARGS extends any[], PA extends ClassLike> = 
    Equals<ARGS, []> extends true 
        ? ConstructorParameters<PA>
        : ARGS

/** This sugar utility type represents the Class of {@link INS}, constructor arguments {@link ARGS}, static members {@link STA} and parent class {@link PA} */
export type Class<INS = {}, ARGS extends any[] = [], STA extends {} = {}, PA extends ClassLike = ClassLike > = 
        ClassCP<ARGS, PA> extends infer CP extends any[]
            ? IntersectedObject<INS, ClassMembers<PA>> extends infer IM // Trick to 'join' instance members with parent instance members
                    ? IntersectedObject<STA, ClassStaticMembers<PA>> extends infer SM // Trick to 'join' static members with parent static members
                        ? Equals<SM, {}> extends false // Trick just to don't pollute the result type
                            ? (new(...args: CP) => IM) & SM
                            : (new(...args: CP) => IM)
                    : never
                : never
            : never



/** Util type to take a object of static members of a class or class with intersection of object that contains the static members */
export type ClassStaticMembers<T extends Class> = 
    Intersected<T> extends infer Target
        ? { [K in Exclude<Keys<Target>, 'prototype'> ]: Target[K] }
        : never

/** Util type to take a object of members of a class */
export type ClassMembers<C extends Class> = 
        C extends new(...args) => infer I
            ? { [_K in Keys<I>]: I[_K] }
            : never




/** Sugar utility type that represents the keys of {@link Target} */
export type Keys<Target> = keyof Target

/** Sugar utility type that represents the string keys of {@link Target} */
export type StringKeys<Target> = { [K in Keys<Target>]: K extends string ? K : never }[Keys<Target>]

/** Sugar utility type that represents the symbol keys of {@link Target} */
export type SymbolKeys<Target> = { [K in Keys<Target>]: K extends symbol ? K : never }[Keys<Target>]

/** Sugar utility type that represents the number keys of {@link Target} */
export type NumberKeys<Target> = { [K in Keys<Target>]: K extends number ? K : never }[Keys<Target>]




/** Sugar utility type that take all values of properties of {@link Target} */
export type Values<Target> = Target[Keys<Target>]

/** Return a interface with all properties of {@link T} with type of {@link K} */
export type OmogeneousParams<T extends Record<any, any>, K> = Record<keyof T, K>

/** This type represents a Any Function, most generic than {@link Function} type */
export type AnyFunc<THIS = any> = (this: THIS, ...args) => any

/** This type represents a function like {@link Func} but with return type of {@link Return} */
export type FunctionReturn<Func extends AnyFunc, Return> = (...args: Parameters<Func>) => Return

/** This type represents a function like {@link Func} but with parameters as the type tuple {@link Args}  */
export type FunctionParameters<Func extends AnyFunc, Args extends any[]> = (...args: Args) => ReturnType<Func>

export type FunctionThis<Func extends AnyFunc, THIS> = 
    OmitThisParameter<Func> extends infer Omitted
        ? Omitted extends AnyFunc
            ? (this: THIS, ...args: Parameters<Omitted>) => ReturnType<Omitted>
            : never
        : never

/** Sugar type to represents a Join of two tuples at one */
export type TupleJoin<T extends any[], K extends any[]> = [...T, ...K]

/** Full class Join, joining members, constructor args and static members (including infered) */
export type ClassJoin< T extends Class<any>, K extends Class<any> > = 
    Class<
        IntersectedObject< InstanceType<T>, InstanceType<K> >,
        TupleJoin< ConstructorParameters<K>, ConstructorParameters<T> >,
        [ClassStaticMembers<T>, ClassStaticMembers<K>]
    >

export type ClassSetStatic<C extends Class<any>, K extends Key, V extends any> = 
    Class <
        InstanceType<C>,
        ConstructorParameters<C>,
        IntersectedObject< ClassStaticMembers<C>, { [P in K]: OmitThisParameter<V> } >
    >

export type ClassSet<C extends Class<any>, K extends Key, V extends any> = 
    Class<
        IntersectedObject<InstanceType<C>, { [P in K]: OmitThisParameter<V> }>, 
        ConstructorParameters<C>,
        [Intersected<C>]
    >

export type Constructor<C extends Class<any>> = (...args: ConstructorParameters<C>) => InstanceType<C>

export type ComumKeys<T, K> = Extract<Keys<T>, Keys<K>>

/** This util type build a Object like with Key {@link K} and Value Type {@link V}, assign correctly with {@link isOptional} and {@link isReadonly}  */
export type AssignProp<K extends Key, V, isOptional extends boolean, isReadonly extends boolean> =
    RemoveRepeatedFromUnion<V> extends infer FormatedValue
        ? isOptional extends true 
            ? isReadonly extends true
                ? { readonly[_K in K]?: FormatedValue }
                : { [_K in K]?: FormatedValue } 
            : isReadonly extends true
                ? { readonly[_K in K]: FormatedValue }
                : { [_K in K]: FormatedValue }
        : never

export type isOptionalAtOne<K extends Key, OBJ1, OBJ2> = 
    K extends OptionalKeys<OBJ1>
        ? true
        : K extends OptionalKeys<OBJ2>
            ? true
            : false

export type isReadonlyAtOne<K extends Key, OBJ1, OBJ2> = 
    K extends ReadonlyKeys<OBJ1>
        ? true
        : K extends ReadonlyKeys<OBJ2>
            ? true
            : false

/** This util type will intersect the prop with key {@link K} and create a Object Like with a prop with the signatures and types of {@link OBJ1} and {@link OBJ2} */
export type IntersectProp<OBJ1, OBJ2, K extends Keys<OBJ1> & Keys<OBJ2> > = 
    AssignProp<
        K, 
        TypeNormalizer<OBJ1[K], OBJ2[K]>,
        isOptionalAtOne<K, OBJ1, OBJ2>, 
        isReadonlyAtOne<K, OBJ1, OBJ2>
    >

/** This util type will intersect all comum props at {@link OBJ1} and {@link OBJ2} with all signatures and types */
export type IntersectComum<OBJ1, OBJ2> = UnionToIntersection<
    // @ts-ignore
    { [K in ComumKeys<OBJ1, OBJ2>]: IntersectProp<OBJ1, OBJ2, K> }[ComumKeys<OBJ1, OBJ2>]
>

/** This is a full version of {@link Intersected} but with intersection of signatures and types to a Object */
export type IntersectedObject<OBJ1, OBJ2> = 
    Intersected<
        Omit<OBJ1, Keys<OBJ2>> & Omit<OBJ2, Keys<OBJ1>> & IntersectComum<OBJ1, OBJ2>
    >

export type AllIntersectedObject<A extends any[]> = A extends [infer L, ...infer R] ? IntersectedObject<L, AllIntersectedObject<R>> : A[0]

/** This util type converts Intersection {@link T} to a a Object like */
export type Intersected<T> = T extends infer U ? { [K in keyof U]: U[K] } : never


type UnionToUnionOfZeroAryFunctionTypes<FiniteUnion> =
    FiniteUnion extends unknown
      ? () => FiniteUnion
      : never;

type UnionOfZeroAryFunctionsToIntersection<UnionOfZeroAryFunctions> = ( UnionOfZeroAryFunctions extends unknown
    ? (k: UnionOfZeroAryFunctions) => void
    : never
 ) extends((k: infer FunctionsIntersection) => void)
      ? FunctionsIntersection
      : never;

type GetSomeFiniteUnionComponentByDirtyTrick<FiniteUnion> =
    UnionOfZeroAryFunctionsToIntersection<UnionToUnionOfZeroAryFunctionTypes<FiniteUnion>> extends (() => (infer R))
        ? R
        : never;

export type TuplifyUnion<U> =
  GetSomeFiniteUnionComponentByDirtyTrick<U> extends infer Element
   ? ([U] extends [never]
       ? []
       : (TuplifyUnion<Exclude<U, Element>> extends infer RestTuple
           ? (RestTuple extends unknown[]
               ? [Element, ...RestTuple]
               : never)
           : never))
   : never;

export type TuplifyIntersection<T> = TuplifyUnion<UnionToIntersection<T>>

/** Hack util to convert a Union type to Intersection Type
 * @Observation (number | string) => (never) because a value cant be string and number
 * @example UnionToIntersection<{a: number} | {b: string}> => {a: number} & {b: string}
 */
export type UnionToIntersection<U> = (U extends any ? (k: U)=>void : never) extends ((k: infer I)=>void) ? I : never

/**
 * @Observação : never é frequentemente excluido de valor => string | never == string
 */ 

/** This util type take all Keys of {@link Target} that the value is typeof {@link Type} */
export type KeysFromType<Target extends object, Type> = { [Key in Keys<Target>]: Target[Key] extends Type ? Key : never }[Keys<Target>]

/** This util type take all Keys of {@link Target} that the value isn't typeof {@link Type} */
export type KeysNotFromType<Target extends object, Type> = { [Key in Keys<Target>]: Target[Key] extends Type ? never : Key }[Keys<Target>]

/** Return a Object like type that contains all properties of {@link T} that is typeof {@link K} */
export type PickOfType<T extends Record<any, any>, K> = Pick<T, KeysFromType<T, K>>

/** Return a Object like type that contains all properties of {@link T} that isn't typeof {@link K} */
export type OmitOfType<T extends object, K> = Pick<T, KeysNotFromType<T, K>>

/** Pick all keys of the {@link Target} that are of type {@link Type} */
export type KeysOfType<Target, Type> = { [Key in Keys<Target>]: Key extends Type ? Key : never }[Keys<Target>]

/** Pick all keys of the {@link Target} that are of type {@link Type} */
export type KeysNotOfType<Target, Type> = { [Key in Keys<Target>]: Key extends Type ? never : Key }[Keys<Target>]

/** This util type works for a deep comparison, including signatures */
export type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false

export type Negate<T extends boolean> = T extends true ? false : true

export type IsOptional<T> = undefined extends T ? true : null extends T ? true : false

/** Sugar type to get a Object like with just Key {@link K} */
type SingleProp<T, K extends Keys<T>> = { [_K in K]: T[K] }

/** Sugar type to get a Object like with just Key {@link K} as not readonly */
type SingleWritableProp<T, K extends Keys<T>> = { -readonly[_K in K]: T[K] }

export type OptionalKeys<T> = { [K in Keys<T>]-?: ({} extends { [P in K]: T[K] } ? K : never) }[Keys<T>]

export type RequiredKeys<T> = Exclude< Keys<T>, OptionalKeys<T> >
  
export type ReadonlyKeys<T> = {
    [P in Keys<T>]-?: Equals< SingleProp<T, P>, SingleWritableProp<T, P> > extends false ? P : never
}[Keys<T>]

export type WritableKeys<T> = Exclude< Keys<T>, ReadonlyKeys<T> >

export type PickRequired<T> = Pick<T, RequiredKeys<T>>

export type PickOptional<T> = Pick<T, OptionalKeys<T>>

export type PickReadonly<T> = Pick<T, ReadonlyKeys<T>>

export type PickWritable<T> = Pick<T, WritableKeys<T>>

export type Nullable<T> = T | undefined | null

export type AnyFuncOfUnion<T> = 
    TuplifyUnion<T> extends infer Tuple
        ? number extends Keys<Tuple>
            ? { [Key in Keys<Tuple>]: AnyFunc extends Tuple[Key] ? Tuple[Key] : never }[number]
            : never
        : never

export type MapUnionToFunctionThis<T, THIS> = 
    TuplifyUnion<T> extends infer Tuple
        ? number extends Keys<Tuple>
            ? { 
                [Key in Keys<Tuple>]: Tuple[Key] extends AnyFunc ? FunctionThis<Tuple[Key], THIS> : never
              }[number]
            : never
        : never

export type UnifyTuple<T extends any[]> = { [Key in Keys<T>]: T[Key] }[number]
export type RemoveRepeatedFromUnion<T> = UnifyTuple<TuplifyUnion<T>>





/**
 * Get the end of a string literal type based on start.
 * Ex.:
 * StringExtractEnd<'sendMessage', 'send'> => 'Message'
 * StringExtractEnd<'sendMessage', 'receiver'> => never
 */
export type StringExtractEnd<STR extends string, START extends string> = STR extends `${START}${infer R}` ? R : never







type TypeNormalizer<T, K> = 
    Equals<T, K> extends true
        ? T
        : T extends AnyFunc
            ? K extends AnyFunc
                ? FunctionNormalizer<T, K>
                : T | K
            : T | K

type FunctionNormalizer<T extends AnyFunc, K extends AnyFunc> = 
    SameParameters<T, K> extends true
        ? (...args: Parameters<T>) => TypeNormalizer<ReturnType<T>, ReturnType<K>>
        : T | K

type SameParameters<T extends AnyFunc, K extends AnyFunc> = Parameters<T> extends Parameters<K> ? true : false
