import { http, createConfig } from 'wagmi'
import { defineChain } from 'viem'

export const arcTestnet = defineChain({
  id: 1116,
  name: 'Arc Testnet',
  nativeCurrency: { decimals: 6, name: 'USD Coin', symbol: 'USDC' },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
  testnet: true,
})

export const TODO_ABI = [] as const

export const TODO_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`

export const config = createConfig({
  chains: [arcTestnet],
  transports: { [arcTestnet.id]: http('https://rpc.testnet.arc.network') },
})
