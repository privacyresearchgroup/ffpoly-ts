/* eslint-disable @typescript-eslint/no-explicit-any */
export interface BigIntType {
    toString(radix?: number): string
}

export interface Integers<BIT extends BigIntType> {
    BigInt(n: number | string): BIT
    add(a: BIT, b: BIT): BIT
    subtract(a: BIT, b: BIT): BIT
    multiply(a: BIT, b: BIT): BIT
    divide(a: BIT, b: BIT): BIT
    exponentiate(a: BIT, b: BIT): BIT
    remainder(n: BIT, mod: BIT): BIT
    unaryMinus(a: BIT): BIT

    bitwiseAnd(a: BIT, b: BIT): BIT
    bitwiseOr(a: BIT, b: BIT): BIT
    bitwiseNot(a: BIT): BIT
    bitwiseXor(a: BIT, b: BIT): BIT

    signedRightShift(a: BIT, b: BIT): BIT
    leftShift(a: BIT, b: BIT): BIT

    greaterThan(a: BIT, b: BIT): boolean
    greaterThanOrEqual(a: BIT, b: BIT): boolean
    lessThan(a: BIT, b: BIT): boolean
    lessThanOrEqual(a: BIT, b: BIT): boolean
    equal(a: BIT, b: BIT): boolean
    notEqual(a: BIT, b: BIT): boolean
    GT(a: any, b: any): boolean
    GE(a: any, b: any): boolean
    LT(a: any, b: any): boolean
    LE(a: any, b: any): boolean
    EQ(a: any, b: any): boolean
    NE(a: any, b: any): boolean

    toNumber(a: BIT): number
    asIntN(numBits: number, a: BIT): BIT
    asUintN(numBits: number, a: BIT): BIT
}
export interface ExtendedIntegers<BIT extends BigIntType> extends Integers<BIT> {
    xgcd(a: BIT, b: BIT): { gcd: BIT; x: BIT; y: BIT }
    powerMod(base: BIT, power: BIT, modulus: BIT): BIT
}

export function extendIntegers<BIT extends BigIntType>(Ints: Integers<BIT>): ExtendedIntegers<BIT> {
    const {
        BigInt,
        add,
        subtract,
        multiply,
        divide,
        exponentiate,
        remainder,
        unaryMinus,
        bitwiseAnd,
        bitwiseOr,
        bitwiseNot,
        bitwiseXor,
        signedRightShift,
        leftShift,
        greaterThan,
        greaterThanOrEqual,
        lessThan,
        lessThanOrEqual,
        equal,
        notEqual,
        GT,
        GE,
        LT,
        LE,
        EQ,
        NE,
        toNumber,
        asIntN,
        asUintN,
    } = Ints
    return {
        BigInt,
        add,
        subtract,
        multiply,
        divide,
        exponentiate,
        remainder,
        unaryMinus,
        bitwiseAnd,
        bitwiseOr,
        bitwiseNot,
        bitwiseXor,
        signedRightShift,
        leftShift,
        greaterThan,
        greaterThanOrEqual,
        lessThan,
        lessThanOrEqual,
        equal,
        notEqual,
        GT,
        GE,
        LT,
        LE,
        EQ,
        NE,
        toNumber,
        asIntN,
        asUintN,
        xgcd: (a: BIT, b: BIT) => xgcd(Ints, a, b),
        powerMod: (base: BIT, power: BIT, modulus: BIT) => powerMod(Ints, base, power, modulus),
    }
}

function xgcd<BIT extends BigIntType>(Ints: Integers<BIT>, a: BIT, b: BIT): { gcd: BIT; x: BIT; y: BIT } {
    let t: BIT
    let q: BIT
    let r: BIT
    let x = Ints.BigInt(0)
    let lastx = Ints.BigInt(1)
    let y = Ints.BigInt(1)
    let lasty = Ints.BigInt(0)

    while (Ints.NE(b, 0)) {
        q = Ints.divide(a, b) // a / b
        r = Ints.subtract(a, Ints.multiply(q, b)) // a - q * b

        t = x
        x = Ints.subtract(lastx, Ints.multiply(q, x)) // lastx - q * x
        lastx = t

        t = y
        y = Ints.subtract(lasty, Ints.multiply(q, y)) // lasty - q * y
        lasty = t

        a = b
        b = r
    }

    return Ints.lessThan(a, Ints.BigInt(0))
        ? { gcd: Ints.unaryMinus(a), x: Ints.unaryMinus(lastx), y: Ints.unaryMinus(lasty) }
        : { gcd: a, x: a ? lastx : Ints.BigInt(0), y: lasty }
}

function powerMod<BIT extends BigIntType>(Ints: Integers<BIT>, base: BIT, power: BIT, modulus: BIT): BIT {
    const zero = Ints.BigInt(0)
    const two = Ints.BigInt(2)

    let result = Ints.BigInt(1)
    let pow = power
    let b = base

    // console.log(`powerMod(${base.toString()}, ${power}, ${modulus.toString()})`)
    while (Ints.greaterThan(pow, zero)) {
        // for cases where exponent
        // is not an even value
        if (Ints.notEqual(Ints.remainder(pow, two), zero)) {
            result = Ints.remainder(Ints.multiply(result, b), modulus) // (r * b) % this.modulus
        }

        // base = (base * base) % N?
        b = Ints.remainder(Ints.multiply(b, b), modulus) // (b * b) % this.modulus
        pow = Ints.divide(pow, two)
    }
    return result
}
