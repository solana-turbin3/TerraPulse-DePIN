'use client'
import { claimRewards } from '@/components/terrapulse/data-access'
import { Button } from '@/components/ui/button'
import { usePrivy } from '@privy-io/react-auth'
import { useWallets } from '@privy-io/react-auth/solana'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'

const Page = () => {
  const { wallets } = useWallets()
  const { user, logout } = usePrivy()
  const wallet = wallets[0]
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.replace('/')
    }
  }, [user])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      {/* Logout Button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          onClick={logout}
          variant="outline"
          size="sm"
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800"
        >
          Logout
        </Button>
      </div>
      <div className="flex flex-col h-screen w-full justify-center items-center">
        <Button
          onClick={() => {
            claimRewards(wallet)
          }}
          variant="outline"
          size="sm"
          className="bg-green-800/90 p-6 rounded-full text-white dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800"
        >
          Claim Rewards
        </Button>
      </div>
    </div>
  )
}

export default Page
