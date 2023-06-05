import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'

import { IResponceBody } from '@/lib/json'

import { UserRole } from '@/lib/classes/User'
import { IUserLoginPayload } from '@/types/payload.interface'


const Authenticated = ({ requiredRole, children }: {
    requiredRole: UserRole
    children: React.ReactNode
}): JSX.Element => {
    const router = useRouter()

    const [isLoginChecked, setIsLoginChecked] = useState<boolean>(false)
    const isVerifyingStarted = useRef<boolean>(false)

    const redirectToLogin = (locationPathname: string, authCheckFailed?: boolean, requiredRole?: UserRole): any => {
        const query: { redirectTo?: string, authCheckFailed?: boolean, requiredRole?: UserRole } = {
            redirectTo: `${locationPathname}${location.search}`
        }

        if (authCheckFailed) {
            query.authCheckFailed = authCheckFailed
        }

        if (requiredRole) {
            query.requiredRole = requiredRole
        }

        router.push({
            pathname: '/login',
            query
        })
    }

    const verifyLogin = async (): Promise<void> => {
        const rawLocationPathname = location.pathname

        const locationPathname = rawLocationPathname.startsWith('/')
            ? rawLocationPathname
            : '/' + rawLocationPathname

        const accessToken = localStorage.getItem('accessToken')

        if (!accessToken || accessToken == 'null' || accessToken == 'undefined') {
            return redirectToLogin(locationPathname)
        }

        const authResponce = await fetch(`/api/v1/auth/verify?token=${accessToken}`)

        if (!authResponce.ok) {
            return redirectToLogin(locationPathname, true)
        }

        const authResult: IResponceBody<{
            verified: boolean
            payload: IUserLoginPayload
        }> = await authResponce.json()

        if (!authResult.data.verified) {
            redirectToLogin(locationPathname)
        } else {
            const userPayload = authResult.data.payload

            if (requiredRole !== undefined && userPayload.role < requiredRole) {
                redirectToLogin(locationPathname, false, requiredRole)
            }
        }

        setIsLoginChecked(true)
    }

    useEffect(() => {
        if (!isVerifyingStarted.current) {
            isVerifyingStarted.current = true
            verifyLogin()
        }
    }, [router, requiredRole])

    return (
        <>
            {isLoginChecked && children}
        </>
    )
}

export default Authenticated
