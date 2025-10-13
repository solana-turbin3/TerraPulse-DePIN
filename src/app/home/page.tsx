'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePrivy } from '@privy-io/react-auth'
import { Award, Globe, MapPin, Network, Shield, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'

const HomePage = () => {
  const { logout, user } = usePrivy()
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

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Welcome to TerraPulse
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Hello, {user?.email?.address || user?.wallet?.address?.slice(0, 8) + '...'}! Ready to contribute to the
            decentralized environmental network?
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
          {/* Register Device Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-300 dark:hover:border-blue-600">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-blue-100 dark:bg-blue-900 rounded-full w-fit">
                <Network className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-xl text-blue-600 dark:text-blue-400">Register Your Device</CardTitle>
              <CardDescription>
                Apply to receive a TerraPulse device and start contributing to the network
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={() => router.push('/register')}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                size="lg"
              >
                Apply for Device
              </Button>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>Location-based deployment</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Shield className="w-4 h-4" />
                  <span>Secure & verified process</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Claim Rewards Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-green-300 dark:hover:border-green-600">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-green-100 dark:bg-green-900 rounded-full w-fit">
                <Award className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-xl text-green-600 dark:text-green-400">Claim Rewards</CardTitle>
              <CardDescription>Collect your earned tokens for contributing to the TerraPulse network</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={() => router.push('/claim')}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                size="lg"
              >
                Claim Rewards
              </Button>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Zap className="w-4 h-4" />
                  <span>Instant token rewards</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Shield className="w-4 h-4" />
                  <span>Secure Solana transactions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Network Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">1,250+</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Active Devices</div>
          </div>
          <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">89</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Countries</div>
          </div>
          <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">24/7</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Monitoring</div>
          </div>
          <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">99.8%</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Uptime</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
