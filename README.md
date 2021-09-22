# Finite Field Polynomial Arithmetic, Interpolation, and Factoring in TypeScript

Manipulate, factor, and interpolate polynomials over finite fields in TypeScript using the big integer
implementation of your choice.

## Usage

For thorough examples of usage, look at the tests in [`src/__test__/`](https://github.com/privacyresearchgroup/ffpoly-ts/tree/main/src/__test__). Here we will take a quick tour of the main features: finite fields, polynomials, factoring, and interpolation.

### Installation

The usual:

```
yarn add @privacyresearch/ffpoly-ts
```

### Finite Fields

This library provides implementations of prime finite field and polynomial arithmetic that work with any arbitary precision
integer implementation (possibly after writing a wrapper to implement a standard integer interface). This allows developers to
work with the integer implementation of their choice and decouple that decision from the finite field algebra implementation.

To illustrate the use, we work with two arbitrary precision integer implementations: [JSBI](https://github.com/GoogleChromeLabs/jsbi)
and Javascript native `bigint`.

The native `bigint` is much faster than JSBI, but there are important platforms, like React Native, where the `bigint` is not available.
It could also be that neither of these libraries meets your requirements, in which case you can use your own integer library.

Here's how you get started with JSBI:

```typescript
import JSBI from 'jsbi'
import { JSBIZpField } from '@privacyresearch/ffpoly-ts'

const z31 = new ZpField<JSBI>(JSBI, 31)

// create some field elements
const four = z31.fromNumber(4)
const eight = z31.fromNumber(8)

// generate a random element
let random = z31.randomElement()
// and make sure it isn't zero
while (JSBI.EQ(random, 0)) {
  random = z31.randomElement()
}

// Now do some arithmetic
const eightInv = z31.invert(eight)
// The line below will fail because Javascript equality doesn't work on JSBI instances
// expect(eightInv).toEqual(four)

// So we will do our tests with .toString
expect(eightInv.toString()).toEqual(four.toString())

let shouldBeOne = z31.multiply(eight, eightInv)
expect(shouldBeOne.toString()).toEqual(z31.one.toString())

shouldBeOne = z31.exponentiate(random, JSBI.BigInt(30))
expect(shouldBeOne.toString()).toEqual(z31.one.toString())

const fourPlusEight = z31.add(four, eight)
const shouldBeFour = z31.subtract(fourPlusEight, eight)
expect(shouldBeFour.toString()).toEqual(four.toString())

// And so on...
```

To use native `bigint` instead:

```typescript
import { ZpField, BigIntIntegers } from '@privacyresearch/ffpoly-ts'

// BigIntIntegers is a wrapper class around the native bigint
const NBI = new BigIntIntegers()
const z31 = new ZpField<bigint>(NBI, 31n)

// create some field elements
const four = z31.fromNumber(4n)
const eight = z31.fromNumber(8)
let random = z31.randomElement()
while (random === 0n) {
  random = z31.randomElement()
}

// Now do some arithmetic
const eightInv = z31.invert(eight)
expect(eightInv).toEqual(four)

let shouldBeOne = z31.multiply(eight, eightInv)
expect(shouldBeOne).toEqual(z31.one)

shouldBeOne = z31.exponentiate(random, 30n)
expect(shouldBeOne).toEqual(z31.one)

// And so on...
```

The library can work with any class that implements the interface [`Integers`](https://github.com/privacyresearchgroup/ffpoly-ts/blob/main/src/integers.ts). An implementation of
`Integers` can be extended to add functions `xgcd` and `powerMod`:

```typescript
import JSBI from 'jsbi'
import { extendIntegers } from '@privacyresearch/ffpoly-ts'

const XJSBI = extendIntegers(JSBI)
// x*a + y*b = gcd
const { gcd, x, y } = XJSBI.xgcd(JSBI.BigInt(7), JSBI.BigInt(5))
// gcd == 1, x == -2, y == 3

// powerMod
// 3 is not a quadratic residue mod 31, so 3^(30/2) ==== -1 (mod 31)
const A = XJSBI.powerMod(JSBI.BigInt(3), JSBI.BigInt(15), JSBI.BigInt(31))
expect(A.toString()).toEqual('30')
```

### Polynomials

Polynomials are created using a base ring and an array of coefficients in the ring, in little-endian order.

```typescript
import { makePolynomial, Polynomial, JSBISpField } from '@privacyresearch/ffpoly-ts'

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

console.log(x2p2xp3.toString()) // 1x^2 + 2x + 3x^0
expect(x2p2xp3.toString()).toEqual(x2p2xp3Again.toString())
```

Ring operations - add, subtract, negate, multiply, and scalarMultiply are available. Note that they _do not_ use the out ref signatures used by finite fields.

```typescript
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
```

One can also perform polynomial division with remainder:

```typescript
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
```

Which allows us to compute one polynomial modulo another:

```typescript
const goldenRatioPoly = makePolynomial(z10009, [-1, -1, 1])
const x7 = makePolynomial(z10009, [0, 0, 0, 0, 0, 5])
const x7modGolden = polynomialMod(x7, goldenRatioPoly)

// x5 % goldenRatioPoly == 13x + 8 - Fibonacci numbers, of course
x7modGolden.equals(makePolynomial(z10009, [8, 13]))
```

In many of our algorithms we will want to exponentiate a polynomial modulo another polynomial. To do this efficiently
we must use a repeated-squaring type algorithm and keep the intermediate results small. This is done by the
`powerMod` function:

```typescript
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
console.log({ xToSModf: xToSModf.toString(), expected: makePolynomial(z25519, [2, -1]).toString() })
expect(xToSModf.equals(makePolynomial(z25519, [3, -2]))).toBeTruthy()
```

### GCD

Compute the GCD of two polynomials:

```typescript
// f = x^3 - 9x^2 + 27x - 27 (==(x-3)^3)
const f = makePolynomial(z25519, [-27, 27, -9, 1])

// g = x^4 - 81 (== (x-3)(x+3)(x^2 + 9))
const g = makePolynomial(z25519, [-81, 0, 0, 0, 1])

// gcd(f,g) = x - 3
const h = gcd(f,g)
expect(h.equals(makePolynomial(z25519, [-3,1]))

```

### Finding Roots

The function `findLinearFactor` returns a root of a polynomial if one exists. It uses the algorithm described in
[Sutherland's course notes](https://math.mit.edu/classes/18.783/2017/LectureNotes4.pdf) and more fully developed in [Modern Computer Algebra](https://www.cambridge.org/core/books/modern-computer-algebra/DB3563D4013401734851CF683D2F03F0).

```typescript
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
```

The first call to `findRoot` found a linear factor. The result is always monic so to compute a root we can just look at the
low coefficient and negate it:

```typescript
// f(x) = x^3 - x^2 - 2x + 2 = (x^2 - 2)*(x - 1)
const f2 = makePolynomial(z25519, [2, -2, -1, 1])
const factor2 = findLinearFactor(JSBI, f2)

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = z25519.negate(factor2!.coeffs[0])

// now if we evaluate f at root, we get zero
const shouldBeZero = f2.eval(root)
expect(shouldBeZero.toString()).toEqual('0')
```

### Interpolation

Given a set of N + 1 pairs (x_i, y_i), we can construct the unique polynomial of degree less than or equal to N
such that for all i in [0,...,N], f(x_i) = y_i.

```typescript
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
```

## About JSBI

This library would be faster on your development machine or in a browser if it used the Javascript native `bigint`.
If you are working on a platform that supports `bigint` you should use the
[native bigint wrapper, `BigIntIntegers`](https://github.com/privacyresearchgroup/ffpoly-ts/blob/main/src/bigint-integers.ts)
as shown in the first examples.

Unfortunately, as of September 2021, `bigint` is not available in React Native applications.
[JSBI](https://github.com/GoogleChromeLabs/jsbi) is a slower but
viable substitute and works fine on platforms where `bigint` is not available. Of course for your application you may have other
needs and want to use a different integer library. If so, either:

- Implement the [`BigIntType` and `Integers` interfaces](https://github.com/privacyresearchgroup/ffpoly-ts/blob/main/src/integers.ts) for your integer type. (See the [native bigint wrapper for an example](https://github.com/privacyresearchgroup/ffpoly-ts/blob/main/src/bigint-integers.ts))
- Or, if you want to implement and optimize your field operations directly, implement the interfaces in
  [algebra-types](https://github.com/privacyresearchgroup/ffpoly-ts/blob/main/src/algebra-types.ts) as seen in [generic-int-algebra.ts](https://github.com/privacyresearchgroup/ffpoly-ts/blob/main/src/generic-int-algebra.ts)
  and the rest of the polynomial library can be used unchanged. The polynomial classes and functions are generic and designed for
  use with different integer libraries.

## License

Copyright 2021 by Privacy Research, LLC

Licensed under the GPLv3: http://www.gnu.org/licenses/gpl-3.0.html
