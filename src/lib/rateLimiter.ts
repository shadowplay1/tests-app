export const defaultIPObject = {
    rateLimited: false,
    retryTimestamp: 0,
    requests: []
}

export class RateLimiter {

    /**
     * Rate limits storage object.
     */
    private _rateLimits: IRateLimitsStorage

    constructor() {
        this._rateLimits = {}
    }

    /**
     * Adds the specified route to the rate limiting system.
     * @param options Route options.
     */
    public addRoute({
        allowedRequestsAmount, rateLimitInterval,
        timeInterval, path
    }: IStoredIPOptions): IRouteRateLimit {
        this._rateLimits[path] = {
            allowedRequestsAmount,
            rateLimitInterval,
            timeInterval,
            storedIPs: {}
        }

        return this._rateLimits[path]
    }

    /**
     * Gets the route rate limit info object.
     * @param route The route to get rate limit info for.
     * @returns Route rate limit info object.
     */
    public getRouteRateLimit(route: string): IRouteRateLimit {
        return this._rateLimits[route]
    }

    /**
     * Gets the specified IP address fro, the storage for specified route.
     * @param ip The IP to get.
     * @param route The route to get.
     * @returns Stored IP object.
     */
    public getStoredIP(ip: string, route: string): IStoredIP {
        const routeRateLimit = this.getRouteRateLimit(route)
        return routeRateLimit?.storedIPs?.[ip] || null
    }

    /**
     * Adds the specified IP address to the storage for specified route.
     * @param ip The IP to add.
     * @param route The route to add.
     * @returns Stored IP object.
     */
    public addStoredIP(ip: string, route: string): IStoredIP {
        const storedIP = this.getStoredIP(ip, route)

        if (!storedIP) {
            this._rateLimits[route].storedIPs[ip] = defaultIPObject
        }

        return storedIP || defaultIPObject
    }

    /**
     * Edits the specified IP address in the storage for specified route.
     * @param ip The IP to add.
     * @param route The route to add.
     * @param ipDataOptions The properties to change.
     * @returns Edited IP object.
     */
    public editStoredIP(ip: string, route: string, ipDataOptions: Partial<IStoredIP>): IStoredIP {
        let storedIP = this.getStoredIP(ip, route) || this.addStoredIP(ip, route)

        storedIP = {
            ...storedIP,
            ...ipDataOptions
        }

        this._rateLimits[route].storedIPs[ip] = storedIP
        return storedIP
    }

    /**
     * Check if specified IP address is rate limited for specified route.
     * @param ip The IP address to check.
     * @param route The route to check.
     * @returns Whether the IP address is rate limited for specified route.
     */
    public isRateLimited(ip: string, route: string): boolean {
        const storedIP = this.getStoredIP(ip, route)
        return storedIP.rateLimited
    }

    /**
     * Adds the request for specified IP address and route.
     * @param ip The IP address to add the requests for.
     * @param route The route to add the requests for.
     * @returns New requests array for specified IP address and route.
     */
    public addRequest(ip: string, route: string): IAPIRequest[] {
        const storedIP = this.getStoredIP(ip, route) || this.addStoredIP(ip, route)

        storedIP.requests.push({
            timestamp: Date.now()
        })

        const newStoredIP = this.editStoredIP(ip, route, {
            requests: storedIP.requests
        })

        return newStoredIP.requests
    }

    /**
     * Rate limit the specified IP address from making requests to the specified route.
     * @param ip The IP address to rate limit.
     * @param route The route to rate limit for.
     */
    public setRateLimit(ip: string, route: string): IStoredIP {
        const routeRateLimit = this.getRouteRateLimit(route)
        const storedIP = this.getStoredIP(ip, route)

        if (!storedIP.rateLimited) {
            const newStoredIP = this.editStoredIP(ip, route, {
                rateLimited: true,
                retryTimestamp: Date.now() + routeRateLimit.rateLimitInterval
            })

            return newStoredIP
        }

        return storedIP
    }

    /**
     * Clear the rate limit restrictions for the specified IP address
     * from making requests to the specified route.
     *
     * @param ip The IP address to clear the rate limit restrictions from.
     * @param route The route to clear the rate limit restrictions for.
     */
    public clearRateLimit(ip: string, route: string): IStoredIP {
        const newStoredIP = this.editStoredIP(ip, route, {
            rateLimited: false,
            requests: [],
            retryTimestamp: 0
        })

        return newStoredIP
    }

    /**
     * Gets the rate limits storage object.
     * @returns Rate limits storage object.
     */
    public getStorage(): IRateLimitsStorage {
        return this._rateLimits
    }
}


export interface IRateLimitsStorage {
    [route: string]: IRouteRateLimit
}

export type IRouteRateLimit = Omit<IStoredIPOptions, 'path'> & {

    /**
     * Stored IP addresses object.
     */
    storedIPs: {
        [ip: string]: IStoredIP
    }
}

export interface IStoredIP {

    /**
     * Whether the IP address is rate limited.
     */
    rateLimited: boolean

    /**
     * Amount of requests from the IP address.
     */
    requests: IAPIRequest[]

    /**
     * Timestamp when the user will no longer be rate limited.
     */
    retryTimestamp: number
}

export interface IAPIRequest {

    /**
     * Request timestamp (in milliseconds).
     */
    timestamp: number
}

export interface IStoredIPOptions {

    /**
     * Route path the rate limit will be created for.
     */
    path: string

    /**
     * Period of time for which requests can be made (in milliseconds).
     */
    timeInterval: number

    /**
     * Allowed amount of requests in allowed period of time.
     */
    allowedRequestsAmount: number

    /**
     * Period of time for which the user cannot make requests if the rate limit was exceeded
     * (in milliseconds).
     */
    rateLimitInterval: number
}
