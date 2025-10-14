'use client'
import React, { useEffect, useState } from 'react'
import { useLogin, usePrivy } from '@privy-io/react-auth'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Globe, Zap, MapPin, Network } from 'lucide-react'
import { useRouter } from 'next/navigation'

const HomePage = () => {
  const { ready, authenticated, user, logout } = usePrivy()
  const { login } = useLogin()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function registerUser() {
    setIsLoading(true)
    const walletAddress = user?.wallet?.address
    const privyId = user?.wallet?.id
    //@ts-ignore
    const email = user?.linkedAccounts[0].email

    await fetch('/api/users', { method: 'POST', body: JSON.stringify({ privyId, walletAddress, email }) })
    setIsLoading(false)
    router.replace('/home')
  }

  useEffect(() => {
    if (user) {
      registerUser()
    }
  }, [user])

  // Show a loading overlay while registering the user or performing async actions
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 flex flex-col items-center gap-4 shadow-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
          <div className="text-lg font-medium text-gray-800 dark:text-gray-100">Setting up your account...</div>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // If user is not logged in, show landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-3 mb-6">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-full">
              <Globe className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              TerraPulse
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Join the world's largest decentralized physical infrastructure network for environmental monitoring. Earn
            rewards while contributing to global sustainability.
          </p>
          <Button
            onClick={login}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-8">
              <div className="mx-auto mb-4 p-4 bg-blue-100 dark:bg-blue-900 rounded-full w-fit">
                <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-blue-600 dark:text-blue-400">Earn Passive Income</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Generate consistent rewards by hosting TerraPulse devices and contributing environmental data to the
                network.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-8">
              <div className="mx-auto mb-4 p-4 bg-green-100 dark:bg-green-900 rounded-full w-fit">
                <MapPin className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-green-600 dark:text-green-400">Global Impact</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Help monitor air quality, climate data, and environmental changes across the globe in real-time.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-8">
              <div className="mx-auto mb-4 p-4 bg-purple-100 dark:bg-purple-900 rounded-full w-fit">
                <Network className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-purple-600 dark:text-purple-400">Decentralized Network</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Be part of a trustless, blockchain-powered infrastructure that ensures data integrity and transparency.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-200">Network Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">1,250+</div>
              <div className="text-gray-600 dark:text-gray-300">Active Devices</div>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">89</div>
              <div className="text-gray-600 dark:text-gray-300">Countries</div>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">24/7</div>
              <div className="text-gray-600 dark:text-gray-300">Monitoring</div>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">99.8%</div>
              <div className="text-gray-600 dark:text-gray-300">Uptime</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">Ready to Get Started?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of users contributing to environmental monitoring while earning rewards.
          </p>
          <Button
            onClick={login}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Connect Wallet & Start Earning
          </Button>
        </div>
      </div>
    </div>
  )
}

export default HomePage
