import { extendIntegers } from '.'
import { Ring } from './algebra-types'
import { SerializationHelpers } from './generic-int-helper'

import { BigIntType, ExtendedIntegers, Integers } from './integers'

export class ZpField<BIT extends BigIntType> implements Ring<BIT, BIT> {
    private Ints: ExtendedIntegers<BIT>
    private _modulus: BIT
    private _zero: BIT
    private _one: BIT
    private _modulusBytes: Uint8Array
    private _serializer: SerializationHelpers<BIT>
    constructor(Ints: Integers<BIT>, modulus: string | number | BIT) {
        this.Ints = extendIntegers(Ints)
        if (typeof modulus === 'string' || typeof modulus == 'number') {
            this._modulus = Ints.BigInt(modulus)
        } else {
            this._modulus = modulus
        }
        this._zero = this.Ints.BigInt(0)
        this._one = this.Ints.BigInt(1)
        this._serializer = new SerializationHelpers(Ints)
        this._modulusBytes = this._serializer.toLittleEndian(this._modulus)
    }

    normalizeElement(e: BIT): BIT {
        e = this.Ints.remainder(e, this.modulus)
        if (this.Ints.LT(e, 0)) {
            return this.Ints.add(e, this.modulus)
        } else return e
    }

    get modulus(): BIT {
        return this._modulus
    }

    get modulusSizeBytes(): number {
        return this._modulusBytes.length
    }

    get characteristic(): BIT {
        return this._modulus
    }

    get indexOverPrimeField(): BIT {
        return this.Ints.BigInt(1)
    }

    equal(a: BIT, b: BIT): boolean {
        return this.Ints.equal(this.normalizeElement(a), this.normalizeElement(b))
    }
    add(a: BIT, b: BIT): BIT {
        return this.normalizeElement(this.Ints.add(a, b))
    }
    subtract(a: BIT, b: BIT): BIT {
        return this.normalizeElement(this.Ints.subtract(a, b)) //(an - bn) % this._modulus
    }
    negate(a: BIT): BIT {
        return this.normalizeElement(this.Ints.unaryMinus(a))
    }
    multiply(a: BIT, b: BIT): BIT {
        return this.normalizeElement(this.Ints.multiply(a, b)) // (an * bn) % this._modulus
    }
    // TODO: Implement this for real.
    exponentiate(base: BIT, power: BIT): BIT {
        const result = this.Ints.powerMod(base, power, this.modulus)
        return this.normalizeElement(result)
    }

    get zero(): BIT {
        return this._zero
    }
    get one(): BIT {
        return this._one
    }

    fromBytes(bytes: Uint8Array): BIT {
        return this.normalizeElement(this._serializer.fromLittleEndian(bytes))
    }
    fromNumber(n: number | string | BIT): BIT {
        n = typeof n === 'number' || typeof n === 'string' ? this.Ints.BigInt(n) : n
        return this.normalizeElement(n)
    }
    newElement(): BIT {
        return this.Ints.BigInt(0)
    }
    randomElement(): BIT {
        // TODO: real random number generator, uniform distribution
        const randomBytes = new Uint8Array(this.modulusSizeBytes)
        for (const i in randomBytes) {
            randomBytes[i] = Math.floor(Math.random() * 256)
        }
        return this.normalizeElement(this.fromBytes(randomBytes))
    }

    invert(a: BIT): BIT {
        const { x } = this.Ints.xgcd(a, this.modulus)
        return this.normalizeElement(x)
    }
    divide(a: BIT, b: BIT): BIT {
        const binv = this.invert(b)
        return this.normalizeElement(this.multiply(a, binv))
    }
}

// export function xgcd<BIT extends BigIntType>(Ints: Integers<BIT>, a: BIT, b: BIT): { gcd: BIT; x: BIT; y: BIT } {
//     let t: BIT
//     let q: BIT
//     let r: BIT
//     let x = Ints.BigInt(0)
//     let lastx = Ints.BigInt(1)
//     let y = Ints.BigInt(1)
//     let lasty = Ints.BigInt(0)

//     while (Ints.NE(b, 0)) {
//         q = Ints.divide(a, b) // a / b
//         r = Ints.subtract(a, Ints.multiply(q, b)) // a - q * b

//         t = x
//         x = Ints.subtract(lastx, Ints.multiply(q, x)) // lastx - q * x
//         lastx = t

//         t = y
//         y = Ints.subtract(lasty, Ints.multiply(q, y)) // lasty - q * y
//         lasty = t

//         a = b
//         b = r
//     }

//     return Ints.lessThan(a, Ints.BigInt(0))
//         ? { gcd: Ints.unaryMinus(a), x: Ints.unaryMinus(lastx), y: Ints.unaryMinus(lasty) }
//         : { gcd: a, x: a ? lastx : Ints.BigInt(0), y: lasty }
// }
