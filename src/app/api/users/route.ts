import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const privyId = searchParams.get('privyId');
    const walletAddress = searchParams.get('walletAddress');

    if (!privyId && !walletAddress) {
      return NextResponse.json(
        { error: 'Either privyId or walletAddress is required' },
        { status: 400 }
      );
    }

    let user;

    if (privyId) {
      user = await prisma.user.findUnique({
        where: { privyId },
        include: {
          wallets: true,
          devices: {
            include: {
              sensors: true,
              location: true,
            }
          },
          rewardLedger: true,
          rewardClaims: true,
        },
      });
    } else if (walletAddress) {
      const wallet = await prisma.wallet.findUnique({
        where: { publicKey: walletAddress },
        include: {
          user: {
            include: {
              wallets: true,
              devices: {
                include: {
                  sensors: true,
                  location: true,
                }
              },
              rewardLedger: true,
              rewardClaims: true,
            }
          }
        }
      });
      user = wallet?.user;
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { privyId, walletAddress, email, name, privyUserData } = body;

    if (!privyId) {
      return NextResponse.json(
        { error: 'privyId is required' },
        { status: 400 }
      );
    }

    let existingUser = await prisma.user.findUnique({
      where: { privyId },
      include: { wallets: true }
    });

    if (existingUser) {
      const updatedUser = await prisma.user.update({
        where: { privyId },
        data: {
          email: email || existingUser.email,
          name: name || existingUser.name,
          meta: privyUserData || existingUser.meta,
        },
        include: {
          wallets: true,
          devices: {
            include: {
              sensors: true,
              location: true,
            }
          },
        }
      });

      if (walletAddress) {
        const existingWallet = existingUser.wallets.find(
          wallet => wallet.publicKey === walletAddress
        );

        if (!existingWallet) {
          await prisma.wallet.create({
            data: {
              userId: existingUser.id,
              publicKey: walletAddress,
              provider: 'Privy',
              meta: { linkedAt: new Date() }
            }
          });
        }
      }

      return NextResponse.json(updatedUser, { status: 200 });
    }

    const newUser = await prisma.user.create({
      data: {
        privyId,
        email: email || '',
        name: name || null,
        meta: privyUserData || {},
        wallets: walletAddress ? {
          create: {
            publicKey: walletAddress,
            provider: 'Privy',
            meta: { linkedAt: new Date() }
          }
        } : undefined
      },
      include: {
        wallets: true,
        devices: {
          include: {
            sensors: true,
            location: true,
          }
        },
      }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
 }