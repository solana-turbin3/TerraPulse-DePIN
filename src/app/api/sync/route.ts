import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import { Keypair, PublicKey, Connection, SystemProgram } from '@solana/web3.js'
import { web3, AnchorProvider } from '@coral-xyz/anchor'
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes'
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet'
import { getTerraPulseProgram } from '@project/anchor'

// Tiny contract: inputs: none. outputs: JSON summary of updates attempted.
// Behavior: For each user in DB, sums PointsLedger.points grouped by device/readings.sensorType
// and calls the Anchor program `updatePoints` instruction for each non-zero sensor bucket.

function loadAdminKeypair(): Keypair {
  // Prefer SECRET_KEY env (bs58) like other routes, fallback to anchor/target keypair json
  try {
    if (process.env.SECRET_KEY) {
      const secretKey = bs58.decode(process.env.SECRET_KEY)
      return Keypair.fromSecretKey(secretKey)
    }
  } catch (e) {
    // continue to fallback
  }

  const kpPath = path.resolve(process.cwd(), 'anchor/target/deploy/terrapulse-keypair.json')
  if (fs.existsSync(kpPath)) {
    const raw = fs.readFileSync(kpPath, 'utf8')
    const arr = JSON.parse(raw) as number[]
    return Keypair.fromSecretKey(Uint8Array.from(arr))
  }

  throw new Error('No admin keypair found (SECRET_KEY env or anchor/target/deploy/terrapulse-keypair.json)')
}

function buildProgram(connection: Connection, admin: Keypair) {
  // Mirror approach from users route: NodeWallet + AnchorProvider + getTerraPulseProgram
  const wallet = new NodeWallet(admin)
  const provider = new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' })
  const program = getTerraPulseProgram(provider)
  return program
}

export async function GET(request: NextRequest) {
  try {
    // load admin keypair and create anchor program client
    const admin = loadAdminKeypair()
    const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed')
    const program = buildProgram(connection, admin)

    // fetch wallets and map userId -> publicKey (take first wallet per user)
    const wallets = await prisma.wallet.findMany({ select: { userId: true, publicKey: true } })
    const userWalletMap = new Map<string, string>()
    for (const w of wallets) {
      if (!userWalletMap.has(w.userId)) userWalletMap.set(w.userId, w.publicKey)
    }

    const results: Array<{
      userId: string
      updates: Array<{ sensorType: string; points: number; status: string; error?: string }>
    }> = []

    for (const [userId, walletPub] of userWalletMap.entries()) {
      // aggregate points by reading.sensorType
      // Only aggregate points that have not been synced yet (synced = false)
      const rows = await prisma.$queryRaw`
          SELECT sr."sensorType" as sensor_type, SUM(pl.points) as total
          FROM "PointsLedger" pl
          LEFT JOIN "SensorReading" sr ON pl."readingId" = sr.id
          WHERE pl."userId" = ${userId} AND pl.synced = false
          GROUP BY sr."sensorType"
        `

      const updates: any[] = []

      for (const r of rows as any[]) {
        const sensorTypeRaw = r.sensor_type as string | null
        const total = Math.floor(Number(r.total) || 0)
        if (!sensorTypeRaw || total <= 0) continue

        // map from prisma enum to idl variant
        const map: Record<string, string> = {
          TEMPERATURE: 'temp',
          NOISE: 'noise',
          VIBRATION: 'vibration',
          HEAT: 'heat',
        }
        const variant = map[sensorTypeRaw] || null
        if (!variant) {
          updates.push({
            sensorType: sensorTypeRaw,
            points: total,
            status: 'skipped',
            error: 'unsupported sensor type',
          })
          continue
        }

        try {
          const sensorArg: any = {}
          sensorArg[variant] = {}

          const userPubKey = new PublicKey(walletPub)
          const userConfig = web3.PublicKey.findProgramAddressSync(
            [Buffer.from('user'), userPubKey.toBuffer()],
            program.programId,
          )[0]

          const ac = await program.account.userConfig.fetch(userConfig)

          await program.methods
            .updatePoints(sensorArg, total)
            .accountsPartial({
              admin: admin.publicKey,
              userConfig,
              systemProgram: SystemProgram.programId,
            })
            .signers([admin])
            .rpc()

          // Mark ledger rows as synced for this user & sensorType
          try {
            // Prefer the Prisma client for clarity and type-safety. Use a relation filter
            // to find PointsLedger rows whose reading has the matching sensorType.
            const res = await prisma.pointsLedger.updateMany({
              where: {
                userId: userId,
                synced: false,
                reading: {
                  sensorType: sensorTypeRaw as any,
                },
              },
              data: {
                synced: true,
              },
            })

            // If no rows were updated, still treat as success (maybe already synced)
            if (res.count === 0) {
              // fallback: try the raw SQL update (keeps previous behavior)
              await prisma.$executeRaw`
                UPDATE "PointsLedger" pl
                SET synced = true
                FROM "SensorReading" sr
                WHERE pl."readingId" = sr.id
                  AND pl."userId" = ${userId}
                  AND pl.synced = false
                  AND sr."sensorType" = ${sensorTypeRaw}
              `
            }
          } catch (uErr) {
            // if marking synced fails, still report success of on-chain update but include a note
            updates.push({
              sensorType: sensorTypeRaw,
              points: total,
              status: 'ok',
              error: `onchain_ok_but_mark_sync_failed: ${String(uErr)}`,
            })
            console.log('updated config', ac)
            continue
          }

          updates.push({ sensorType: sensorTypeRaw, points: total, status: 'ok' })
          console.log(ac)
        } catch (err: any) {
          updates.push({
            sensorType: sensorTypeRaw,
            points: total,
            status: 'error',
            error: String(err?.message || err),
          })
        }
      }

      results.push({ userId, updates })
    }

    return NextResponse.json({ results }, { status: 200 })
  } catch (error) {
    console.error('sync error', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
