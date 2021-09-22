import { isField, Ring, Field } from './algebra-types'
import { BigIntType, Integers } from '.'

export class Polynomial<ElementType, BIT extends BigIntType> {
    private _approximateInverses: Polynomial<ElementType, BIT>[] = []
    constructor(private _baseRing: Ring<ElementType, BIT>, private _coeffs: ElementType[]) {
        this._trimLeadingZeroes()
    }

    private _trimLeadingZeroes(): void {
        let leading = this._coeffs.pop()
        while (leading !== undefined && this._baseRing.equal(leading, this._baseRing.zero)) {
            leading = this._coeffs.pop()
        }
        if (leading) {
            this._coeffs.push(leading)
        }
    }

    get coeffs(): ElementType[] {
        return this._coeffs
    }

    get baseRing(): Ring<ElementType, BIT> {
        return this._baseRing
    }

    get baseField(): Field<ElementType, BIT> | null {
        return (isField<ElementType, BIT>(this._baseRing) && this._baseRing) || null
    }

    get degree(): number {
        return this._coeffs.length - 1
    }
    get leadingCoefficient(): ElementType {
        return this._coeffs[this.degree]
    }
    equals(rhs: Polynomial<ElementType, BIT>): boolean {
        if (this.degree !== rhs.degree) {
            return false
        }
        for (const i in this._coeffs) {
            if (!this._baseRing.equal(this._coeffs[i], rhs._coeffs[i])) {
                return false
            }
        }
        return true
    }
    isMonic(): boolean {
        if (this._coeffs.length === 0) {
            return true
        }
        return this._baseRing.equal(this.leadingCoefficient, this._baseRing.one)
    }
    clone(): Polynomial<ElementType, BIT> {
        return new Polynomial<ElementType, BIT>(this._baseRing, [...this._coeffs])
    }

    reverse(): Polynomial<ElementType, BIT> {
        const reversed = [...this._coeffs].reverse()
        return new Polynomial(this._baseRing, reversed)
    }

    add(other: Polynomial<ElementType, BIT>): Polynomial<ElementType, BIT> {
        const size = Math.max(this.degree, other.degree) + 1
        const result = Array<ElementType>(size)

        for (let i = 0; i < size; ++i) {
            const otherCoeff = other._coeffs[i] || this._baseRing.zero
            const thisCoeff = this._coeffs[i] || this._baseRing.zero
            result[i] = this._baseRing.add(thisCoeff, otherCoeff)
        }
        return new Polynomial<ElementType, BIT>(this._baseRing, result)
    }
    subtract(other: Polynomial<ElementType, BIT>): Polynomial<ElementType, BIT> {
        const size = Math.max(this.degree, other.degree) + 1
        const result = Array<ElementType>(size)

        for (let i = 0; i < size; ++i) {
            const otherCoeff = other._coeffs[i] || this._baseRing.zero
            const thisCoeff = this._coeffs[i] || this._baseRing.zero
            result[i] = this._baseRing.subtract(thisCoeff, otherCoeff)
        }
        return new Polynomial<ElementType, BIT>(this._baseRing, result)
    }
    multiply(other: Polynomial<ElementType, BIT>): Polynomial<ElementType, BIT> {
        const size = this.degree + other.degree + 1
        const result = Array<ElementType>(size)
        if (this.degree === -1 || other.degree === -1) {
            return new Polynomial<ElementType, BIT>(this._baseRing, [])
        }

        for (let i = 0; i < size; ++i) {
            result[i] = this._baseRing.newElement()
        }

        for (let i = 0; i <= this.degree; ++i) {
            for (let j = 0; j <= other.degree; ++j) {
                const prod = this._baseRing.multiply(this._coeffs[i], other._coeffs[j])
                result[i + j] = this._baseRing.add(result[i + j], prod)
            }
        }
        return new Polynomial<ElementType, BIT>(this._baseRing, result)
    }
    scalarMultiply(scalar: ElementType): Polynomial<ElementType, BIT> {
        const coeffs = this._coeffs.map((n) => {
            return this.baseRing.multiply(n, scalar)
        })
        return new Polynomial(this._baseRing, coeffs)
    }

    lowOrderTerms(numTerms: number): Polynomial<ElementType, BIT> {
        return new Polynomial(this._baseRing, this._coeffs.slice(0, numTerms))
    }

    // multiply by x^n
    leftShift(n: number): Polynomial<ElementType, BIT> {
        const zeroes = new Array<ElementType>(n)
        zeroes.fill(this._baseRing.newElement())
        return new Polynomial(this._baseRing, [...zeroes, ...this._coeffs])
    }

    monic(): Polynomial<ElementType, BIT> {
        if (this.isMonic()) {
            return this.clone()
        }

        const field = this._baseRing
        if (isField(field)) {
            const inv = field.invert(this.leadingCoefficient)
            return this.scalarMultiply(inv)
        } else {
            throw new Error('Can only convert to monic polynomial over a field')
        }
    }

    toString(): string {
        const result: string[] = []
        for (let i = this.coeffs.length - 1; i >= 0; --i) {
            result.push(`${this.coeffs[i]}x^${i}`)
        }
        return result.join(' + ')
    }

    eval(x: ElementType): ElementType {
        let acc = this.baseRing.zero
        let xpow = this.baseRing.one
        for (const i in this._coeffs) {
            const coeff = this._coeffs[i]
            const monomialVal = this.baseRing.multiply(coeff, xpow)
            acc = this.baseRing.add(acc, monomialVal)
            xpow = this.baseRing.multiply(xpow, x)
        }
        return acc
    }

    approximateInverse(logPrecision: number): Polynomial<ElementType, BIT> {
        if (this._approximateInverses.length > logPrecision) {
            return this._approximateInverses[logPrecision]
        }
        if (this._approximateInverses.length === 0) {
            this._approximateInverses.push(onePolynomial(this._baseRing))
        }
        // Use Newton's method to successively approximate inverses of the polynomial.
        // It is simpler to do this by reversing the polynomials rather than working with
        // Laurent series. See, e.g, Sutherland's notes (https://math.mit.edu/classes/18.783/2017/LectureNotes4.pdf).
        const f = this.reverse()
        const startingLogProcesion = this._approximateInverses.length - 1
        let precision = Math.pow(2, startingLogProcesion)
        let gi = this._approximateInverses[startingLogProcesion].clone()

        for (let i = startingLogProcesion + 1; i <= logPrecision; ++i) {
            const gisquared = gi.multiply(gi)
            const fgisquared = gisquared.multiply(f)
            const two = this.baseRing.fromNumber(2)
            const twogi = gi.scalarMultiply(two)
            gi = twogi.subtract(fgisquared).lowOrderTerms(precision)
            this._approximateInverses.push(gi)
            precision *= 2
        }
        // Now f*gi == 1 mod x^(m+1)
        return this._approximateInverses[logPrecision]
    }
}

export interface PolynomialDivisionResult<ElementType, BIT extends BigIntType> {
    q: Polynomial<ElementType, BIT>
    r: Polynomial<ElementType, BIT>
}

/**
 * Compute q, r such that a = qb + r
 * @param amonic
 * @param bmonic
 */
export function polynomialDivide<ElementType, BIT extends BigIntType>(
    a: Polynomial<ElementType, BIT>,
    b: Polynomial<ElementType, BIT>
): PolynomialDivisionResult<ElementType, BIT> {
    const field = a.baseRing
    if (!isField(field)) {
        throw new Error(`Polynomial division over non-fields not implemented`)
    }
    const alead = a.leadingCoefficient
    const blead = b.leadingCoefficient
    const bleadinv = field.invert(blead)
    const newlead = field.multiply(alead, bleadinv)

    const amonic = a.monic()
    const bmonic = b.monic()

    if (amonic.degree < bmonic.degree) {
        return {
            q: zeroPolynomial(amonic.baseRing),
            r: amonic.scalarMultiply(alead),
        }
    }
    if (amonic.degree === bmonic.degree) {
        // console.log(`dividing polynomials of same degree`, amonic.toString(), ', ', bmonic.toString())
        const result = {
            q: onePolynomial<ElementType, BIT>(amonic.baseRing).scalarMultiply(newlead),
            r: amonic.subtract(bmonic).scalarMultiply(alead),
        }
        // console.log({ q: result.q.toString(), r: result.r.toString() })
        return result
    }

    const m = amonic.degree - bmonic.degree
    const k = Math.ceil(Math.log2(m) + 1)

    const approxInverse = bmonic.approximateInverse(k + 1)

    // Now f*gi == 1 mod x^(m+1)
    const s = amonic
        .reverse()
        .multiply(approxInverse)
        .lowOrderTerms(m + 1)

    const qmonic = s.reverse().leftShift(m - s.degree)
    const r = amonic.subtract(bmonic.multiply(qmonic)).scalarMultiply(alead)

    // This should never happen and is covered in the tests.
    // if (r.degree >= b.degree) {
    //     throw new Error(`polynomial division failed. Remainder too large
    //     a: ${a.toString()}
    //     b: ${b.toString()}
    //     qmonic: ${qmonic.toString()}
    //     r: ${r.toString()}`)
    // }
    return { q: qmonic.scalarMultiply(newlead), r }
}

export function polynomialMod<ElementType, BIT extends BigIntType>(
    poly: Polynomial<ElementType, BIT>,
    modulus: Polynomial<ElementType, BIT>
): Polynomial<ElementType, BIT> {
    const { r } = polynomialDivide(poly, modulus)
    return r
}

export function powerMod<ElementType, BIT extends BigIntType>(
    base: Polynomial<ElementType, BIT>,
    power: BIT,
    modulus: Polynomial<ElementType, BIT>,
    Ints: Integers<BIT>
): Polynomial<ElementType, BIT> {
    let result = onePolynomial<ElementType, BIT>(base.baseRing)
    const zero = Ints.BigInt(0)
    const two = Ints.BigInt(2)

    // console.log(`powerMod(${base.toString()}, ${power}, ${modulus.toString()})`)
    while (Ints.GT(power, 0)) {
        // for cases where exponent
        // is not an even value
        if (Ints.notEqual(Ints.remainder(power, two), zero)) {
            result = polynomialMod(result.multiply(base), modulus)
        }

        // base = (base * base) % N?
        base = polynomialMod(base.multiply(base), modulus)
        power = Ints.divide(power, two)
    }
    // console.log(`powerMod result: ${result.toString()}`)
    return result
}

export function zeroPolynomial<ElementType, BIT extends BigIntType>(
    baseRing: Ring<ElementType, BIT>
): Polynomial<ElementType, BIT> {
    return new Polynomial<ElementType, BIT>(baseRing, [baseRing.zero])
}

export function onePolynomial<ElementType, BIT extends BigIntType>(
    baseRing: Ring<ElementType, BIT>
): Polynomial<ElementType, BIT> {
    return new Polynomial<ElementType, BIT>(baseRing, [baseRing.one])
}

export function gcd<ElementType, BIT extends BigIntType>(
    a: Polynomial<ElementType, BIT>,
    b: Polynomial<ElementType, BIT>
): Polynomial<ElementType, BIT> {
    const field = a.baseRing
    if (!isField(field)) {
        throw new Error('Polynomial GCD oly implemented for fields')
    }

    const zero = zeroPolynomial<ElementType, BIT>(field)
    while (!b.equals(zero)) {
        const t = polynomialMod(a, b).monic()
        a = b
        b = t
    }

    return a
}

export function findLinearFactor<BIT extends BigIntType>(
    Ints: Integers<BIT>,
    f: Polynomial<BIT, BIT>
): Polynomial<BIT, BIT> | null {
    const characteristic = f.baseField?.characteristic
    if (!characteristic || Ints.EQ(characteristic, 0) || Ints.NE(f.baseField?.indexOverPrimeField, 1)) {
        throw new Error(
            'polynomial factoring is only implemented over prime fields of positive characteristic. (Prime order finite fields)'
        )
    }

    const x = new Polynomial(
        f.baseRing,
        [0, 1].map((n) => f.baseRing.fromNumber(n))
    )
    const xpmodf = powerMod(x, characteristic, f, Ints)
    const xpmodfMinusx = xpmodf.subtract(x)

    let splittable = gcd(f, xpmodfMinusx)
    if (splittable.degree === 0) {
        return null
    }
    if (splittable.degree === 1) {
        return splittable.monic()
    }

    const s = Ints.divide(Ints.subtract(characteristic, Ints.BigInt(1)), Ints.BigInt(2))
    let iter = 0
    while (splittable.degree !== 1 && iter < 20) {
        const delta = f.baseRing.randomElement()
        const xPlusDelta = new Polynomial(f.baseRing, [delta, f.baseRing.fromNumber(1)]) // (x + delta)
        const xpd2smodf = powerMod(xPlusDelta, s, splittable, Ints)
        const xpd2smodfMinusOne = xpd2smodf.subtract(onePolynomial(f.baseRing)) // solutions are the s points where x + delta is a quadratic residue
        const newSplit = gcd(splittable, xpd2smodfMinusOne)

        // console.log(`iteration ${iter} old degree: ${splittable.degree} new degree: ${newSplit.degree}`)
        if (newSplit.degree > 0 && newSplit.degree < splittable.degree) {
            if (newSplit.degree <= splittable.degree / 2) {
                splittable = newSplit
            } else {
                const { q } = polynomialDivide(splittable, newSplit)
                splittable = q
            }
        }
        ++iter
    }
    return splittable.monic()
}
