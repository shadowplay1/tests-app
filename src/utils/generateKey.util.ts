export const symbols = 'q1dw3er2ty.u7io.p4a0s15df8g.h1jk9l6d8d9hz7x8v0.b9n6m0d612n3d45.67jukl89a0.qtry5io25u2f24nw'.split('')
export const letters = 'q1dw3er2tyu7iop4a0s15df8gh1jk9l6d8d9hz7x8v0b9n6m0d612n3d4567jukl89a0qtry5io25u2f24nw'.split('')

/**
 * Gets a random symbol from the symbols array.
 * @param generationOptions Generation options object.
 * @returns Random symbol from the symbols array.
 */
export function getRandomSymbol(generationOptions = {} as IGenerationOptions): string {
    let sequence = symbols

    if (generationOptions.useLetters) {
        sequence = letters
    }

    const randomSymbolIndex = Math.floor(Math.random() * sequence.length)
    return sequence[randomSymbolIndex]
}

/**
 * Creates a string of {length} random symbols from the symbols array.
 * @param length Length of the string to generate.
 * @param generationOptions Generation options object.
 * @returns Random symbols string.
 */
export function getRandomSymbols(length: number, generationOptions = {} as IGenerationOptions): string {
    let result = ''

    for (let i = 0; i < length; i++) {
        result += getRandomSymbol({
            useLetters: generationOptions.useLetters
        })
    }

    return result
}

/**
 * Generates a sequence of random letters.
 * @param length Length of the sequence.
 * @returns Generated sequence.
 */
export function generateSequence(length = 32, generationOptions = {} as IGenerationOptions): string {
    let key = ''

    for (let i = 0; i < length; i++) {
        key += getRandomSymbol({
            useLetters: generationOptions.useLetters
        })
    }

    if (key.endsWith('.')) {
        key = key.slice(0, -1) + getRandomSymbol({
            useLetters: generationOptions.useLetters
        })
    }

    if (key.includes('..')) key = key.replaceAll(
        '..', getRandomSymbols(2, {
            useLetters: generationOptions.useLetters
        })
    )

    return key
}

export interface IGenerationOptions {

    /**
     * If true, sequence of symbols without dots will be used.
     */
    useLetters?: boolean
}
