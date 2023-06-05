import { NextApiRequest, NextApiResponse } from 'next'

import { verifyToken } from '../auth'
import { IJSONParsed, parseJSON, sendJSON } from '../json'

import { RateLimiter, IStoredIPOptions } from '../rateLimiter'

import { handleError } from '@/utils/handleError.util'
import { If } from '../misc/utilityTypes'

import { Cacher } from '../cacher'

import { API_URL, consoleColors, statusCodes } from '../misc/constants'
import { IUserLoginPayload } from '@/types/payload.interface'

import { Test } from '../classes/Test'
import { User, UserRole, userRoles } from '../classes/User'

const {
    yellow, lightGreen, red,
    lightCyan, lightRed, reset,
    green, lightBlue
} = consoleColors

export class RouteHandler<
    RequestBody extends object,
    IsAuthRequired extends boolean = false,
    RequestQuery extends object = Record<never, never>
> {

    /**
     * Route handler options object.
     */
    public options: IRouteHandlerOptions<RequestBody, IsAuthRequired, RequestQuery>

    /**
     * Rate limiter instance.
     */
    public rateLimiter = new RateLimiter()

    /**
     * Cache manager instance.
     */
    public cache = new Cacher<
        ['users', 'tests'],
        [User, Test]
    >(['users', 'tests'])

    /**
     * HTTP method that was used to make the request.
     */
    public requestMethod: HTTPVerbs = null as any

    /**
     * Parsing result of request body JSON.
     */
    public body: IJSONParsed<RequestBody, true> = null as any

    /**
     * Request query parameters.
     */
    public query: IJSONParsed<RequestQuery, true> = null as any

    /**
     * Decoded token payload from the `Authorization` header.
     */
    public authorization: If<IsAuthRequired, IUserLoginPayload, never> = null as any

    /**
     * Next.js API Request instance.
     */
    public req: NextApiRequest = null as any

    /**
     * Next.js API Responce instance.
     */
    public res: NextApiResponse<any> = null as any

    /**
     * IP address the request was made from.
     */
    public ip: string = null as any

    /**
     * Path to the API route that was requested.
     */
    public url: string = null as any

    /**
     * Request handler function.
     * @param auth Auth object if it's required.
     */
    async handle(): Promise<void> {
        sendJSON({
            res: this.res,
            statusCode: 503,
            message: 'This request was not implemented yet.',
            body: {}
        })
    }

    constructor(routeHandlerOptions: IRouteHandlerOptions<RequestBody, IsAuthRequired, RequestQuery>) {
        this.options = routeHandlerOptions
    }
}

export function createHandler<
    RequestBody extends object,
    IsAuthRequired extends boolean,
    RequestQuery extends object = Record<never, never>
>(
    handler: RouteHandler<RequestBody, IsAuthRequired, RequestQuery>,
): (req: NextApiRequest, res: NextApiResponse<any>) => Promise<any> {
    return async (req, res) => {
        const rateLimiter = handler.rateLimiter
        const rateLimitOptions = handler.options.rateLimit

        handler.requestMethod = req.method as HTTPVerbs

        handler.req = req
        handler.res = res

        handler.ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress)
            ?.replace('::ffff:', '')
            ?.replace('::1', '127.0.0.1') as string

        handler.url = req.url?.replace(API_URL, '') as string

        handler.body = parseJSON(req.body || '') as any as IJSONParsed<RequestBody, true>
        handler.query = parseJSON(JSON.stringify(req.query || '')) as any as IJSONParsed<RequestQuery, true>

        if (!handler.options.validateBodyProps) {
            handler.options.validateBodyProps = (() => {
                return null
            }) as any
        }

        if (!handler.options.validateQuery) {
            handler.options.validateQuery = (() => {
                return null
            }) as any
        }

        const bodyValidationResult = handler.options.validateBodyProps?.(handler.body.data || {})
        const queryValidationResult = handler.options.validateQuery?.(handler.query.data || {})

        if (bodyValidationResult?.failed) {
            sendRouteLog({
                method: req.method as string,
                ip: handler.ip,
                url: req.url as string,
                statusCode: 400
            })

            return sendJSON({
                res,

                statusCode: 400,
                message: bodyValidationResult.message,

                body: {
                    failedProperty: bodyValidationResult.failed
                }
            })
        }

        if (queryValidationResult?.failed) {
            sendRouteLog({
                method: req.method as string,
                ip: handler.ip,
                url: req.url as string,
                statusCode: 400
            })

            return sendJSON({
                res,

                statusCode: 400,
                message: queryValidationResult.message,

                body: {
                    failedProperty: queryValidationResult.failed
                }
            })
        }

        let routeRateLimit = rateLimiter.getRouteRateLimit(handler.url)
        let storedIP = rateLimiter.getStoredIP(handler.ip, handler.url)

        if (!routeRateLimit) {
            routeRateLimit = rateLimiter.addRoute({
                path: handler.url,
                ...rateLimitOptions
            })
        }

        if (!storedIP) {
            storedIP = rateLimiter.addStoredIP(handler.ip, handler.url)
        }

        const allowedTimeInterval = Date.now() - routeRateLimit.timeInterval
        const requests = storedIP.requests.filter(request => request.timestamp > allowedTimeInterval)

        if (storedIP.rateLimited && Date.now() >= storedIP.retryTimestamp) {
            rateLimiter.clearRateLimit(handler.ip, handler.url)
        }

        if (requests.length + 2 > rateLimitOptions.allowedRequestsAmount && !storedIP.rateLimited) {
            rateLimiter.setRateLimit(handler.ip, handler.url)
        }

        if (storedIP.rateLimited && Date.now() < storedIP.retryTimestamp) {
            const retryAfter = Math.floor((storedIP.retryTimestamp - Date.now()) / 1000) + 1

            res.setHeader('Retry-After', retryAfter)

            sendRouteLog({
                method: req.method as string,
                ip: handler.ip,
                url: req.url as string,
                statusCode: 429
            })

            return sendJSON({
                res,
                statusCode: 429,

                body: {
                    retryAfter
                }
            })
        }

        rateLimiter.addRequest(handler.ip, handler.url)

        try {
            const authToken = req.headers.authorization?.replace('Bearer ', '')

            const requiredBodyProperties = handler.options.requiredBodyProperties
            const requiredQueryProperties = handler.options.requiredQueryProperties

            const bodyData = handler.body.data
            const query = handler.query.data

            const possibleMethods = handler.options.methods

            if (!possibleMethods.includes(req.method as HTTPVerbs)) {
                let methodNotAllowedMessage = 'This method is not allowed. '

                if (possibleMethods.length == 1) {
                    methodNotAllowedMessage += `Only '${possibleMethods[0]}' method can be used for this request.`
                } else {
                    methodNotAllowedMessage +=
                        `Only '${possibleMethods.map(httpMethod => `'${httpMethod}'`).join(', ')}' ` +
                        'methods can be used for this request.'
                }

                sendRouteLog({
                    method: req.method as string,
                    ip: handler.ip,
                    url: req.url as string,
                    statusCode: 405
                })

                return sendJSON({
                    res,
                    statusCode: 405,
                    message: methodNotAllowedMessage,
                    body: {}
                })
            }

            if (handler.options.requiredQueryProperties.length) {
                if (Object.keys(query || {}).length) {
                    for (const requiredQueryProperty of requiredQueryProperties) {
                        if (query?.[requiredQueryProperty] == undefined) {
                            const paramWord = requiredQueryProperties.length == 1 ? 'parameter' : 'parameters'

                            sendRouteLog({
                                method: req.method as string,
                                ip: handler.ip,
                                url: req.url as string,
                                statusCode: 400
                            })

                            return sendJSON({
                                res,
                                statusCode: 400,
                                message: `${requiredQueryProperties.map(
                                    bodyProp => `'${bodyProp as string}'`
                                ).join(', ')} query ${paramWord} should be specified.`,

                                body: {
                                    specifiedParams: Object.keys(query || {})
                                }
                            })
                        }
                    }
                } else {
                    const paramWord = requiredQueryProperties.length == 1 ? 'parameter' : 'parameters'

                    sendRouteLog({
                        method: req.method as string,
                        ip: handler.ip,
                        url: req.url as string,
                        statusCode: 400
                    })

                    return sendJSON({
                        res,
                        statusCode: 400,
                        message: `${requiredQueryProperties.map(
                            bodyProp => `'${bodyProp as string}'`
                        ).join(', ')} query ${paramWord} should be specified.`,
                        body: {
                            specifiedParams: Object.keys(query || {})
                        }
                    })
                }
            }

            if (handler.body.empty && handler.options.requiredBodyProperties.length) {
                const propertyWord = requiredBodyProperties.length == 1 ? 'property' : 'properties'

                sendRouteLog({
                    method: req.method as string,
                    ip: handler.ip,
                    url: req.url as string,
                    statusCode: 400
                })

                return sendJSON({
                    res,
                    statusCode: 400,
                    message: `${requiredBodyProperties.map(
                        bodyProp => `'${bodyProp as string}'`
                    ).join(', ')} ${propertyWord} should be specified.`,
                    body: {
                        specifiedProps: Object.keys(bodyData || {})
                    }
                })
            }

            if (req.method == HTTPVerbs.GET && !handler.body.empty) {
                sendRouteLog({
                    method: req.method as string,
                    ip: handler.ip,
                    url: req.url as string,
                    statusCode: 406
                })

                return sendJSON({
                    res,
                    statusCode: 406,
                    message: 'GET method requests cannot have a body. Use query parameters instead.',
                    body: {}
                })
            }

            if (!handler.body.empty) {
                if (handler.body.errored) {
                    sendRouteLog({
                        method: req.method as string,
                        ip: handler.ip,
                        url: req.url as string,
                        statusCode: 400
                    })

                    return sendJSON({
                        res,
                        statusCode: 400,
                        message: 'Invalid request JSON was provided.',
                        body: {}
                    })
                }

                for (const requiredBodyProperty of requiredBodyProperties) {
                    if (bodyData?.[requiredBodyProperty] == undefined) {
                        const propertyWord = requiredBodyProperties.length == 1 ? 'property' : 'properties'

                        sendRouteLog({
                            method: req.method as string,
                            ip: handler.ip,
                            url: req.url as string,
                            statusCode: 400
                        })

                        return sendJSON({
                            res,
                            statusCode: 400,
                            message: `${requiredBodyProperties.map(
                                bodyProp => `'${bodyProp as string}'`
                            ).join(', ')} ${propertyWord} should be specified.`,
                            body: {
                                specifiedProps: Object.keys(bodyData || {})
                            }
                        })
                    }
                }
            }

            if (handler.options.requiresAuthorization) {
                const tokenVerifyingResult = await handleError<IUserLoginPayload>(
                    () => verifyToken(authToken as string)
                )

                const decodedPayload = tokenVerifyingResult.result

                if (!decodedPayload) {
                    sendRouteLog({
                        method: req.method as string,
                        ip: handler.ip,
                        url: req.url as string,
                        statusCode: 401
                    })

                    return sendJSON({
                        res,
                        statusCode: 401,
                        message: 'Access token is either invalid or not provided.',
                        body: {}
                    })
                }

                if (!decodedPayload.verified && handler.options.requiresVerification) {
                    sendRouteLog({
                        method: req.method as string,
                        ip: handler.ip,
                        url: req.url as string,
                        statusCode: 403
                    })

                    return sendJSON({
                        res,
                        statusCode: 403,
                        message: 'You must be verified to do this request.',
                        body: {
                            accountVerified: decodedPayload.verified,
                        }
                    })
                }

                if (decodedPayload.role < handler.options.requiredRole) {
                    sendRouteLog({
                        method: req.method as string,
                        ip: handler.ip,
                        url: req.url as string,
                        statusCode: 403
                    })

                    return sendJSON({
                        res,
                        statusCode: 403,
                        message: 'You don\'t have permissions to do this request. ' +
                            `Only ${userRoles[handler.options.requiredRole]} or above can do this request.`,
                        body: {
                            accountRole: userRoles[decodedPayload.role],
                            requiredRole: userRoles[handler.options.requiredRole]
                        }
                    })
                }

                handler.authorization = decodedPayload as any
            }

            await handler.handle()

            sendRouteLog({
                method: req.method as string,
                ip: handler.ip,
                url: req.url as string,
                statusCode: res.statusCode as keyof typeof statusCodes
            })
        } catch (err) {
            sendRouteLog({
                method: req.method as string,
                ip: handler.ip,
                url: req.url as string,
                statusCode: 500
            })

            console.error(err)

            return sendJSON({
                res,
                statusCode: 500,
                message: 'Something went wrong.',
                body: {}
            })
        }
    }
}

export function sendRouteLog({ method, url, statusCode, ip }: IRouteLogOptions): void {
    const statusColor = statusCode >= 500
        ? lightRed
        : statusCode >= 400 ? red : lightGreen

    console.log(
        `${lightBlue}[${ip}]${reset} - ${yellow}${method} ${green}${url}${reset} - ` +
        `${statusColor}${statusCode} ${(statusCodes as any)[statusCode]}${reset} - ` +
        `${lightCyan}${new Date().toLocaleString('en')}${reset}`
    )
}

export interface IRouteHandlerOptions<
    RequestBody extends object,
    IsAuthRequired extends boolean,
    RequestQuery extends object
> {

    /**
     * HTTP methods that could be used to make the request.
     */
    methods: HTTPVerbs[]

    /**
     * Request body properties that are required to be specified when making the request.
     */
    requiredBodyProperties: (keyof RequestBody)[]

    /**
     * Request query properties that are required to be specified when making the request.
     */
    requiredQueryProperties: (keyof RequestQuery)[]

    /**
     * Whether the authorization is required to complete the request.
     */
    requiresAuthorization: IsAuthRequired

    /**
     * This role or above can do the request.
     */
    requiresVerification: If<IsAuthRequired, boolean, false>

    /**
     * This role or above can do the request.
     */
    requiredRole: If<IsAuthRequired, UserRole, UserRole.USER>

    /**
     * Rate limiting configuration for the route.
     */
    rateLimit: Omit<IStoredIPOptions, 'path'>

    /**
     * Body props validation function.
     * @param props Body properties object.
     * @returns Error text if validation failed for at least one property.
     */
    validateBodyProps?(props: RequestBody): IPropsValidationError<RequestBody> | undefined

    /**
     * Query props validation function.
     * @param props Query properties object.
     * @returns Error text if validation failed for at least one property.
     */
    validateQuery?(props: Partial<RequestQuery>): IPropsValidationError<RequestQuery> | undefined
}

export interface IPropsValidationError<ValidationBody extends object> {

    /**
     * Message on what failed to validate (provided if validation was failed).
     */
    message: string

    /**
     * Exact property that failed the validation (provided if validation was failed).
     */
    failed: keyof ValidationBody | 'any'
}

export enum HTTPVerbs {
    GET = 'GET',
    HEAD = 'HEAD',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
    OPTIONS = 'OPTIONS',
    PATCH = 'PATCH'
}

export interface IRouteLogOptions {
    ip: string
    method: string
    url: string
    statusCode: keyof typeof statusCodes
}
