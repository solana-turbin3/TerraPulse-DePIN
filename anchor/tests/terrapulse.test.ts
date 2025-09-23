import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Terrapulse } from '../target/types/terrapulse'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'

// Configure the client to use the local cluster.
anchor.setProvider(anchor.AnchorProvider.env())

const provider = anchor.getProvider() as anchor.AnchorProvider
const program = anchor.workspace.Terrapulse as Program<Terrapulse>
const connection = provider.connection

let rewardsMint: anchor.web3.PublicKey
let config: anchor.web3.PublicKey
let userConfig: anchor.web3.PublicKey

const admin = provider.wallet as anchor.Wallet
const user = anchor.web3.Keypair.generate()

async function commonSetup() {
  config = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId)[0]
  userConfig = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('user'), user.publicKey.toBuffer()],
    program.programId,
  )[0]

  rewardsMint = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from('rewards')], program.programId)[0]
  await connection.requestAirdrop(user.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
}

describe('Initialize config, Initialize user config, set temperature, set noise, claim reward', () => {
  beforeEach(async () => {
    await commonSetup()
  })

  it('initializes config', async () => {
    const tx = await program.methods
      .initialize(3, 5, 6, 7)
      .accountsPartial({
        admin: admin.publicKey,
        config,
        rewardsMint,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([admin.payer])
      .rpc()

    let configAccount = await program.account.config.fetch(config)
    expect(configAccount.rewardTemp).toEqual(3)
    expect(configAccount.rewardNoise).toEqual(5)
    expect(configAccount.rewardVibration).toEqual(6)
    expect(configAccount.rewardHeat).toEqual(7)
    console.log(configAccount)
  })

  it('initializes user-config', async () => {
    const tx = await program.methods
      .initializeUser(user.publicKey)
      .accountsPartial({
        admin: admin.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([admin.payer])
      .rpc()

    let userConfigAccount = await program.account.userConfig.fetch(userConfig)
    expect(userConfigAccount.tempPoints).toEqual(0)
    expect(userConfigAccount.noisePoints).toEqual(0)
    expect(userConfigAccount.vibrationPoints).toEqual(0)
    expect(userConfigAccount.heatPoints).toEqual(0)
  })

  it('update temp points', async () => {
    const tx = await program.methods
      .updatePoints({ temp: {} }, 3)
      .accountsPartial({
        admin: admin.publicKey,
        userConfig,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([admin.payer])
      .rpc()
    let userAccount = await program.account.userConfig.fetch(userConfig)

    expect(userAccount.tempPoints).toEqual(3)
    expect(userAccount.noisePoints).toEqual(0)
  })

  it('update noise points', async () => {
    const tx = await program.methods
      .updatePoints({ noise: {} }, 3)
      .accountsPartial({
        admin: admin.publicKey,
        userConfig,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([admin.payer])
      .rpc()
    let userAccount = await program.account.userConfig.fetch(userConfig)

    expect(userAccount.tempPoints).toEqual(3)
    expect(userAccount.noisePoints).toEqual(3)
  })

  it('update vibration points', async () => {
    const tx = await program.methods
      .updatePoints({ vibration: {} }, 3)
      .accountsPartial({
        admin: admin.publicKey,
        userConfig,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([admin.payer])
      .rpc()
    let userAccount = await program.account.userConfig.fetch(userConfig)

    expect(userAccount.tempPoints).toEqual(3)
    expect(userAccount.noisePoints).toEqual(3)
    expect(userAccount.vibrationPoints).toEqual(3)
  })

  it('update heat points', async () => {
    const tx = await program.methods
      .updatePoints({ heat: {} }, 3)
      .accountsPartial({
        admin: admin.publicKey,
        userConfig,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([admin.payer])
      .rpc()
    let userAccount = await program.account.userConfig.fetch(userConfig)

    expect(userAccount.tempPoints).toEqual(3)
    expect(userAccount.noisePoints).toEqual(3)
    expect(userAccount.vibrationPoints).toEqual(3)
    expect(userAccount.heatPoints).toEqual(3)
  })

  it('lets user claim the reward tokens, set user points to zero', async () => {
    let configAc = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId)[0]
    const rewardsAta = getAssociatedTokenAddressSync(rewardsMint, user.publicKey)
    const tx = await program.methods
      .claim()
      .accountsPartial({
        user: user.publicKey,
        config: configAc,
        userConfig,
        rewardsMint,
        rewardsAta,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc()

    const rewardsAccount = await getAccount(connection, rewardsAta)
    let userAccount = await program.account.userConfig.fetch(userConfig)
    expect(userAccount.tempPoints).toEqual(0)
    expect(userAccount.noisePoints).toEqual(0)
    expect(userAccount.vibrationPoints).toEqual(0)
    expect(userAccount.heatPoints).toEqual(0)
    expect(Number(rewardsAccount.amount.toString()) / 1000_000).toEqual(63)
  })
})
