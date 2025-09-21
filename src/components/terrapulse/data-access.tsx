'use client'

import { Terrapulse } from '@project/anchor'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Program, web3 } from '@coral-xyz/anchor'

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

export async function claimRewards(program: Program<Terrapulse>, user: PublicKey) {
  const userConfig = web3.PublicKey.findProgramAddressSync([Buffer.from('user'), user.toBuffer()], program.programId)[0]
  const config = web3.PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId)[0]
  const rewardsMint = web3.PublicKey.findProgramAddressSync([Buffer.from('rewards')], program.programId)[0]

  await program.methods
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
    .rpc()

  const ac = await program.account.userConfig.fetch(userConfig)
  console.log(ac)
}
