import { BigIntType, Integers } from '.'

export class SerializationHelpers<BIT extends BigIntType> {
    constructor(private Ints: Integers<BIT>) {}

    fromLittleEndian(bytes: Uint8Array | number[]): BIT {
        const { Ints } = this
        let result = Ints.BigInt(0)
        let base = Ints.BigInt(1)
        const n256 = Ints.BigInt(256)
        const sign = bytes[bytes.length - 1]
        bytes.slice(0, bytes.length - 1).forEach(function (byte: number) {
            result = Ints.add(result, Ints.multiply(base, Ints.BigInt(byte)))
            base = Ints.multiply(n256, base)
        })
        if (sign === 255) {
            result = Ints.unaryMinus(result)
        }
        return result
    }
    fromBigEndian(bytes: Uint8Array | number[]): BIT {
        return this.fromLittleEndian(bytes.reverse())
    }

    toLittleEndian(bi: BIT): Uint8Array {
        const { Ints } = this
        const zero = Ints.BigInt(0)
        const n256 = Ints.BigInt(256)
        const result: number[] = []
        let i = 0
        const sign = Ints.GE(bi, 0) ? 0 : 255
        if (sign === 255) {
            bi = Ints.unaryMinus(bi)
        }
        while (Ints.GT(bi, zero)) {
            result[i] = Number(Ints.asUintN(8, bi))
            bi = Ints.divide(bi, n256)
            i += 1
        }
        result[i] = sign
        return new Uint8Array(result)
    }
    toBigEndian(bi: BIT): Uint8Array {
        return this.toLittleEndian(bi).reverse()
    }
}
