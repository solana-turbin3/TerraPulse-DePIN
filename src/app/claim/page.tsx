'use client'
import { claimRewards } from '@/components/terrapulse/data-access'
import { useWallets } from '@privy-io/react-auth/solana'
import React from 'react'

const Page = () => {
  const { wallets } = useWallets()
  const wallet = wallets[0]

  return (
    <div className="flex h-screen w-screen justify-center items-center">
      <button
        className="p-4 bg-blue-500 text-white rounded-full"
        onClick={() => {
          claimRewards(wallet)
        }}
      >
        Claim
      </button>
    </div>
  )
}

export default Page
