/**
 * Replaces the first letter of input with upper-case letter.
 * @param input String input.
 * @returns Output with first letter replaced with upper-case letter.
 */
export function toStartUpperCase(input: string): string {
    return input?.[0]?.toUpperCase() + input?.slice(1)
}

/**
 * Replaces the first letter of input with lower-case letter.
 * @param input String input.
 * @returns Output with first letter replaced with lower-case letter.
 */
export function toStartLowerCase(input: string): string {
    return input?.[0]?.toLowerCase() + input?.slice(1)
}
