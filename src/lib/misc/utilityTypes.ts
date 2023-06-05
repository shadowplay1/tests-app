export type If<T extends boolean,
    IfTrue,
    IfFalse = null
> = T extends true ? IfTrue : IfFalse

export type Optional<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>

export type Update<T, K extends keyof T, V> = {
    [D in keyof Pick<T, K>]: V
} & Omit<T, K>

export type TupleToObject<
    K extends readonly (string | number | symbol)[],
    V extends Record<any, any>
> = { [I in `${number}` & keyof K as K[I]]: V[I] }

export type TupleToMappedObject<
    K extends readonly (string | number | symbol)[],
    V extends Record<any, any>
> = { [I in `${number}` & keyof K as K[I]]: Map<string, V[I]> }

export type FontAwesomeIcon = `fas fa-${string}`
export type CSSVariable = `var(--${string})`

export type ServiceResult<
    T extends object
> = Record<'status' | 'internalError', boolean> & { reason?: string } & T

export type EmptyServiceResult = ServiceResult<Record<never, never>>
