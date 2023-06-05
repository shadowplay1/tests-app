import { NextApiResponse } from 'next'

import { statusCodes } from './misc/constants'
import { If } from './misc/utilityTypes'

/**
 * Sends a JSON responce with specified responce parameters.
 * @param options JSON sending options.
 */
export function sendJSON<T extends object = Record<never, never>>(options: IJSONSendingOptions<T>): void {
    if (!options.statusCode) {
        options.statusCode = 200
    }

    const isRequestErrored = options.statusCode >= 400
    const fallbackRequestMessage = !isRequestErrored ? 'ok' : 'not ok'

    const statusCodeText = (statusCodes as any)[options.statusCode]

    const bodyToSend: IResponceBody<T> = {
        code: options.statusCode,
        status: !isRequestErrored,

        message: options.message ?
            `${statusCodeText}: ${options.message}` :
            `${statusCodeText}.` || fallbackRequestMessage,
        data: options.body
    }

    return options.res.status(options.statusCode).json(bodyToSend)
}

/**
 * Parses a JSON string with handling parsing errors.
 * @param jsonString JSON string to parseю
 * @returns Parsing result.
 */
export function parseJSON<T>(jsonString: string): IJSONParsed<T> {
    if (jsonString == 'null' || jsonString == '{}' || jsonString == '') {
        return {
            status: true,
            errored: false,
            empty: true,
            jsonString,
            data: null
        }
    }

    if (typeof jsonString == 'object') {
        if (!Object.keys(jsonString as object).length) {
            return {
                status: true,
                errored: false,
                empty: true,
                jsonString,
                data: null
            }
        }

        return {
            status: true,
            errored: false,
            empty: false,
            jsonString,
            data: jsonString
        }
    }

    try {
        const data = JSON.parse(jsonString)

        for (const key in data) {
            try {
                // getting literal number and boolean values
                (data as any)[key] = JSON.parse((data as any)[key])
            } catch {
                // if parsing failed, then the value is string
                (data as any)[key] = (data as any)[key]
            }
        }

        return {
            status: true,
            errored: false,
            empty: false,
            jsonString,
            data
        }
    } catch (err) {
        return {
            status: false,
            errored: true,
            empty: false,
            jsonString,
            data: null
        }
    }
}


export interface IJSONSendingOptions<T extends object> {

    /**
     * Request body to send.
     */
    body: T

    /**
     * Next.js API Responce object.
     */
    res: NextApiResponse

    /**
     * HTTP status code to send.
     */
    statusCode: keyof typeof statusCodes

    /**
     * String message that will tell the request result.
     */
    message?: string

    /**
     * Array of headers to send in responce.
     */
    headers?: IResponceHeader
}

export interface IJSONParsed<T, TNonNull extends boolean = false> {

    /**
     * Whether the JSON string parsing was successful.
     */
    status: boolean

    /**
     * Whether the JSON string parsing failed.
     */
    errored: boolean

    /**
     * Whether the result is empty. **This will be 'false' if the parsing is failed.**
     */
    empty: boolean

    /**
     * The input JSON string.
     */
    jsonString: string

    /**
     * The object parsed from JSON string.
     */
    data: If<TNonNull, T, T | null>
}

export interface IResponceHeader {
    name: string
    value: string
}

export interface IResponceBody<T extends object> {

    /**
     * Whether the request was successful.
     */
    status: boolean

    /**
     * HTTP status code of the request.
     */
    code: keyof typeof statusCodes

    /**
     * String message that will tell the request result.
     */
    message?: string

    /**
     * Responce data if provided.
     */
    data: T
}
