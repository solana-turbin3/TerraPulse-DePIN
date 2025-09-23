'use client'

import { Terrapulse } from '@project/anchor'
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js'
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Program, web3 } from '@coral-xyz/anchor'
import { ConnectedStandardSolanaWallet } from '@privy-io/react-auth/solana'
import idl from '@/idl/terrapulse.json'

export async function initializeConfig(program: Program<Terrapulse>, admin: PublicKey) {
  await program.methods
    .initialize(2, 3, 4, 5)
    .accountsPartial({
      admin,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc()

  const config = web3.PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId)[0]
  const ac = await program.account.config.fetch(config)
  console.log(ac)
}

export async function initializeUserAccount(program: Program<Terrapulse>, admin: PublicKey, user: PublicKey) {
  await program.methods
    .initializeUser(user)
    .accountsPartial({
      admin,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  const userConfig = web3.PublicKey.findProgramAddressSync([Buffer.from('user'), user.toBuffer()], program.programId)[0]
  const ac = await program.account.userConfig.fetch(userConfig)
  console.log(ac)
}

export async function updateTemp(program: Program<Terrapulse>, admin: PublicKey, tempPoints: number, user: PublicKey) {
  const userConfig = web3.PublicKey.findProgramAddressSync([Buffer.from('user'), user.toBuffer()], program.programId)[0]
  await program.methods
    .updatePoints({ temp: {} }, tempPoints)
    .accountsPartial({
      admin,
      userConfig,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  const ac = await program.account.userConfig.fetch(userConfig)
  console.log(ac)
}

export async function claimRewards(wallet: ConnectedStandardSolanaWallet) {
  const connection = new Connection(
    'https://devnet.helius-rpc.com/?api-key=7892da07-aa8a-43a8-a607-5df2e9937be0',
    'confirmed',
  )
  const program = new Program(idl, {
    connection,
  })

  const user = new PublicKey(wallet.address)
  const userConfig = web3.PublicKey.findProgramAddressSync([Buffer.from('user'), user.toBuffer()], program.programId)[0]
  const config = web3.PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId)[0]
  const rewardsMint = web3.PublicKey.findProgramAddressSync([Buffer.from('rewards')], program.programId)[0]

  const instruction = await program.methods
    .claim()
    .accountsPartial({
      user,
      userConfig,
      config,
      rewardsMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction()

  const transaction = new Transaction()

  // 3. Reconstruct the instruction from the data received from backend
  const ix = new TransactionInstruction({
    programId: new PublicKey(instruction.programId.toString()),
    keys: instruction.keys.map((key) => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
    data: Buffer.from(instruction.data),
  })

  // 4. Add the instruction to the transaction
  transaction.add(ix)

  // 5. Get a recent blockhash to include in the transaction
  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = new PublicKey(wallet.address)

  const serializedTx = transaction.serialize({ requireAllSignatures: false, verifySignatures: false })

  try {
    await wallet.signAndSendTransaction({
      chain: 'solana:devnet',
      transaction: serializedTx,
    })
  } catch (error) {
    console.log(error)
  }

  // const ac = await program.account.userConfig.fetch(userConfig)
  // console.log(ac)
}
