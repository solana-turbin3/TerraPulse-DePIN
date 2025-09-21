// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import TerraPulseIDL from '../target/idl/terrapulse.json'
import type { Terrapulse } from '../target/types/terrapulse'

// Re-export the generated IDL and type
export { TerraPulseIDL, Terrapulse }

// The programId is imported from the program IDL.
export const TERRA_PULSE_PROGRAM_ID = new PublicKey(TerraPulseIDL.address)

// This is a helper function to get the Counter Anchor program.
export function getTerraPulseProgram(provider: AnchorProvider, address?: PublicKey): Program<Terrapulse> {
  return new Program(
    { ...TerraPulseIDL, address: address ? address.toBase58() : TerraPulseIDL.address } as Terrapulse,
    provider,
  )
}

// This is a helper function to get the program ID for the Counter program depending on the cluster.
export function getTerraPulseProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Counter program on devnet and testnet.
      return new PublicKey('EeLVcxJ4sG9Gj5bqsKbUG25KMsGrLSWcauKQwBUpCWRh')
    case 'mainnet-beta':
    default:
      return TERRA_PULSE_PROGRAM_ID
  }
}
