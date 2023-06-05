import { NextPage } from 'next'
import { useRouter } from 'next/router'

import { useEffect } from 'react'
import nProgress from 'nprogress'

const Page: NextPage = () => {
    const router = useRouter()

    useEffect(() => {
        nProgress.start()

        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        localStorage.removeItem('wasNoticeDisplayed')

        nProgress.done()

        router.push({
            pathname: '/login'
        })
    })

    return <></>
}

export default Page
