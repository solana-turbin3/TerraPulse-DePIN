import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function calculateQualityScore(sensorType: string, value: number, rawPayload: any): number {
  // basic quality score calculation 
  let score = 1.0;
  
  switch (sensorType) {
    case 'TEMPERATURE':
      if (value < -50 || value > 80) score -= 0.3; // celsius range
      break;
    case 'HUMIDITY':
      if (value < 0 || value > 100) score -= 0.5; // percentage range
      break;
    case 'CO2':
      if (value < 300 || value > 5000) score -= 0.3; // PPM range
      break;
    case 'NOISE':
      if (value < 0 || value > 140) score -= 0.3; // decibel range
      break;
  }
  
  if (!rawPayload.timestamp) score -= 0.2;
  if (!rawPayload.deviceSignature) score -= 0.1;
  
  return Math.max(0, Math.min(1, score));
}

async function calculateRewardPoints(
  sensorType: string, 
  qualityScore: number,
): Promise<number> {
  const rewardIndex = await prisma.rewardIndex.findFirst({
    where: { active: true },
    orderBy: { createdAt: 'desc' }
  });

  if (!rewardIndex) return 0;

  let points = rewardIndex.basePoints;
  
  points *= qualityScore;
  
  if (rewardIndex.sensorBoosts) {
    const boosts = rewardIndex.sensorBoosts as any;
    if (boosts[sensorType]) {
      points *= boosts[sensorType];
    }
  }
  
  if (rewardIndex.multiplierJson) {
    const multipliers = rewardIndex.multiplierJson as any;
    if (multipliers.dataQuality) {
      points *= multipliers.dataQuality * qualityScore;
    }
  }

  return Math.round(points * 100) / 100; // 2 decimal place
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const sensorType = searchParams.get('sensorType');
    const validated = searchParams.get('validated');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    
    if (deviceId) where.deviceId = deviceId;
    if (sensorType) where.sensorType = sensorType;
    if (validated !== null) where.validated = validated === 'true';
    
    if (startDate || endDate) {
      where.recordedAt = {};
      if (startDate) where.recordedAt.gte = new Date(startDate);
      if (endDate) where.recordedAt.lte = new Date(endDate);
    }

    const readings = await prisma.sensorReading.findMany({
      where,
      include: {
        device: {
          select: {
            id: true,
            name: true,
            deviceId: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            location: {
              select: {
                name: true,
                country: true,
                region: true
              }
            }
          }
        },
        pointsLedger: {
          select: {
            points: true,
            reason: true,
            createdAt: true
          }
        }
      },
      take: limit,
      skip: offset,
      orderBy: {
        recordedAt: 'desc'
      }
    });

    const total = await prisma.sensorReading.count({ where });
    
    const stats = await prisma.sensorReading.aggregate({
      where,
      _avg: {
        value: true,
        qualityScore: true
      },
      _count: {
        _all: true
      }
    });

    return NextResponse.json({
      readings,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      stats: {
        averageValue: stats._avg.value,
        averageQuality: stats._avg.qualityScore,
        totalReadings: stats._count._all
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching sensor readings:', error);
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
      deviceId, 
      sensorType, 
      sensorId, 
      rawPayload, 
      value, 
      valueUnit, 
      recordedAt,
      ipfsCid,
      onchainProof 
    } = body;

    if (!deviceId || !sensorType || !rawPayload) {
      return NextResponse.json(
        { error: 'deviceId, sensorType, and rawPayload are required' },
        { status: 400 }
      );
    }

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: { 
        owner: true,
        sensors: {
          where: { type: sensorType }
        }
      }
    });

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    if (device.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Device is not active' },
        { status: 400 }
      );
    }

    if (device.sensors.length === 0) {
      return NextResponse.json(
        { error: 'Sensor not found on device' },
        { status: 404 }
      );
    }

    const qualityScore = calculateQualityScore(sensorType, value, rawPayload);
    
    const reading = await prisma.sensorReading.create({
      data: {
        deviceId,
        sensorType,
        sensorId,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
        rawPayload,
        value,
        valueUnit,
        qualityScore,
        validated: qualityScore >= 0.7, 
        ipfsCid,
        onchainProof,
        processedAt: new Date()
      }
    });

    if (reading.validated && device.owner) {
      const points = await calculateRewardPoints(
        sensorType, 
        qualityScore, 
      );

      if (points > 0) {
        await prisma.pointsLedger.create({
          data: {
            userId: device.owner.id,
            deviceId,
            readingId: reading.id,
            points,
            reason: 'BASE_SUBMISSION'
          }
        });
      }
    }

    await prisma.device.update({
      where: { id: deviceId },
      data: { lastSeenAt: new Date() }
    });

    return NextResponse.json({
      reading,
      pointsAwarded: reading.validated ? await calculateRewardPoints(
        sensorType, 
        qualityScore,
      ) : 0
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating sensor reading:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}