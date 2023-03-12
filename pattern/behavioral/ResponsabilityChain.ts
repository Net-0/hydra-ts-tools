import { Class } from "../../types"

type Key = string | number | symbol
type ChainClass<K extends Key, ARGS extends any[]> = new() => Record<K, (...args: ARGS) => ARGS | undefined>
type ATMClass<K extends Key, ARGS extends any[]> = new() => Record<K, (...args: ARGS) => void>

const CHAIN_OBJECTS = new WeakMap<Object, any[]>

export default function ResponsabilityChain<K extends Key, A extends any[]>(key: K, ...clazzChain: ChainClass<K, A>[]) {
    return function(clazz: ATMClass<K, A>) {

        clazz.prototype[key] = function(...args) {
            for (const obj of CHAIN_OBJECTS.get(this)) {
                args = obj[key](...args)
                if (!args) break
            }
        }

        const handler: ProxyHandler<ATMClass<K, A>> = {
            construct(_clazz: Class, args) {
                const obj = new _clazz(...args) as any
                
                CHAIN_OBJECTS.set(obj, clazzChain.map(c => new c()))
                delete obj[key]

                return obj
            }
        }
        
        return new Proxy(clazz, handler)
    }
}









// class Coin50Dispenser {
//     dispense(totalCoins: number): [totalCoins: number] | undefined {
//         const count = Math.floor(totalCoins/50)
//         console.log(`Dispensed ${count} coins of 50`)
//         totalCoins %= 50
//         if (totalCoins != 0) return [totalCoins]
//     }
// }

// class Coin25Dispenser {
//     dispense(totalCoins: number): [totalCoins: number] | undefined {
//         const count = Math.floor(totalCoins/25)
//         console.log(`Dispensed ${count} coins of 25`)
//         totalCoins %= 25
//         if (totalCoins != 0) return [totalCoins]
//     }
// }

// class Coin10Dispenser {
//     dispense(totalCoins: number): [totalCoins: number] | undefined {
//         const count = Math.floor(totalCoins/10)
//         console.log(`Dispensed ${count} coins of 10`)
//         totalCoins %= 10
//         if (totalCoins != 0) return [totalCoins]
//     }
// }

// class Coin5Dispenser {
//     dispense(totalCoins: number): [totalCoins: number] | undefined {
//         const count = Math.floor(totalCoins/5)
//         console.log(`Dispensed ${count} coins of 5`)
//         totalCoins %= 5
//         return
//         // if (totalCoins != 0) return [totalCoins]
//     }
// }

// @ResponsabilityChain('dispense', Coin50Dispenser, Coin25Dispenser, Coin10Dispenser, Coin5Dispenser)
// class CoinDispenser {
//     dispense: (totalCoins: number) => void
// }


// // CoinDispenser
// new CoinDispenser().dispense(143)