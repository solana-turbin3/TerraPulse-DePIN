'use client'
import { useCluster } from '@/components/cluster/cluster-data-access'
import { useAnchorProvider } from '@/components/solana/solana-provider'
import { claimRewards, initializeConfig, initializeUserAccount, updateTemp } from '@/components/terrapulse/data-access'
import { getTerraPulseProgram, getTerraPulseProgramId } from '@project/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Cluster, PublicKey } from '@solana/web3.js'
import React from 'react'

const Page = () => {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const wallet = useWallet()
  const provider = useAnchorProvider()
  const programId = getTerraPulseProgramId(cluster.network as Cluster)
  const program = getTerraPulseProgram(provider, programId)

  return (
    <div className="flex h-screen w-screen justify-center items-center">
      <button
        className="p-4 bg-blue-500 text-white rounded-full"
        onClick={() => {
          claimRewards(program, wallet.publicKey!)
        }}
      >
        Claim
      </button>
    </div>
  )
}

export default Page
