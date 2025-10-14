import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function calculateQualityScore(sensorType: string, value: number): number {
  let score = 1.0;
  
  switch (sensorType) {
    case 'TEMPERATURE':
      if (value < -50 || value > 80) score -= 0.3;
      break;
    case 'HUMIDITY':
      if (value < 0 || value > 100) score -= 0.5;
      break;
  }
  
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

  return Math.round(points * 100) / 100;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { privyId, temperature, humidity } = body;

    // Validate input
    if (!privyId) {
      return NextResponse.json(
        { error: 'privyId is required' },
        { status: 400 }
      );
    }

    if (temperature === undefined && humidity === undefined) {
      return NextResponse.json(
        { error: 'At least one sensor value (temperature or humidity) is required' },
        { status: 400 }
      );
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { privyId },
      include: {
        devices: {
          include: {
            sensors: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please register first.' },
        { status: 404 }
      );
    }

    // Get or create device
    let device = user.devices.find((d: any) => d.status === 'ACTIVE');
    
    if (!device) {
      // Create a new device for the user
      device = await prisma.device.create({
        data: {
          name: `${user.name || 'User'}'s Device`,
          deviceId: `device-${user.id}-${Date.now()}`,
          ownerId: user.id,
          status: 'ACTIVE',
          model: 'ESP32-Default',
          lastSeenAt: new Date(),
        },
        include: {
          sensors: true,
        }
      });
    } else {
      // Update last seen time
      await prisma.device.update({
        where: { id: device.id },
        data: { lastSeenAt: new Date() }
      });
    }

    // Get or create sensors
    let tempSensor = device.sensors?.find((s: any) => s.type === 'TEMPERATURE');
    let humiditySensor = device.sensors?.find((s: any) => s.type === 'HUMIDITY');

    if (temperature !== undefined && !tempSensor) {
      tempSensor = await prisma.sensor.create({
        data: {
          deviceId: device.id,
          type: 'TEMPERATURE',
          label: 'Temperature Sensor',
          unit: '°C',
          sampleRate: 60, // 60 samples per hour
        }
      });
    }

    if (humidity !== undefined && !humiditySensor) {
      humiditySensor = await prisma.sensor.create({
        data: {
          deviceId: device.id,
          type: 'HUMIDITY',
          label: 'Humidity Sensor',
          unit: '%',
          sampleRate: 60,
        }
      });
    }

    const readings = [];
    const pointsEntries = [];

    // Create temperature reading
    if (temperature !== undefined) {
      const tempQualityScore = calculateQualityScore('TEMPERATURE', temperature);
      const tempPoints = await calculateRewardPoints('TEMPERATURE', tempQualityScore);

      const tempReading = await prisma.sensorReading.create({
        data: {
          deviceId: device.id,
          sensorType: 'TEMPERATURE',
          sensorId: tempSensor?.id,
          recordedAt: new Date(),
          value: temperature,
          valueUnit: '°C',
          qualityScore: tempQualityScore,
          validated: tempQualityScore >= 0.7,
          rawPayload: {
            temperature,
            timestamp: new Date().toISOString(),
            source: 'api',
          },
        }
      });

      readings.push(tempReading);

      // Award points if validated
      if (tempReading.validated && tempPoints > 0) {
        const pointsEntry = await prisma.pointsLedger.create({
          data: {
            userId: user.id,
            deviceId: device.id,
            readingId: tempReading.id,
            points: tempPoints,
            reason: 'TEMPERATURE_READING',
            meta: {
              sensorType: 'TEMPERATURE',
              qualityScore: tempQualityScore,
              value: temperature,
            }
          }
        });
        pointsEntries.push(pointsEntry);
      }
    }

    // Create humidity reading
    if (humidity !== undefined) {
      const humidityQualityScore = calculateQualityScore('HUMIDITY', humidity);
      const humidityPoints = await calculateRewardPoints('HUMIDITY', humidityQualityScore);

      const humidityReading = await prisma.sensorReading.create({
        data: {
          deviceId: device.id,
          sensorType: 'HUMIDITY',
          sensorId: humiditySensor?.id,
          recordedAt: new Date(),
          value: humidity,
          valueUnit: '%',
          qualityScore: humidityQualityScore,
          validated: humidityQualityScore >= 0.7,
          rawPayload: {
            humidity,
            timestamp: new Date().toISOString(),
            source: 'api',
          },
        }
      });

      readings.push(humidityReading);

      // Award points if validated
      if (humidityReading.validated && humidityPoints > 0) {
        const pointsEntry = await prisma.pointsLedger.create({
          data: {
            userId: user.id,
            deviceId: device.id,
            readingId: humidityReading.id,
            points: humidityPoints,
            reason: 'HUMIDITY_READING',
            meta: {
              sensorType: 'HUMIDITY',
              qualityScore: humidityQualityScore,
              value: humidity,
            }
          }
        });
        pointsEntries.push(pointsEntry);
      }
    }

    // Calculate total points earned
    const totalPoints = pointsEntries.reduce((sum, entry) => sum + entry.points, 0);

    return NextResponse.json({
      success: true,
      message: 'Sensor data recorded successfully',
      data: {
        userId: user.id,
        deviceId: device.id,
        deviceName: device.name,
        readings: readings.map(r => ({
          id: r.id,
          sensorType: r.sensorType,
          value: r.value,
          unit: r.valueUnit,
          qualityScore: r.qualityScore,
          validated: r.validated,
          recordedAt: r.recordedAt,
        })),
        pointsEarned: totalPoints,
        pointsDetails: pointsEntries.map(p => ({
          sensorType: (p.meta as any)?.sensorType,
          points: p.points,
          qualityScore: (p.meta as any)?.qualityScore,
        })),
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error recording sensor data:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
