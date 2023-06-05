export function validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email)
}

export function validateString(input: string, {
    minLength = 0, maxLength = Infinity,
    toIncludeCapitalLetters = false,
    toIncludeSpecialCharacters = false,
    toMatchPattern
}: IStringValidationOptions): boolean {
    if (input.length < minLength || input.length > maxLength) {
        return false
    }

    if (toIncludeCapitalLetters && !/[A-Z]/.test(input)) {
        return false
    }

    if (toIncludeSpecialCharacters && !/[!@#$%^&*(),.?":{}|<>]/.test(input)) {
        return false
    }

    if (toMatchPattern && !toMatchPattern.test(input)) {
        return false
    }

    return true
}

export interface IStringValidationOptions {
    minLength?: number
    maxLength?: number
    toIncludeCapitalLetters?: boolean
    toIncludeSpecialCharacters?: boolean
    toMatchPattern?: RegExp
}
