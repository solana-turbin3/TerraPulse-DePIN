import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');
    const status = searchParams.get('status');
    const locationId = searchParams.get('locationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    
    if (ownerId) where.ownerId = ownerId;
    if (status) where.status = status;
    if (locationId) where.locationId = locationId;

    const devices = await prisma.device.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        wallet: {
          select: {
            id: true,
            publicKey: true,
            provider: true
          }
        },
        location: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            country: true,
            region: true
          }
        },
        sensors: {
          select: {
            id: true,
            type: true,
            label: true,
            unit: true,
            sampleRate: true
          }
        },
        _count: {
          select: {
            sensorReadings: true,
            PointsLedger: true
          }
        }
      },
      take: limit,
      skip: offset,
      orderBy: {
        lastSeenAt: 'desc'
      }
    });

    const total = await prisma.device.count({ where });

    const stats = await prisma.device.groupBy({
      by: ['status'],
      where,
      _count: {
        _all: true
      }
    });

    return NextResponse.json({
      devices,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      stats: {
        byStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = stat._count._all;
          return acc;
        }, {} as Record<string, number>),
        total
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      deviceId, 
      ownerId, 
      walletId, 
      publicKey,
      model, 
      firmwareVersion, 
      locationId,
      tags,
      meta 
    } = body;

    if (!deviceId || !ownerId) {
      return NextResponse.json(
        { error: 'deviceId and ownerId are required' },
        { status: 400 }
      );
    }

    const owner = await prisma.user.findUnique({
      where: { id: ownerId }
    });

    if (!owner) {
      return NextResponse.json(
        { error: 'Owner not found' },
        { status: 404 }
      );
    }

    if (walletId) {
      const wallet = await prisma.wallet.findUnique({
        where: { id: walletId }
      });

      if (!wallet || wallet.userId !== ownerId) {
        return NextResponse.json(
          { error: 'Wallet not found or does not belong to owner' },
          { status: 400 }
        );
      }
    }

    const existingDevice = await prisma.device.findUnique({
      where: { deviceId }
    });

    if (existingDevice) {
      return NextResponse.json(
        { error: 'Device with this ID already exists' },
        { status: 409 }
      );
    }

    if (locationId) {
      const location = await prisma.location.findUnique({
        where: { id: locationId }
      });

      if (!location) {
        return NextResponse.json(
          { error: 'Location not found' },
          { status: 404 }
        );
      }
    }

    const device = await prisma.device.create({
      data: {
        name,
        deviceId,
        ownerId,
        walletId,
        publicKey,
        status: 'PENDING',
        model,
        firmwareVersion,
        locationId,
        tags: tags || [],
        meta: meta || {},
        lastSeenAt: new Date()
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        wallet: {
          select: {
            id: true,
            publicKey: true,
            provider: true
          }
        },
        location: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            country: true,
            region: true
          }
        }
      }
    });

    return NextResponse.json(device, { status: 201 });

  } catch (error) {
    console.error('Error creating device:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}