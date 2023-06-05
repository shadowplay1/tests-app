import { TupleToMappedObject } from './misc/utilityTypes'

export class Cacher<
    CachedItemNames extends string[],
    CachedItemValues extends Record<any, any>
> {
    public items: TupleToMappedObject<CachedItemNames, CachedItemValues> = {} as any

    constructor(cachedItemNames: CachedItemNames) {
        for (const cachedItemName of cachedItemNames) {
            const items = this.items as any
            items[cachedItemName] = new Map<string, any>()
        }
    }
}
