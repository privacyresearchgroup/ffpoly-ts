import { ZpField } from '../generic-int-algebra'
import * as inthelper from '../generic-int-helper'

import JSBI from 'jsbi'
import { extendIntegers } from '..'

const XJSBI = extendIntegers(JSBI)
const serializer = new inthelper.SerializationHelpers(JSBI)

describe('Test JSBI implementation of modular arithmetic', () => {
    const p25519 = JSBI.BigInt('57896044618658097711785492504343953926634992332820282019728792003956564819949')
    const p25519m1 = JSBI.BigInt('57896044618658097711785492504343953926634992332820282019728792003956564819948')
    const p25519m1d2 = JSBI.divide(p25519m1, JSBI.BigInt(2))

    test('README snippets', () => {
        // create our field, Z_31
        const z31 = new ZpField<JSBI>(JSBI, 31)

        // create some field elements
        const four = z31.fromNumber(4)
        const eight = z31.fromNumber(8)
        let random = z31.randomElement()
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
    })

    test('readme snippets 2', () => {
        const XJSBI = extendIntegers(JSBI)
        // x*a + y*b = gcd
        const { gcd, x, y } = XJSBI.xgcd(JSBI.BigInt(7), JSBI.BigInt(5))
        // gcd == 1, x == -2, y == 3
        expect(JSBI.toNumber(gcd)).toEqual(1)
        expect(JSBI.toNumber(x)).toEqual(-2)
        expect(JSBI.toNumber(y)).toEqual(3)

        const A = XJSBI.powerMod(JSBI.BigInt(2), p25519m1d2, p25519)
        const B = XJSBI.powerMod(JSBI.BigInt(3), JSBI.BigInt(15), JSBI.BigInt(31))

        expect(A.toString()).toEqual(p25519m1.toString())
        expect(B.toString()).toEqual('30')
    })

    test('ZpField constructor', () => {
        const z17 = new ZpField<JSBI>(JSBI, '17')
        expect(z17.characteristic.toString()).toEqual('17')

        const z19 = new ZpField<JSBI>(JSBI, 19)
        expect(z19.characteristic.toString()).toEqual('19')
    })

    test('integer serialization', () => {
        const n2 = JSBI.BigInt('1976943448883713') // 1n + 2n * 2n ** 8n + 3n * 2n ** 16n + 4n * 2n ** 24n + 5n * 2n ** 32n + 6n * 2n ** 40n + 7n * 2n ** 48n

        const expectedBytes = [1, 2, 3, 4, 5, 6, 7, 0]
        expect(serializer.toLittleEndian(n2)).toEqual(new Uint8Array(expectedBytes))

        const m707 = JSBI.BigInt(-707)
        const m707bytes = serializer.toLittleEndian(m707)
        const m707bytesReversed = serializer.toBigEndian(m707)
        const m707FromBE = serializer.fromBigEndian(m707bytesReversed)
        const m707FromLE = serializer.fromLittleEndian(m707bytes)
        console.log({ m707bytes, m707bytesReversed })
        expect(JSBI.equal(m707FromBE, m707)).toBeTruthy()
        expect(JSBI.equal(m707FromLE, m707)).toBeTruthy()
    })
    test('Modular addition', () => {
        const modulus = JSBI.BigInt(101)
        const zn = new ZpField<JSBI>(JSBI, modulus)

        const a = zn.fromNumber(91)
        const b = zn.fromNumber(13)
        const result = zn.add(a, b)

        expect(result.toString()).toEqual(JSBI.BigInt(3).toString())
    })

    test('Modular subtraction', () => {
        const modulus = JSBI.BigInt(101)
        const zn = new ZpField<JSBI>(JSBI, modulus)

        const a = zn.fromNumber(91)
        const b = zn.fromNumber(13)
        const result = zn.subtract(b, a)

        expect(result.toString()).toEqual(JSBI.BigInt(23).toString())
    })
    test('Modular negation', () => {
        const modulus = JSBI.BigInt(101)
        const zn = new ZpField<JSBI>(JSBI, modulus)

        const a = zn.fromNumber(91)
        const result = zn.negate(a)
        expect(result).toEqual(JSBI.BigInt(10))
    })

    test('Modular multiplication', () => {
        const modulus = JSBI.BigInt(101)
        const zn = new ZpField<JSBI>(JSBI, modulus)

        const a = zn.fromNumber(91)
        const b = zn.fromNumber(13)
        const result = zn.multiply(a, b)
        expect(result.toString()).toEqual(JSBI.BigInt(72).toString())
    })

    test('Modular inverse', () => {
        const modulus = JSBI.BigInt(17)
        const zn = new ZpField<JSBI>(JSBI, modulus)
        const expected = [1, 9, 6, 13, 7, 3, 5, 15, 2, 12, 14, 10, 4, 11, 8, 16].map(JSBI.BigInt)

        for (let i = 1; JSBI.LT(i, modulus); ++i) {
            const a = JSBI.BigInt(i)
            const inv = zn.invert(a)
            expect(inv.toString()).toEqual(expected[i - 1].toString())
        }
    })

    test('Modular divide', () => {
        const zp = new ZpField<JSBI>(JSBI, p25519)

        const a = zp.fromNumber('37896044618658097711785492504343953926634992332820282019728792003956564819949')
        const b = zp.fromNumber('27896044618658097711785492504343953926634992332820282019728792003956564819949')
        const ab = zp.multiply(a, b)
        const shouldBeA = zp.divide(ab, b)
        expect(shouldBeA.toString()).toEqual(a.toString())
    })
    test('modular exponentiation', () => {
        const p = p25519
        const one = JSBI.BigInt(1)
        const minusOne = p25519m1
        const zp = new ZpField<JSBI>(JSBI, p)

        const b2 = zp.fromNumber(2)
        const b3 = zp.fromNumber(3)
        const b5 = zp.fromNumber(5)

        const s = JSBI.divide(p25519m1, JSBI.BigInt(2))
        const result1 = zp.exponentiate(b2, s)
        const result2 = zp.exponentiate(b3, s)
        const result3 = zp.exponentiate(b5, s)

        console.log({ r1: result1.toString(), r2: result2.toString(), r3: result3.toString() })
        expect([one, minusOne]).toContainEqual(result1)
        expect([one, minusOne]).toContainEqual(result2)
        expect([one, minusOne]).toContainEqual(result3)
    })

    test('gcd', () => {
        const seven = XJSBI.xgcd(
            JSBI.multiply(JSBI.BigInt(7), p25519),
            JSBI.multiply(
                JSBI.BigInt(7),
                JSBI.BigInt('92298539445058780156311400358427006136490327688468392976721825472309537485619')
            )
        )

        const seven2 = XJSBI.xgcd(JSBI.BigInt(-707), JSBI.BigInt(1001))
        console.log('seven: ', seven)
        console.log('seven2: ', seven2)

        const integerCombo = JSBI.add(
            JSBI.multiply(seven.x, JSBI.multiply(JSBI.BigInt(7), p25519)),
            JSBI.multiply(
                seven.y,
                JSBI.multiply(
                    JSBI.BigInt(7),
                    JSBI.BigInt('92298539445058780156311400358427006136490327688468392976721825472309537485619')
                )
            )
        )
        console.log(integerCombo)

        expect(seven.gcd.toString()).toEqual(JSBI.BigInt(7).toString())
        expect(seven2.gcd.toString()).toEqual(JSBI.BigInt(7).toString())

        expect(integerCombo).toEqual(seven.gcd)

        // console.log(xgcd(0n, 100n))
        // console.log(xgcd(1000n, 0n))
        expect(XJSBI.xgcd(JSBI.BigInt(0), JSBI.BigInt(100)).gcd.toString()).toEqual(JSBI.BigInt(100).toString())
        expect(XJSBI.xgcd(JSBI.BigInt(0), JSBI.BigInt(0)).gcd.toString()).toEqual(JSBI.BigInt(0).toString())
    })

    // COMMENTING OUT DOMAIN RESTRICTION TESTS.
    // DOMAINS ARE NOT RESTRICTED AT THIS TIME.
    // test('domain restrictions', () => {
    //     const two37 = z37.fromNumber(2)
    //     const two31 = z31.fromNumber(2)
    //     const three37 = z37.fromNumber(3)
    //     const three31 = z31.fromNumber(3)

    //     expect(() => two37.copyFrom(two31)).toThrow('Cannot copy elements from one ring to another')
    //     expect(() => z31.add(two37, three37)).toThrow('Can only add elements of this ring')
    //     expect(() => z31.add(two31, three37)).toThrow('Can only add elements of this ring')
    //     expect(() => z31.add(two37, three31)).toThrow('Can only add elements of this ring')

    //     expect(() => z31.subtract(two37, three37)).toThrow('Can only subtract elements of this ring')
    //     expect(() => z31.subtract(two31, three37)).toThrow('Can only subtract elements of this ring')
    //     expect(() => z31.subtract(two37, three31)).toThrow('Can only subtract elements of this ring')

    //     expect(() => z31.multiply(two37, three37)).toThrow('Can only multiply elements of this ring')
    //     expect(() => z31.multiply(two31, three37)).toThrow('Can only multiply elements of this ring')
    //     expect(() => z31.multiply(two37, three31)).toThrow('Can only multiply elements of this ring')

    //     expect(() => z31.exponentiate(two37, JSBI.BigInt(3))).toThrow('Can only exponentiate elements of this ring')

    //     expect(() => {
    //         z31.divide(three31, three31)
    //     }).toThrow()
    // })

    test('serialization', () => {
        const zp = new ZpField<JSBI>(XJSBI, p25519)

        //2^248 - 1
        const n1 = zp.fromNumber('452312848583266388373324160190187140051835877600158453279131187530910662655')

        const bs1 = serializer.toLittleEndian(n1)
        const n2 = zp.fromBytes(bs1)

        console.log(`SERIALIZED: `, { bs1 })

        expect(n1.toString()).toEqual(n2.toString())

        const n3 = JSBI.BigInt('1976943448883713') // 1n + 2n * 2n ** 8n + 3n * 2n ** 16n + 4n * 2n ** 24n + 5n * 2n ** 32n + 6n * 2n ** 40n + 7n * 2n ** 48n

        const expectedBytes = [1, 2, 3, 4, 5, 6, 7, 0]

        expect(serializer.toBigEndian(n3)).toEqual(new Uint8Array(expectedBytes.reverse()))
        const n4 = serializer.fromBigEndian(expectedBytes.reverse())
        // expect(n4).toBe(n3)
        console.log(n4, n3)
    })
})
