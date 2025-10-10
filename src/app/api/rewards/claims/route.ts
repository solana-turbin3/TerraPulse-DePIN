import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const claims = await prisma.rewardClaim.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        onChainTx: {
          select: {
            id: true,
            txSignature: true,
            network: true,
            status: true,
            confirmedAt: true
          }
        }
      },
      take: limit,
      skip: offset,
      orderBy: {
        requestedAt: 'desc'
      }
    });

    const total = await prisma.rewardClaim.count({ where });

    const stats = await prisma.rewardClaim.aggregate({
      where,
      _sum: {
        pointsSpent: true,
        tokensIssued: true
      },
      _count: {
        _all: true
      }
    });

    return NextResponse.json({
      claims,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      stats: {
        totalPointsSpent: stats._sum.pointsSpent || 0,
        totalTokensIssued: stats._sum.tokensIssued || 0,
        totalClaims: stats._count._all
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching reward claims:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, pointsSpent, tokensRequested, note } = body;

    if (!userId || !pointsSpent) {
      return NextResponse.json(
        { error: 'userId and pointsSpent are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const pointsSummary = await prisma.pointsLedger.aggregate({
      where: { userId },
      _sum: {
        points: true
      }
    });

    const availablePoints = pointsSummary._sum.points || 0;

    const spentSummary = await prisma.rewardClaim.aggregate({
      where: { 
        userId,
        status: {
          in: ['PENDING', 'PROCESSING', 'COMPLETED']
        }
      },
      _sum: {
        pointsSpent: true
      }
    });

    const spentPoints = spentSummary._sum.pointsSpent || 0;
    const remainingPoints = availablePoints - spentPoints;

    if (pointsSpent > remainingPoints) {
      return NextResponse.json(
        { 
          error: 'Insufficient points',
          available: remainingPoints,
          requested: pointsSpent
        },
        { status: 400 }
      );
    }

    const tokensToIssue = tokensRequested || (pointsSpent / 1000);

    const claim = await prisma.rewardClaim.create({
      data: {
        userId,
        pointsSpent,
        tokensIssued: tokensToIssue,
        status: 'PENDING',
        note: note || `Claim for ${pointsSpent} points`,
        meta: {
          conversionRate: 1000,
          requestedAt: new Date().toISOString()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(claim, { status: 201 });

  } catch (error) {
    console.error('Error creating reward claim:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}