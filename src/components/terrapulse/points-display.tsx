'use client'
import React from 'react'

interface UserPoints {
  user: string
  tempPoints: number
  noisePoints: number
  vibrationPoints: number
  heatPoints: number
  bump: number
}

interface Config {
  rewardTemp: number
  rewardNoise: number
  rewardVibration: number
  rewardHeat: number
}

interface Props {
  points: UserPoints | null
  loading?: boolean
  config?: Config | null
}

export default function PointsDisplay({ points, loading = false, config }: Props) {
  if (loading) {
    return (
      <div className="w-full max-w-md p-6 bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-md">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    )
  }

  if (!points) {
    return (
      <div className="w-full max-w-md p-6 bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-md flex items-center justify-center">
        <div className="text-sm text-gray-600 dark:text-gray-300">No points data available.</div>
      </div>
    )
  }

  const { user, tempPoints, noisePoints, vibrationPoints, heatPoints, bump } = points

  // Ensure we have a string to slice for display (some backends return objects like PublicKey)
  const userIdString =
    typeof user === 'string'
      ? user
      : user && typeof (user as any).toString === 'function'
        ? (user as any).toString()
        : String(user)

  // Coerce point values to numbers (fallback to 0)
  const tp = Number(tempPoints) || 0
  const np = Number(noisePoints) || 0
  const vp = Number(vibrationPoints) || 0
  const hp = Number(heatPoints) || 0
  const bp = Number(bump) || 0

  // If config is provided, multiply each by its reward value
  let weightedTotal = null
  let weightedBreakdown: { label: string; value: number; reward: number; total: number }[] = []
  if (config) {
    const temp = tp * (config.rewardTemp || 0)
    const noise = np * (config.rewardNoise || 0)
    const vibration = vp * (config.rewardVibration || 0)
    const heat = hp * (config.rewardHeat || 0)
    weightedTotal = temp + noise + vibration + heat
    weightedBreakdown = [
      { label: 'Temperature', value: tp, reward: config.rewardTemp, total: temp },
      { label: 'Noise', value: np, reward: config.rewardNoise, total: noise },
      { label: 'Vibration', value: vp, reward: config.rewardVibration, total: vibration },
      { label: 'Heat', value: hp, reward: config.rewardHeat, total: heat },
    ]
  }

  return (
    <div className="w-full max-w-md p-6 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">User Points</h3>
        <div className="text-sm text-gray-600 dark:text-gray-300">ID: {userIdString.slice(0, 8)}...</div>
      </div>

      <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
        {config && weightedBreakdown.length > 0 ? (
          weightedBreakdown.map((item) => (
            <li className="flex justify-between" key={item.label}>
              <span>{item.label}</span>
              <span className="font-medium">
                {item.value} × {item.reward} = <span className="text-green-700 dark:text-green-300">{item.total}</span>
              </span>
            </li>
          ))
        ) : (
          <>
            <li className="flex justify-between">
              <span>Temperature</span>
              <span className="font-medium">{tp}</span>
            </li>
            <li className="flex justify-between">
              <span>Noise</span>
              <span className="font-medium">{np}</span>
            </li>
            <li className="flex justify-between">
              <span>Vibration</span>
              <span className="font-medium">{vp}</span>
            </li>
            <li className="flex justify-between">
              <span>Heat</span>
              <span className="font-medium">{hp}</span>
            </li>
          </>
        )}
      </ul>

      <div className="mt-4 border-t pt-3 flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-300">Total</div>
        <div className="text-xl font-bold text-green-700 dark:text-green-300">
          {config && weightedTotal !== null ? weightedTotal : tp + np + vp + hp}
        </div>
      </div>
    </div>
  )
}
