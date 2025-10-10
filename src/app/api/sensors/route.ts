import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const sensorType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    
    if (deviceId) {
      where.deviceId = deviceId;
    }
    
    if (sensorType) {
      where.type = sensorType;
    }

    const sensors = await prisma.sensor.findMany({
      where,
      include: {
        device: {
          select: {
            id: true,
            name: true,
            deviceId: true,
            status: true,
            location: {
              select: {
                id: true,
                name: true,
                latitude: true,
                longitude: true,
                country: true,
                region: true,
              }
            }
          }
        }
      },
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: 'desc'
      }
    });

    const total = await prisma.sensor.count({ where });

    return NextResponse.json({
      sensors,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching sensors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, type, label, unit, sampleRate, meta } = body;

    if (!deviceId || !type) {
      return NextResponse.json(
        { error: 'deviceId and type are required' },
        { status: 400 }
      );
    }

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: { owner: true }
    });

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    const existingSensor = await prisma.sensor.findFirst({
      where: {
        deviceId,
        type
      }
    });

    if (existingSensor) {
      return NextResponse.json(
        { error: 'Sensor of this type already exists for this device' },
        { status: 409 }
      );
    }

    const sensor = await prisma.sensor.create({
      data: {
        deviceId,
        type,
        label,
        unit,
        sampleRate,
        meta: meta || {}
      },
      include: {
        device: {
          select: {
            id: true,
            name: true,
            deviceId: true,
            status: true,
          }
        }
      }
    });

    return NextResponse.json(sensor, { status: 201 });

  } catch (error) {
    console.error('Error creating sensor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}