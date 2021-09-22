import { BigIntType } from '.'
import { Field } from './algebra-types'
import { onePolynomial, Polynomial, zeroPolynomial } from './polynomial'

export function lagrange<E, BIT extends BigIntType, F extends Field<E, BIT>>(
    xs: E[],
    ys: E[],
    field: F
): Polynomial<E, BIT> {
    if (xs.length !== ys.length) {
        throw new Error('Must have same number of x and y values to interpolate a polynomial.')
    }
    if (xs.length === 0) {
        throw new Error('must have at least one (x,y) pair to create interpolating polynomial')
    }

    let result = zeroPolynomial<E, BIT>(field)
    for (let i = 0; i < xs.length; ++i) {
        result = result.add(lagrangeInterpolant<E, BIT, F>(xs, i, field).scalarMultiply(ys[i]))
    }

    return result
}

function lagrangeInterpolant<E, BIT extends BigIntType, F extends Field<E, BIT>>(
    xs: E[],
    i: number,
    field: F
): Polynomial<E, BIT> {
    const xi = xs[i]
    let num = onePolynomial<E, BIT>(field)
    let denom = field.one
    for (let j = 0; j < xs.length; ++j) {
        if (j === i) {
            continue
        }
        const xj = xs[j]
        const negxj = field.negate(xj)
        const numFactor = new Polynomial<E, BIT>(field, [negxj, field.one])
        const denomFactor = field.add(xi, negxj)

        if (field.equal(denomFactor, field.zero)) {
            throw new Error(`Invalid input. Values xs[${i}] and xs[${j}] are equal. Cannot interpolate.`)
        }

        num = num.multiply(numFactor)
        denom = field.multiply(denom, denomFactor)
    }

    const denominv = field.invert(denom)
    return num.scalarMultiply(denominv)
}
