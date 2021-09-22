import { ZpField } from '../'
import {
    findLinearFactor,
    gcd,
    Polynomial,
    polynomialDivide,
    polynomialMod,
    powerMod,
    zeroPolynomial,
} from '../polynomial'
import { makePolynomial, randomFieldElementArray, fib } from './utils'

import JSBI from 'jsbi'

describe('Test polynomial arithmetic', () => {
    const p1 = JSBI.BigInt('57896044618658097711785492504343953926634992332820282019728792003956564819949')
    const p2 = JSBI.BigInt('289074500134862184880115710463760056022772626011660032416150488966685969359')
    const p3 = JSBI.BigInt('7')
    const p4 = JSBI.BigInt('10009')
    const p5 = JSBI.BigInt('92298539445058780156311400358427006136490327688468392976721825472309537485619')
    const p6 = JSBI.BigInt('12116229856662451686902408083335966638526782381623645260472148860630343973517')
    const ps = [p1, p2, p3, p4, p5, p6]
    const zps = ps.map((p) => new ZpField<JSBI>(JSBI, p))

    const testPolynomialsCoeffs: Record<string, number[]> = {
        x: [0, 1], // x
        x2p2xp1: [1, 2, 1], // x^2 + 2x + 1
        x2mxm1: [-1, -1, 1], // x^2-x-1
        zeta7: [1, 1, 1, 1, 1, 1], // 7th roots of unity
        x2m2: [2, 0, 1], // root 2
    }
    const testPolynomials: Record<string, Polynomial<JSBI, JSBI>[]> = {}
    const getTestPoly = (zp: ZpField<JSBI>, name: string): Polynomial<JSBI, JSBI> | undefined => {
        return testPolynomials[name].find((f) => f.baseRing === zp)
    }

    beforeAll(() => {
        for (const key of Object.keys(testPolynomialsCoeffs)) {
            const polysForFields = zps.map((zp) => makePolynomial(zp, testPolynomialsCoeffs[key]))
            testPolynomials[key] = polysForFields
        }
    })

    const testKnownPolynomialAddtion = (zp: ZpField<JSBI>) => {
        let p1 = makePolynomial(zp, [1, 2, 3])
        let p2 = makePolynomial(zp, [5, 0, 5, 7, 8])
        let expected = makePolynomial(zp, [6, 2, 8, 7, 8])

        let sum = p1.add(p2)
        expect(sum.equals(expected)).toBeTruthy()

        let numTests = 10
        const MAX_DEGREE = 20
        while (numTests-- > 0) {
            const d1 = Math.floor(Math.random() * MAX_DEGREE)
            const d2 = Math.floor(Math.random() * MAX_DEGREE)
            const d3 = Math.max(d1, d2)
            const coeffs1: JSBI[] = randomFieldElementArray<JSBI, JSBI>(zp, d1 + 1)
            const coeffs2: JSBI[] = randomFieldElementArray<JSBI, JSBI>(zp, d2 + 1)
            const coeffs3: JSBI[] = []
            for (let i = 0; i <= d3; ++i) {
                coeffs3[i] = JSBI.add(coeffs1[i] || JSBI.BigInt(0), coeffs2[i] || JSBI.BigInt(0))
            }

            p1 = new Polynomial(zp, coeffs1) // makePolynomial(zp, coeffs1)
            p2 = new Polynomial(zp, coeffs2)
            expected = new Polynomial(zp, coeffs3)

            sum = p1.add(p2)
            expect(sum.equals(expected)).toBeTruthy()
        }
    }
    const testPolynomialAddtionCommutative = (zp: ZpField<JSBI>) => {
        let numTests = 10
        const MAX_DEGREE = 20
        while (numTests-- > 0) {
            const d1 = Math.floor(Math.random() * MAX_DEGREE)
            const d2 = Math.floor(Math.random() * MAX_DEGREE)

            const coeffs1: JSBI[] = randomFieldElementArray<JSBI, JSBI>(zp, d1 + 1)
            const coeffs2: JSBI[] = randomFieldElementArray<JSBI, JSBI>(zp, d2 + 1)

            const p1 = new Polynomial(zp, coeffs1)
            const p2 = new Polynomial(zp, coeffs2)

            const sum1 = p1.add(p2)
            const sum2 = p2.add(p1)
            expect(sum1.equals(sum2)).toBeTruthy()
        }
    }

    const testKnownPolynomialSubtraction = (zp: ZpField<JSBI>) => {
        let p1 = makePolynomial(zp, [1, 2, 3])
        let p2 = makePolynomial(zp, [5, 0, 5, 7, 8])
        let expected = makePolynomial(zp, [-4, 2, -2, -7, -8])

        let diff = p1.subtract(p2)
        expect(diff.equals(expected)).toBeTruthy()

        let numTests = 10
        const MAX_DEGREE = 20
        while (numTests-- > 0) {
            const d1 = Math.floor(Math.random() * MAX_DEGREE)
            const d2 = Math.floor(Math.random() * MAX_DEGREE)
            const d3 = Math.max(d1, d2)
            const coeffs1: JSBI[] = randomFieldElementArray<JSBI, JSBI>(zp, d1 + 1)
            const coeffs2: JSBI[] = randomFieldElementArray<JSBI, JSBI>(zp, d2 + 1)
            const coeffs3: JSBI[] = []
            for (let i = 0; i <= d3; ++i) {
                coeffs3[i] = JSBI.subtract(coeffs1[i] || JSBI.BigInt(0), coeffs2[i] || JSBI.BigInt(0))
            }

            p1 = new Polynomial(zp, coeffs1)
            p2 = new Polynomial(zp, coeffs2)
            expected = new Polynomial(zp, coeffs3)

            diff = p1.subtract(p2)
            expect(diff.equals(expected)).toBeTruthy()
        }
    }
    const testPolynomialAddThenSubtract = (zp: ZpField<JSBI>) => {
        let p1 = makePolynomial(zp, [1, 2, 3])
        let p2 = makePolynomial(zp, [5, 0, 5, 7, 8])

        let p1p = p1.subtract(p2).add(p2)
        expect(p1p.equals(p1)).toBe(true)

        let numTests = 10
        const MAX_DEGREE = 20
        while (numTests-- > 0) {
            const d1 = Math.floor(Math.random() * MAX_DEGREE)
            const d2 = Math.floor(Math.random() * MAX_DEGREE)

            const coeffs1: JSBI[] = randomFieldElementArray<JSBI, JSBI>(zp, d1 + 1)
            const coeffs2: JSBI[] = randomFieldElementArray<JSBI, JSBI>(zp, d2 + 1)
            p1 = new Polynomial(zp, coeffs1)
            p2 = new Polynomial(zp, coeffs2)

            p1p = p1.subtract(p2).add(p2)
            expect(p1p.equals(p1)).toBe(true)
        }
    }

    const testPolynomialMultiplicationCommutative = (zp: ZpField<JSBI>) => {
        let numTests = 10
        const MAX_DEGREE = 20
        while (numTests-- > 0) {
            const d1 = Math.floor(Math.random() * MAX_DEGREE)
            const d2 = Math.floor(Math.random() * MAX_DEGREE)

            const coeffs1: JSBI[] = randomFieldElementArray<JSBI, JSBI>(zp, d1 + 1)
            const coeffs2: JSBI[] = randomFieldElementArray<JSBI, JSBI>(zp, d2 + 1)

            const p1 = new Polynomial(zp, coeffs1)
            const p2 = new Polynomial(zp, coeffs2)

            const prod1 = p1.multiply(p2)
            const prod2 = p2.multiply(p1)
            expect(prod1.equals(prod2)).toBeTruthy()
        }
    }

    const testPolynomialScalarMultiplyIsRepeatedAddition = (zp: ZpField<JSBI>) => {
        const p = new Polynomial(zp, randomFieldElementArray<JSBI, JSBI>(zp, 20))
        const ns = [2, 7, 8, 1023, 1024, 1025, 1153].map((n) => JSBI.BigInt(n))
        for (const n of ns) {
            const scaled = p.scalarMultiply(n)
            let added = makePolynomial(zp, [])
            for (let i = 0; JSBI.LT(i, n); ++i) {
                added = added.add(p)
            }
            expect(added.equals(scaled)).toBe(true)
        }
    }

    const testPolynomialIsMonic = (zp: ZpField<JSBI>) => {
        const monic = makePolynomial(zp, [0, 1, 2, 17, 1])
        const nonMonic = makePolynomial(zp, [0, 1, 2, 17, 5])

        expect(monic.isMonic()).toBe(true)
        expect(nonMonic.isMonic()).toBe(false)

        const madeMonic = nonMonic.monic()
        expect(madeMonic.degree).toBe(nonMonic.degree)
        expect(madeMonic.isMonic()).toBe(true)

        const scaledBack = madeMonic.scalarMultiply(nonMonic.leadingCoefficient)
        expect(scaledBack.equals(nonMonic)).toBe(true)
    }

    // Division tests should cover a.degree < b.degree, a.degree == b.degree, a.degree > b.degree
    const testKnownPolynomialDivision = (zp: ZpField<JSBI>) => {
        const x2mxm1 = getTestPoly(zp, 'x2mxm1')
        const zeta7 = getTestPoly(zp, 'zeta7')
        const x = getTestPoly(zp, 'x')
        if (!x2mxm1 || !zeta7 || !x) {
            throw new Error('test not set up correctly')
        }

        const f = x2mxm1.multiply(zeta7).add(x)
        {
            const { q, r } = polynomialDivide(f, x2mxm1)
            expect(q.equals(zeta7)).toBe(true)
            expect(r.equals(x)).toBe(true)
        }
        {
            const { q, r } = polynomialDivide(f, zeta7)
            expect(q.equals(x2mxm1)).toBe(true)
            expect(r.equals(x)).toBe(true)
        }

        const rand1 = new Polynomial(zp, randomFieldElementArray<JSBI, JSBI>(zp, 15))
        const rand2 = new Polynomial(zp, randomFieldElementArray<JSBI, JSBI>(zp, 15))
        const rand3 = new Polynomial(zp, randomFieldElementArray<JSBI, JSBI>(zp, 10))
        const frand = rand1.multiply(rand2).add(rand3)
        {
            const { q, r } = polynomialDivide(frand, rand1)
            expect(q.equals(rand2)).toBe(true)
            expect(r.equals(rand3)).toBe(true)
        }
        {
            const { q, r } = polynomialDivide(frand, rand2)
            expect(q.equals(rand1)).toBe(true)
            expect(r.equals(rand3)).toBe(true)
        }
    }
    const testPolynomialMultiplyThenDivide = (zp: ZpField<JSBI>) => {
        let numTests = 10
        const MAX_DEGREE = 20
        while (numTests-- > 0) {
            const d1 = Math.floor(1 + Math.random() * MAX_DEGREE)
            const d2 = Math.floor(1 + Math.random() * MAX_DEGREE)
            const coeffs1: JSBI[] = randomFieldElementArray<JSBI, JSBI>(zp, d1 + 1)
            const coeffs2: JSBI[] = randomFieldElementArray<JSBI, JSBI>(zp, d2 + 1)
            const p1 = new Polynomial(zp, coeffs1)
            const p2 = new Polynomial(zp, coeffs2)

            const prod = p1.multiply(p2)
            {
                const { q, r } = polynomialDivide(prod, p2)
                expect(q.equals(p1)).toBe(true)
                expect(r.degree).toBe(-1)
            }
            {
                const { q, r } = polynomialDivide(prod, p1)
                expect(q.equals(p2)).toBe(true)
                expect(r.degree).toBe(-1)
            }
        }
    }
    const testPolynomialScalarDivide = (zp: ZpField<JSBI>) => {
        const tenf = makePolynomial(zp, [30, 50, 20, -170, 40])
        const f = makePolynomial(zp, [3, 5, 2, -17, 4])

        const ten = zp.fromNumber(10)
        const tenpoly = makePolynomial(zp, [10])
        const teninv = zp.invert(ten)

        const div1 = polynomialDivide(tenf, tenpoly)
        expect(div1.r.degree).toBe(-1)
        expect(div1.q.equals(f)).toBe(true)

        const div2 = tenf.scalarMultiply(teninv)
        expect(div2.equals(f)).toBe(true)
    }

    const testMonicDivision = (zp: ZpField<JSBI>) => {
        const rand1 = new Polynomial(zp, randomFieldElementArray<JSBI, JSBI>(zp, 20)).monic()
        const rand2 = new Polynomial(zp, randomFieldElementArray<JSBI, JSBI>(zp, 15)).monic()
        const rand3 = new Polynomial(zp, randomFieldElementArray<JSBI, JSBI>(zp, 10)).monic()

        {
            const { q, r } = polynomialDivide(rand1, rand2)
            const reconstructed = q.multiply(rand2).add(r)
            expect(reconstructed.equals(rand1))
        }
        {
            const { q, r } = polynomialDivide(rand3, rand2)
            const reconstructed = q.multiply(rand2).add(r)
            expect(reconstructed.equals(rand1))
        }
    }
    const testNonMonicDivision = (zp: ZpField<JSBI>) => {
        const rand1 = new Polynomial(zp, randomFieldElementArray<JSBI, JSBI>(zp, 20)).scalarMultiply(zp.fromNumber(17))
        const rand2 = new Polynomial(zp, randomFieldElementArray<JSBI, JSBI>(zp, 15)).scalarMultiply(zp.fromNumber(11))
        const rand3 = new Polynomial(zp, randomFieldElementArray<JSBI, JSBI>(zp, 10)).scalarMultiply(zp.fromNumber(13))

        {
            const { q, r } = polynomialDivide(rand1, rand2)
            const reconstructed = q.multiply(rand2).add(r)
            expect(reconstructed.equals(rand1))
        }
        {
            const { q, r } = polynomialDivide(rand3, rand2)
            const reconstructed = q.multiply(rand2).add(r)
            expect(reconstructed.equals(rand1))
        }
    }

    const testKnownPolynomialMod = (zp: ZpField<JSBI>) => {
        const rand1 = new Polynomial(zp, randomFieldElementArray<JSBI, JSBI>(zp, 20))
        const rand2 = new Polynomial(zp, randomFieldElementArray<JSBI, JSBI>(zp, 15))
        const rand3 = new Polynomial(zp, randomFieldElementArray<JSBI, JSBI>(zp, 10))

        const prod = rand1.multiply(rand2)
        const f = prod.add(rand3)

        const m1 = polynomialMod(f, rand1)
        const m2 = polynomialMod(f, rand2)

        expect(m1.equals(rand3)).toBe(true)
        expect(m2.equals(rand3)).toBe(true)
    }
    const testGCDDividesInputs = (zp: ZpField<JSBI>) => {
        const rand1 = new Polynomial(zp, randomFieldElementArray<JSBI, JSBI>(zp, 20))
        const rand2 = new Polynomial(zp, randomFieldElementArray<JSBI, JSBI>(zp, 15))
        const rand3 = new Polynomial(zp, randomFieldElementArray<JSBI, JSBI>(zp, 10))

        const prod1 = rand1.multiply(rand2)
        const prod2 = rand1.multiply(rand3)

        const gcd1 = gcd(prod1, prod2)
        const div1 = polynomialDivide(prod1, gcd1)

        expect(div1.r.degree).toBe(-1)
        const div2 = polynomialDivide(prod2, gcd1)
        expect(div2.r.degree).toBe(-1)

        const reconstructed1 = div1.q.multiply(gcd1)
        expect(reconstructed1.equals(prod1)).toBe(true)
        const reconstructed2 = div2.q.multiply(gcd1)
        expect(reconstructed2.equals(prod2)).toBe(true)
    }

    const testKnownPolynomialModExp = (zp: ZpField<JSBI>) => {
        const x = getTestPoly(zp, 'x')
        const x2mxm1 = getTestPoly(zp, 'x2mxm1')

        for (let i = 2; i < 30; ++i) {
            const fibi = fib(JSBI, i - 1)
            const fibim1 = fib(JSBI, i - 2)
            const expected = new Polynomial(zp, [fibim1, fibi])
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const modpow = powerMod(x!, JSBI.BigInt(i), x2mxm1!, JSBI)
            expect(modpow.equals(expected)).toBe(true)
        }
    }
    const testPolynomialModExpIsRepeatedMultiplication = (zp: ZpField<JSBI>) => {
        const modulus = new Polynomial(zp, randomFieldElementArray<JSBI, JSBI>(zp, 10))
        const base = new Polynomial(zp, randomFieldElementArray<JSBI, JSBI>(zp, 9))
        let acc = base.clone()
        for (let i = 2; i < 30; ++i) {
            const pow = powerMod(base, JSBI.BigInt(i), modulus, JSBI)
            acc = polynomialMod(acc.multiply(base), modulus)

            expect(acc.equals(pow)).toBe(true)
        }
    }

    const testPolynomialDivisionRemainderIsLowerDegree = (zp: ZpField<JSBI>) => {
        const rand1 = new Polynomial(zp, randomFieldElementArray<JSBI, JSBI>(zp, 20))
        const rand2 = new Polynomial(zp, randomFieldElementArray<JSBI, JSBI>(zp, 15))
        {
            const { r } = polynomialDivide(rand1, rand2)
            expect(r.degree < rand2.degree)
        }
        {
            const { r } = polynomialDivide(rand2, rand1)
            expect(r.degree < rand1.degree)
        }
    }

    const testApproximateInverses = (zp: ZpField<JSBI>) => {
        // polynomial f = x^5v + x^5 + x^2 + 13
        const f = makePolynomial(zp, [13, 0, 1, 0, 1, 1])
        // Start of Laurent series for f inverse = x^(-5) - x^(-6) + x^(-7) - 2x^(-8) + 3x^(-9) - 17x^(-5) +...
        const firstInverseCoefficients = [1, -1, 1, -2, 3, -17].map((n) => zp.fromNumber(n))

        const ai1 = f.approximateInverse(1)
        const ai32 = f.approximateInverse(5)
        const ai2 = f.approximateInverse(2)

        for (let i = 0; i < Math.min(firstInverseCoefficients.length, ai1.coeffs.length); ++i) {
            expect(ai1.coeffs[i].toString()).toEqual(firstInverseCoefficients[i].toString())
        }
        for (let i = 0; i < Math.min(firstInverseCoefficients.length, ai2.coeffs.length); ++i) {
            expect(ai2.coeffs[i].toString()).toEqual(firstInverseCoefficients[i].toString())
        }
        for (let i = 0; i < Math.min(firstInverseCoefficients.length, ai32.coeffs.length); ++i) {
            expect(ai32.coeffs[i].toString()).toEqual(firstInverseCoefficients[i].toString())
        }
    }
    const testFindRoot = (zp: ZpField<JSBI>) => {
        const { modulus } = zp

        let f = randomPolynomial(zp, 30)
        let splittable = findLinearFactor(JSBI, f)
        let iter = 0
        while (!splittable && iter < 10) {
            f = randomPolynomial(zp, 30)
            splittable = findLinearFactor(JSBI, f)
            ++iter
        }
        expect(splittable?.isMonic()).toBeTruthy()
        const root = JSBI.subtract(modulus, splittable?.coeffs[0] || zp.zero)
        const val = f.eval(zp.fromNumber(root))
        expect(val.toString()).toEqual('0')
    }

    test('addition of known polynomials', () => {
        for (const zp of zps) {
            testKnownPolynomialAddtion(zp)
        }
    })

    test('polynomial addition is commutative', () => {
        for (const zp of zps) {
            testPolynomialAddtionCommutative(zp)
        }
    })

    test('subtraction of known polynomials', () => {
        for (const zp of zps) {
            testKnownPolynomialSubtraction(zp)
        }
    })

    test('polynomial subtraction reverses addition', () => {
        for (const zp of zps) {
            testPolynomialAddThenSubtract(zp)
        }
    })

    test('polynomial multiplication is commutative', () => {
        for (const zp of zps) {
            testPolynomialMultiplicationCommutative(zp)
        }
    })

    test('known polynomial division', () => {
        for (const zp of zps) {
            testKnownPolynomialDivision(zp)
        }
    })

    test('polynomial division reverses multiplication', () => {
        for (const zp of zps) {
            testPolynomialMultiplyThenDivide(zp)
        }
    })

    test('polynomial scalar division', () => {
        for (const zp of zps) {
            testPolynomialScalarDivide(zp)
        }
    })

    test('polynomial division - monic', () => {
        for (const zp of zps) {
            testMonicDivision(zp)
        }
    })

    test('polynomial division - non-monic', () => {
        for (const zp of zps) {
            testNonMonicDivision(zp)
        }
    })

    test('polynomial modulo polynomial', () => {
        for (const zp of zps) {
            testKnownPolynomialMod(zp)
        }
    })

    test('polynomial scalar multiplication is repeated addition', () => {
        for (const zp of zps) {
            testPolynomialScalarMultiplyIsRepeatedAddition(zp)
        }
    })

    test('polynomial monic functions', () => {
        for (const zp of zps) {
            testPolynomialIsMonic(zp)
        }
    })

    test('polynomial division remainder is lower degree', () => {
        for (const zp of zps) {
            testPolynomialDivisionRemainderIsLowerDegree(zp)
        }
    })

    test('power modulo a polynomial - fibonacci powers', () => {
        for (const zp of zps) {
            testKnownPolynomialModExp(zp)
        }
    })

    test('power modulo a polynomial - fibonacci powers', () => {
        for (const zp of zps) {
            testPolynomialModExpIsRepeatedMultiplication(zp)
        }
    })

    test('find root of random polynomial', () => {
        for (const zp of zps) {
            testFindRoot(zp)
        }
    })

    test('find root of random polynomial', () => {
        for (const zp of zps) {
            testGCDDividesInputs(zp)
        }
    })

    test('Polynomial division - quotient and remainder', () => {
        const modulus = JSBI.BigInt(10009)
        const zn = new ZpField<JSBI>(JSBI, modulus)

        const coeffs1 = [1, 2, 2, 2, 5, 6].reverse().map((n) => zn.fromNumber(n))
        const p1 = new Polynomial(zn, coeffs1)

        const coeffs2 = [1, 2, 2].reverse().map((n) => zn.fromNumber(n))
        const p2 = new Polynomial(zn, coeffs2)

        const { q, r } = polynomialDivide(p1, p2)
        console.log({ p1: p1.toString(), p2: p2.toString(), q: q.toString(), r: r.toString() })

        const prod = q.multiply(p2)
        console.log(prod.toString())
        console.log(prod.add(r).toString())

        const x8 = new Polynomial(
            zn,
            [0, 0, 0, 0, 0, 0, 0, 0, 1].map((n) => zn.fromNumber(n))
        )
        const f = new Polynomial(
            zn,
            [13, 0, 1, 0, 1, 1].map((n) => zn.fromNumber(n))
        )
        {
            const { q, r } = polynomialDivide(x8, f)
            const r2 = polynomialMod(x8, f)
            console.log(`x8 divided by f:
        q: ${q.toString()}
        r: ${r.toString()}
        r2: ${r2.toString()}
        f: ${f.toString()}`)
        }
    })

    test('power modulo a polynomial', () => {
        const modulus = JSBI.BigInt(19)
        const zn = new ZpField<JSBI>(JSBI, modulus)
        const modulusCoeffs = [1, 1, 0, 1, 0, 13].reverse().map((n) => zn.fromNumber(n))
        const polymodulus = new Polynomial(zn, modulusCoeffs)

        const baseCoeffs = [0, 1].map((n) => zn.fromNumber(n))
        const x = new Polynomial(zn, baseCoeffs)

        const x17modf = powerMod(x, JSBI.BigInt(17), polymodulus, JSBI)
        console.log(`x17modf: ${x17modf.toString()}`)
        expect(x17modf.degree).toBeLessThan(polymodulus.degree)
    })

    test('zero polynomial', () => {
        const modulus = JSBI.BigInt(101)
        const zn = new ZpField<JSBI>(JSBI, modulus)
        const zp = zeroPolynomial<JSBI, JSBI>(zn)

        const coeffs = [1, -1, -1].reverse().map((n) => zn.fromNumber(n))
        const poly = new Polynomial(zn, coeffs)
        const sum = poly.add(zp)
        expect(sum.equals(poly)).toBeTruthy()

        const anotherZp = zeroPolynomial(zn)
        expect(anotherZp.equals(zp)).toBeTruthy()
    })

    test('polynomial GCD', () => {
        const modulus = JSBI.BigInt(101)
        const zn = new ZpField<JSBI>(JSBI, modulus)
        const coeffs1 = [1, 1, 1, 1, 1, 1].reverse().map((n) => zn.fromNumber(n)) // [1, 3, 4, 4, 4, 3, 1].reverse().map((n) => zn.fromJSBI(JSBI.BigInt(n))))
        const p1 = new Polynomial(zn, coeffs1)

        const coeffs2 = [1, 1, 1, 1, 1, 1, 1, 1, 1].reverse().map((n) => zn.fromNumber(n)) // [1, 3, 4, 4, 3, 1].reverse().map((n) => zn.fromJSBI(JSBI.BigInt(n))))
        const p2 = new Polynomial(zn, coeffs2)

        const g = gcd(p1, p2)
        console.log('GCD: ' + g.toString())
    })

    test('find root - small poly', () => {
        // const modulus = 289074500134862184880115710463760056022772626011660032416150488966685969359
        const modulus = p1 // 2^255 - 19
        const zn = new ZpField<JSBI>(JSBI, modulus)

        const coeffs = [-120, 274, -225, 85, -15, 1].map((n) => zn.fromNumber(n))
        // const coeffs = [-3, 0, 1, 17, 1, 1].map((n) => zn.fromJSBI(JSBI.BigInt(n)))
        const f = new Polynomial<JSBI, JSBI>(zn, coeffs)
        const splittable = findLinearFactor(JSBI, f)
        expect(splittable).not.toBeNull()
        let root = JSBI.BigInt(0)
        if (splittable) {
            root = JSBI.subtract(modulus, splittable.coeffs[0])
        }
        expect(['1', '2', '3', '4', '5']).toContain(root.toString())
    })

    test('test polynomial evaluation', () => {
        const modulus = p1
        const zn = new ZpField<JSBI>(JSBI, modulus)
        const poly = new Polynomial(
            zn,
            [1, 1, 1, 1, 1].map((n) => zn.fromNumber(n))
        )

        expect(poly.eval(zn.fromNumber(0)).toString()).toEqual('1')

        expect(poly.eval(zn.fromNumber(1)).toString()).toEqual('5')

        expect(poly.eval(zn.fromNumber(2)).toString()).toEqual('31')

        expect(poly.eval(zn.fromNumber(-1)).toString()).toEqual('1')

        expect(poly.eval(zn.fromNumber(-2)).toString()).toEqual('11')
    })

    test('irreducible poly has no root', () => {
        const zp = zps[0] // p = 2**255 - 19
        const x2minus2 = makePolynomial(zp, [-2, 0, 1]) // x^2 - 2 : 2 is NOT a quadratic residue so this is irred

        const factor = findLinearFactor(JSBI, x2minus2)
        expect(factor).toBeNull()
    })

    test('irreducible-times-linear poly has root', () => {
        const zp = zps[0] // p = 2**255 - 19
        const x2minus2 = makePolynomial(zp, [-2, 0, 1]) // x^2 - 2 : 2 is NOT a quadratic residue so this is irred
        const xminus1 = makePolynomial(zp, [-1, 1])
        const f = x2minus2.multiply(xminus1)
        const factor = findLinearFactor(JSBI, f)
        expect(factor).not.toBeNull()

        expect(factor?.coeffs[0].toString()).toEqual(zp.subtract(zp.zero, zp.one).toString())
    })

    test('polynomial equality', () => {
        const zp = zps[0] // p = 2**255 - 19
        const f1 = new Polynomial(
            zp,
            [1, 2, 3, 4, -1].map((n) => JSBI.BigInt(n))
        )
        const f2 = new Polynomial(
            zp,
            [1, 2, 4, -1].map((n) => JSBI.BigInt(n))
        )
        const f3 = new Polynomial(
            zp,
            [1, 2, 3, 5, -1].map((n) => JSBI.BigInt(n))
        )
        const f4 = new Polynomial(
            zp,
            [1, 2, 3, 4, -1].map((n) => JSBI.BigInt(n))
        )

        expect(f1.equals(f2)).toBe(false)
        expect(f2.equals(f1)).toBe(false)
        expect(f1.equals(f3)).toBe(false)
        expect(f3.equals(f1)).toBe(false)
        expect(f1.equals(f4)).toBe(true)
        expect(f4.equals(f1)).toBe(true)
    })

    test('approximate inverses', () => {
        for (const zp of zps) {
            testApproximateInverses(zp)
        }
    })

    test('printing', () => {
        const z25519 = zps[0] // p = 2**255 - 19
        const xMinusOne = makePolynomial(z25519, [-1, 1])
        const cyclotomic7 = makePolynomial(z25519, [1, 1, 1, 1, 1, 1, 1])

        const x7MinusOne = xMinusOne.multiply(cyclotomic7)
        console.log(x7MinusOne.toString()) // x^7 + -1})
        expect(x7MinusOne.toString()).toBe(
            '1x^7 + 0x^6 + 0x^5 + 0x^4 + 0x^3 + 0x^2 + 0x^1 + 57896044618658097711785492504343953926634992332820282019728792003956564819948x^0'
        )
    })

    test('readme snippets 1', () => {
        const z25519 = new ZpField<JSBI>(
            JSBI,
            JSBI.BigInt('57896044618658097711785492504343953926634992332820282019728792003956564819949')
        )
        // x^2 + 2x + 3
        const x2p2xp3 = makePolynomial(z25519, [3, 2, 1])

        // Also x^2 + 2x + 3
        const x2p2xp3Again = new Polynomial(
            z25519,
            [3, 2, 1].map((n) => z25519.fromNumber(n))
        )

        console.log(x2p2xp3.toString()) // 1x^2 + 12x + 3x^0
        expect(x2p2xp3.toString()).toEqual(x2p2xp3Again.toString())
    })
    test('readme snippets 2', () => {
        const z25519 = new ZpField<JSBI>(
            JSBI,
            JSBI.BigInt('57896044618658097711785492504343953926634992332820282019728792003956564819949')
        )
        const goldenRatioPoly = makePolynomial(z25519, [-1, -1, 1])
        const xMinusOne = makePolynomial(z25519, [-1, 1])
        const cyclotomic7 = makePolynomial(z25519, [1, 1, 1, 1, 1, 1, 1])

        // Add polynomials
        const x2Minus2 = goldenRatioPoly.add(xMinusOne)
        expect(x2Minus2.equals(makePolynomial(z25519, [-2, 0, 1]))).toBe(true) // true- x^2 - 2

        //scalarMultiply polynomials
        // 3x^2 - 3x - 3
        const threeX2Minus3XMinus3 = goldenRatioPoly.scalarMultiply(z25519.fromNumber(3))

        //Subtract polynomials
        // 2x^2 - 2x - 2
        const subtracted = threeX2Minus3XMinus3.subtract(goldenRatioPoly)
        expect(subtracted.equals(makePolynomial(z25519, [-2, -2, 2]))).toBe(true)
        // Multiply polynomials

        const x7MinusOne = xMinusOne.multiply(cyclotomic7)
        // Prints 1x^7 + 0x^6 + 0x^5 + 0x^4 + 0x^3 + 0x^2 + 0x^1 + 57896044618658097711785492504343953926634992332820282019728792003956564819948x^0
        // equivalent to x^7 -1
        console.log(x7MinusOne.toString())
        expect(x7MinusOne.toString()).toEqual(
            '1x^7 + 0x^6 + 0x^5 + 0x^4 + 0x^3 + 0x^2 + 0x^1 + 57896044618658097711785492504343953926634992332820282019728792003956564819948x^0'
        )
    })
    test('readme snippets 3', () => {
        const z10009 = new ZpField<JSBI>(JSBI, JSBI.BigInt(10009))

        // p1 = x^5 + 2x^4 + 2x^3 + 2x^2 + 5x + 6
        const p1 = makePolynomial(z10009, [6, 5, 2, 2, 2, 1])

        // p2 = x^2 + 2x + 2
        const p2 = makePolynomial(z10009, [2, 2, 1])

        const { q, r } = polynomialDivide(p1, p2)

        // q = x^3 + 2, r = x + 2
        console.log({ q: q.toString(), r: r.toString() })
        expect(q.equals(makePolynomial(z10009, [2, 0, 0, 1]))).toBe(true)
        expect(r.equals(makePolynomial(z10009, [2, 1]))).toBe(true)
        expect(p2.multiply(q).add(r).equals(p1)).toBe(true)

        const goldenRatioPoly = makePolynomial(z10009, [-1, -1, 1])
        const x7 = makePolynomial(z10009, [0, 0, 0, 0, 0, 5])
        const x7modGolden = polynomialMod(x7, goldenRatioPoly)

        // x5 % goldenRatioPoly == 13x + 8 - Fibonacci numbers, of course
        x7modGolden.equals(makePolynomial(z10009, [8, 13]))
    })
    test('readme snippets 4', () => {
        const p25519 = JSBI.BigInt('57896044618658097711785492504343953926634992332820282019728792003956564819949')
        const z25519 = new ZpField<JSBI>(JSBI, p25519)
        // s = (p25519 - 1)/2.  Every quadratic residue of Z25519 solves x^s - 1 = 0
        const s = JSBI.divide(JSBI.subtract(p25519, JSBI.BigInt(1)), JSBI.BigInt(2))

        // f(x) = x^2 - 3x + 2 = (x - 2)*(x - 1)
        const f = makePolynomial(z25519, [2, -3, 1])
        const x = makePolynomial(z25519, [0, 1])

        // efficiently compute x^s modulo f == -x + 2
        // Note the last argument - need to pass our Integer implementation in!
        const xToSModf = powerMod(x, s, f, JSBI)
        expect(xToSModf.equals(makePolynomial(z25519, [3, -2]))).toBeTruthy()
    })
    test('readme snippets 5', () => {
        const p25519 = JSBI.BigInt('57896044618658097711785492504343953926634992332820282019728792003956564819949')
        const z25519 = new ZpField<JSBI>(JSBI, p25519)

        // f = x^3 - 9x^2 + 27x - 27 (==(x-3)^3)
        const f = makePolynomial(z25519, [-27, 27, -9, 1])

        // g = x^4 - 81 (== (x-3)(x+3)(x^2 + 9))
        const g = makePolynomial(z25519, [-81, 0, 0, 0, 1])

        // gcd(f,g) = x - 3
        const h = gcd(f, g)
        expect(h.equals(makePolynomial(z25519, [-3, 1])))
    })
    test('readme snippets 6', () => {
        const p25519 = JSBI.BigInt('57896044618658097711785492504343953926634992332820282019728792003956564819949')
        const z25519 = new ZpField<JSBI>(JSBI, p25519)
        // f(x) = x^3 - x^2 - 2x + 2 = (x^2 - 2)*(x - 1)
        const f = makePolynomial(z25519, [2, -2, -1, 1])

        // Now we find the factor - Note that we need to pass our Integer implementation into this function.
        const factor = findLinearFactor(JSBI, f)

        // factor == x - 1
        expect(factor).toBeTruthy()
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        expect(factor!.equals(makePolynomial(z25519, [-1, 1])))

        // x^2 - 2 is irreducible in z25519 since 2 is not a quadratic residue, so
        // we can't find a linear factor here
        const x2Minus2 = makePolynomial(z25519, [-2, 0, 1])
        const shouldBeNull = findLinearFactor(JSBI, x2Minus2)

        expect(shouldBeNull).toBeNull()

        // f(x) = x^3 - x^2 - 2x + 2 = (x^2 - 2)*(x - 1)
        const f2 = makePolynomial(z25519, [2, -2, -1, 1])
        const factor2 = findLinearFactor(JSBI, f2)

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const root = z25519.negate(factor2!.coeffs[0])

        // now if we evaluate f at root, we get zero
        const shouldBeZero = f2.eval(root)
        expect(shouldBeZero.toString()).toEqual('0')
    })
})

function randomPolynomial(ring: ZpField<JSBI>, deg: number): Polynomial<JSBI, JSBI> {
    const coeffs: JSBI[] = []
    while (deg >= 0) {
        coeffs.push(ring.randomElement())
        --deg
    }
    return new Polynomial(ring, coeffs)
}
