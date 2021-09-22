import { ZpField } from '..'
import { lagrange } from '../lagrange'
import { Polynomial } from '../polynomial'
import { makePolynomial, randomFieldElementArray } from './utils'

import JSBI from 'jsbi'

describe('test lagrange interpolation', () => {
    const z101 = new ZpField<JSBI>(JSBI, JSBI.BigInt(101))
    const z25519 = new ZpField<JSBI>(
        JSBI,
        JSBI.BigInt('57896044618658097711785492504343953926634992332820282019728792003956564819949')
    )

    const makeFieldElements = (zp: ZpField<JSBI>, ns: (number | string)[]) => {
        return ns.map((n) => zp.fromNumber(n))
    }

    const testSmallKnownPolys = (zp: ZpField<JSBI>) => {
        const xs = makeFieldElements(zp, [0, 1, 2])
        const ys = makeFieldElements(zp, [0, 1, 4])

        const poly = lagrange<JSBI, JSBI, ZpField<JSBI>>(xs, ys, zp)
        const expected = new Polynomial<JSBI, JSBI>(zp, makeFieldElements(zp, [0, 0, 1]))
        expect(poly.coeffs.length).toEqual(3)
        expect(poly.equals(expected)).toBe(true)
    }

    const testOverdetermined = (zp: ZpField<JSBI>) => {
        const xs = makeFieldElements(zp, [0, 1, 2, 3, 4])
        const ys = makeFieldElements(zp, [1, 2, 5, 10, 17])
        const poly = lagrange<JSBI, JSBI, ZpField<JSBI>>(xs, ys, zp)
        const expected = new Polynomial<JSBI, JSBI>(zp, makeFieldElements(zp, [1, 0, 1]))
        expect(poly.coeffs.length).toEqual(3)
        expect(poly.equals(expected)).toBe(true)
    }

    const testDegenerate = (zp: ZpField<JSBI>) => {
        const xs = makeFieldElements(zp, [0, 0, 2])
        const ys = makeFieldElements(zp, [0, 1, 2])

        expect(() => {
            const p = lagrange(xs, ys, zp)
            console.log(p.toString())
        }).toThrow(/^Invalid input.*$/)
    }

    test('interpolate known small examples', () => {
        for (const zp of [z25519, z101]) {
            testSmallKnownPolys(zp)
        }
    })
    test('interpolate with extra points', () => {
        for (const zp of [z25519, z101]) {
            testOverdetermined(zp)
        }
    })
    test('test degenerate input', () => {
        for (const zp of [z25519, z101]) {
            testDegenerate(zp)
        }
    })

    test('bad inputs', () => {
        expect(() => lagrange<JSBI, JSBI, ZpField<JSBI>>([], [], z25519)).toThrow(
            'must have at least one (x,y) pair to create interpolating polynomial'
        )
        const xs = makeFieldElements(z101, [0, 1, 2, 3, 4])
        const ys = makeFieldElements(z101, [1, 2, 5, 10, 17, 26])
        expect(() => lagrange(xs, ys, z101)).toThrow(
            'Must have same number of x and y values to interpolate a polynomial.'
        )
    })

    test('large random examples', () => {
        const randompolys: Polynomial<JSBI, JSBI>[] = []
        const numTrials = 10
        const degree = 20
        for (let i = 0; i < numTrials; ++i) {
            randompolys.push(new Polynomial(z25519, randomFieldElementArray(z25519, degree + 1)))
        }

        for (const poly of randompolys) {
            const xs = randomFieldElementArray(z25519, degree + 1)
            const ys = xs.map((x) => poly.eval(x))

            const interp = lagrange(xs, ys, z25519)
            expect(interp.equals(poly)).toEqual(true)
        }
    })

    test('readme snippets 7', () => {
        const p25519 = JSBI.BigInt('57896044618658097711785492504343953926634992332820282019728792003956564819949')
        const z25519 = new ZpField<JSBI>(JSBI, p25519)

        // make two arrays of FieldElements - one for the x values and one for the y values
        const xs = [0, 1, 2, 3, 4].map((n) => z25519.fromNumber(n))
        const ys = [1, 2, 5, 10, 17].map((n) => z25519.fromNumber(n))
        const poly = lagrange(xs, ys, z25519)

        // The interpolated polynomial is x^2 + 1
        const expected = makePolynomial(z25519, [1, 0, 1])
        expect(poly.equals(expected)).toBe(true)

        // we can also cycle through the x values and evaluate the polynomial at each
        for (let i = 0; i < xs.length; ++i) {
            const y = poly.eval(xs[i])
            expect(y.toString()).toEqual(ys[i].toString())
        }
    })
})
