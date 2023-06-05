import { CSSProperties } from 'react'
import { FontAwesomeIcon } from '@/lib/misc/utilityTypes'

export interface ILink {
    name: string
    href: string
    icon: FontAwesomeIcon
    className?: string
    style?: CSSProperties
}
