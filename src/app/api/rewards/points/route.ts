import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const deviceId = searchParams.get('deviceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const where: any = { userId };
    
    if (deviceId) where.deviceId = deviceId;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const pointsLedger = await prisma.pointsLedger.findMany({
      where,
      include: {
        device: {
          select: {
            id: true,
            name: true,
            deviceId: true,
          }
        },
        reading: {
          select: {
            id: true,
            sensorType: true,
            value: true,
            recordedAt: true,
            qualityScore: true
          }
        }
      },
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: 'desc'
      }
    });

    const summary = await prisma.pointsLedger.aggregate({
      where,
      _sum: {
        points: true
      },
      _count: {
        _all: true
      }
    });

    const pointsByReason = await prisma.pointsLedger.groupBy({
      by: ['reason'],
      where,
      _sum: {
        points: true
      },
      _count: {
        _all: true
      }
    });

    return NextResponse.json({
      pointsLedger,
      summary: {
        totalPoints: summary._sum.points || 0,
        totalEntries: summary._count._all,
        breakdown: pointsByReason
      },
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < summary._count._all
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching points ledger:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, deviceId, points, reason, meta } = body;

    if (!userId || !points || !reason) {
      return NextResponse.json(
        { error: 'userId, points, and reason are required' },
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
    
    if (deviceId) {
      const device = await prisma.device.findUnique({
        where: { id: deviceId }
      });

      if (!device) {
        return NextResponse.json(
          { error: 'Device not found' },
          { status: 404 }
        );
      }
    }

    const pointsEntry = await prisma.pointsLedger.create({
      data: {
        userId,
        deviceId,
        points,
        reason,
        meta: meta || {}
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        device: {
          select: {
            id: true,
            name: true,
            deviceId: true
          }
        }
      }
    });

    return NextResponse.json(pointsEntry, { status: 201 });

  } catch (error) {
    console.error('Error awarding points:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}