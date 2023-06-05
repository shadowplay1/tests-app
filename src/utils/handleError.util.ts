/**
 * Executes the callback function with handling all the errors.
 * @param callback Callback function to execute.
 * @returns Callback function execution result.
 */
export async function handleError<
    Out,
    T extends () => Out | Promise<Out> = () => Out | Promise<Out>
>(
    callback: T
): Promise<IErrorHandledFunctionOutput<Out>> {
    try {
        const result = callback()

        if (result instanceof Promise) {
            try {
                const awaitedResult = await result

                return {
                    error: null as any,
                    result: awaitedResult
                }
            } catch (err: any) {
                return {
                    error: err as Error,
                    result: null as any
                }
            }

        }

        return {
            error: null as any,
            result
        }
    } catch (err: any) {
        return {
            error: err as Error,
            result: null as any
        }
    }
}

export interface IErrorHandledFunctionOutput<T> {
    error: Error
    result: T
}
