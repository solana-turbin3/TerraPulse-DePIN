'use client'
import { claimRewards, getMainConfig, getUserRewardPoints } from '@/components/terrapulse/data-access'
import { Button } from '@/components/ui/button'
import { usePrivy } from '@privy-io/react-auth'
import { useWallets } from '@privy-io/react-auth/solana'
import { PublicKey } from '@solana/web3.js'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import PointsDisplay from '@/components/terrapulse/points-display'

const Page = () => {
  const { wallets } = useWallets()
  const { user, logout } = usePrivy()
  const wallet = wallets[0]
  const router = useRouter()
  const [userPoints, setUserPoints] = useState<any>(null)
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [mounted, setMounted] = useState<boolean>(false)

  console.log(wallet)

  useEffect(() => {
    if (!user) {
      router.replace('/')
    }
  }, [user])

  async function userPointsSet() {
    try {
      setLoading(true)
      const configData = await getMainConfig()
      setConfig(configData)
      const data = await getUserRewardPoints(new PublicKey(wallet.address))
      setUserPoints(data)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    if (user && wallet) {
      userPointsSet()
    }
  }, [user, wallet])

  useEffect(() => {
    // mark mounted so we only render client-only UI after hydration
    setMounted(true)
  }, [])

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
      <div className="flex flex-col h-screen w-full justify-center items-center space-y-6">
        {mounted ? (
          <PointsDisplay points={userPoints} loading={loading} config={config} />
        ) : (
          <div className="w-full max-w-md p-6 bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-md">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        )}

        <Button
          onClick={async () => {
            await claimRewards(wallet)
            await userPointsSet()
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
