/* istanbul ignore file */
import JSBI from 'jsbi'
import { BigIntType, Integers, Ring, ZpField } from '..'
import { Polynomial } from '../polynomial'

export function fib<BIT extends BigIntType>(Ints: Integers<BIT>, n: number): BIT {
    if (n === 0 || n === 1) {
        return Ints.BigInt(1)
    }
    let fi = Ints.BigInt(1)
    let fim1 = Ints.BigInt(1)
    let temp = Ints.BigInt(0)
    for (let i = 2; i <= n; ++i) {
        temp = fi
        fi = Ints.add(fi, fim1)
        fim1 = temp
    }
    return fi
}
export function makePolynomial<BIT extends BigIntType>(
    zp: ZpField<BIT>,
    coeffs: number[] | string[],
    reverse = false
): Polynomial<BIT, BIT> {
    const ringCoeffs = (reverse ? coeffs.reverse() : coeffs).map((n) => zp.fromNumber(n))
    return new Polynomial(zp, ringCoeffs)
}
export function makeRandomJSBIArray(length: number, lb: number, ub: number): JSBI[] {
    const result: JSBI[] = []
    for (let i = 0; i < length; ++i) {
        result.push(JSBI.BigInt(lb + Math.floor(Math.random() * (ub - lb))))
    }
    return result
}

export function randomFieldElementArray<ScalarType, BIT extends BigIntType>(
    zp: Ring<ScalarType, BIT>,
    n: number
): ScalarType[] {
    const result: ScalarType[] = []
    for (let i = 0; i < n; ++i) {
        result.push(zp.randomElement())
    }

    return result
}
