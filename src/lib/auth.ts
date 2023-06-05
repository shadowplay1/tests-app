import jwt from 'jsonwebtoken'
import { IUserLoginPayload } from '../types/payload.interface'

/**
 * Generates the access token for specified user payload.
 * @param payload User payload to encode.
 * @param rememberMe If true, the access token will never expire.
 * @returns Generated access token.
 */
export function generateToken(payload: IUserLoginPayload, rememberMe: boolean): string {
    return jwt.sign(
        payload, process.env.PAYLOAD_SECRET as string,
        rememberMe ? undefined : {
            expiresIn: '4h'
        })
}

/**
 * Decodes the access token and returns the encoded user payload.
 * @param token Token to check.
 * @returns Decoded user payload.
 */
export function verifyToken(token: string): IUserLoginPayload {
    return jwt.verify(token, process.env.PAYLOAD_SECRET as string) as any
}
