import { BigIntType } from './integers'

export interface Ring<ElementType, BIT extends BigIntType> {
    equal(a: ElementType, b: ElementType): boolean

    add(a: ElementType, b: ElementType): ElementType
    subtract(a: ElementType, b: ElementType): ElementType
    negate(a: ElementType): ElementType
    multiply(a: ElementType, b: ElementType): ElementType
    exponentiate(base: ElementType, power: BIT): ElementType

    readonly zero: ElementType
    readonly one: ElementType
    fromBytes(bytes: Uint8Array): ElementType
    fromNumber(n: number | string | BIT): ElementType
    randomElement(): ElementType
    newElement(): ElementType
}

export interface Field<ElementType, BIT extends BigIntType> extends Ring<ElementType, BIT> {
    invert(a: ElementType): ElementType
    divide(a: ElementType, b: ElementType): ElementType
    readonly characteristic: BIT
    readonly indexOverPrimeField: BIT
}

export function isField<ElementType, BIT extends BigIntType>(r: Ring<ElementType, BIT>): r is Field<ElementType, BIT> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return typeof (r as any).invert !== 'undefined'
}
