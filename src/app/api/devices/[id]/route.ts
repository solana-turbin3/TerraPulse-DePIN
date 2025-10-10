import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deviceId = params.id;

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
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
            sampleRate: true,
            createdAt: true
          }
        },
        sensorReadings: {
          take: 10,
          orderBy: {
            recordedAt: 'desc'
          },
          select: {
            id: true,
            sensorType: true,
            value: true,
            valueUnit: true,
            qualityScore: true,
            recordedAt: true,
            validated: true
          }
        },
        PointsLedger: {
          take: 10,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            points: true,
            reason: true,
            createdAt: true
          }
        }
      }
    });

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    const stats = await prisma.sensorReading.aggregate({
      where: { deviceId },
      _count: {
        _all: true
      },
      _avg: {
        qualityScore: true
      }
    });

    const totalPoints = await prisma.pointsLedger.aggregate({
      where: { deviceId },
      _sum: {
        points: true
      }
    });

    return NextResponse.json({
      device,
      stats: {
        totalReadings: stats._count._all,
        averageQuality: stats._avg.qualityScore,
        totalPointsEarned: totalPoints._sum.points || 0
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching device:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deviceId = params.id;
    const body = await request.json();
    const { 
      name, 
      status, 
      model, 
      firmwareVersion, 
      locationId,
      tags,
      meta 
    } = body;

    const existingDevice = await prisma.device.findUnique({
      where: { id: deviceId }
    });

    if (!existingDevice) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
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

    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      data: {
        ...(name !== undefined && { name }),
        ...(status !== undefined && { status }),
        ...(model !== undefined && { model }),
        ...(firmwareVersion !== undefined && { firmwareVersion }),
        ...(locationId !== undefined && { locationId }),
        ...(tags !== undefined && { tags }),
        ...(meta !== undefined && { meta }),
        updatedAt: new Date()
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
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
            unit: true
          }
        }
      }
    });

    return NextResponse.json(updatedDevice, { status: 200 });

  } catch (error) {
    console.error('Error updating device:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}