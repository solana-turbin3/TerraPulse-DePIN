-- CreateEnum
CREATE TYPE "public"."SensorType" AS ENUM ('TEMPERATURE', 'HUMIDITY', 'NOISE', 'VIBRATION', 'HEAT', 'RAIN', 'CO2', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."DeviceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DECOMMISSIONED', 'PENDING');

-- CreateEnum
CREATE TYPE "public"."RewardClaimStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."OnChainTxStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'REVERTED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "privyId" TEXT NOT NULL,
    "meta" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "meta" JSONB,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Device" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "deviceId" TEXT NOT NULL,
    "ownerId" TEXT,
    "walletId" TEXT,
    "publicKey" TEXT,
    "status" "public"."DeviceStatus" NOT NULL DEFAULT 'PENDING',
    "model" TEXT,
    "firmwareVersion" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "meta" JSONB,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sensor" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "type" "public"."SensorType" NOT NULL,
    "label" TEXT,
    "unit" TEXT,
    "sampleRate" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "meta" JSONB,

    CONSTRAINT "Sensor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SensorReading" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "sensorType" "public"."SensorType" NOT NULL,
    "sensorId" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawPayload" JSONB NOT NULL,
    "value" DOUBLE PRECISION,
    "valueUnit" TEXT,
    "qualityScore" DOUBLE PRECISION,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "ipfsCid" TEXT,
    "onchainProof" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB,

    CONSTRAINT "SensorReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Location" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "country" TEXT,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "meta" JSONB,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RewardIndex" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "basePoints" DOUBLE PRECISION NOT NULL,
    "multiplierJson" JSONB,
    "sensorBoosts" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "meta" JSONB,

    CONSTRAINT "RewardIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RewardClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pointsSpent" DOUBLE PRECISION NOT NULL,
    "tokensIssued" DOUBLE PRECISION,
    "status" "public"."RewardClaimStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "onChainTxId" TEXT,
    "note" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OnChainTx" (
    "id" TEXT NOT NULL,
    "txSignature" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "status" "public"."OnChainTxStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "payload" JSONB,
    "meta" JSONB,

    CONSTRAINT "OnChainTx_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PointsLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT,
    "readingId" TEXT,
    "points" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "rewardIndexId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB,

    CONSTRAINT "PointsLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_privyId_key" ON "public"."User"("privyId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_publicKey_key" ON "public"."Wallet"("publicKey");

-- CreateIndex
CREATE UNIQUE INDEX "Device_deviceId_key" ON "public"."Device"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Device_publicKey_key" ON "public"."Device"("publicKey");

-- CreateIndex
CREATE INDEX "Device_ownerId_idx" ON "public"."Device"("ownerId");

-- CreateIndex
CREATE INDEX "Device_status_idx" ON "public"."Device"("status");

-- CreateIndex
CREATE INDEX "Device_lastSeenAt_idx" ON "public"."Device"("lastSeenAt");

-- CreateIndex
CREATE INDEX "Sensor_deviceId_type_idx" ON "public"."Sensor"("deviceId", "type");

-- CreateIndex
CREATE INDEX "SensorReading_deviceId_sensorType_recordedAt_idx" ON "public"."SensorReading"("deviceId", "sensorType", "recordedAt");

-- CreateIndex
CREATE INDEX "SensorReading_recordedAt_idx" ON "public"."SensorReading"("recordedAt");

-- CreateIndex
CREATE INDEX "SensorReading_validated_idx" ON "public"."SensorReading"("validated");

-- CreateIndex
CREATE INDEX "Location_latitude_longitude_idx" ON "public"."Location"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Location_country_region_idx" ON "public"."Location"("country", "region");

-- CreateIndex
CREATE INDEX "RewardClaim_userId_idx" ON "public"."RewardClaim"("userId");

-- CreateIndex
CREATE INDEX "RewardClaim_status_idx" ON "public"."RewardClaim"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OnChainTx_txSignature_key" ON "public"."OnChainTx"("txSignature");

-- CreateIndex
CREATE INDEX "OnChainTx_status_idx" ON "public"."OnChainTx"("status");

-- CreateIndex
CREATE INDEX "OnChainTx_submittedAt_idx" ON "public"."OnChainTx"("submittedAt");

-- CreateIndex
CREATE INDEX "PointsLedger_userId_idx" ON "public"."PointsLedger"("userId");

-- CreateIndex
CREATE INDEX "PointsLedger_deviceId_idx" ON "public"."PointsLedger"("deviceId");

-- CreateIndex
CREATE INDEX "PointsLedger_createdAt_idx" ON "public"."PointsLedger"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Device" ADD CONSTRAINT "Device_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Device" ADD CONSTRAINT "Device_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "public"."Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Device" ADD CONSTRAINT "Device_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sensor" ADD CONSTRAINT "Sensor_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SensorReading" ADD CONSTRAINT "SensorReading_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RewardClaim" ADD CONSTRAINT "RewardClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RewardClaim" ADD CONSTRAINT "RewardClaim_onChainTxId_fkey" FOREIGN KEY ("onChainTxId") REFERENCES "public"."OnChainTx"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PointsLedger" ADD CONSTRAINT "PointsLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PointsLedger" ADD CONSTRAINT "PointsLedger_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PointsLedger" ADD CONSTRAINT "PointsLedger_readingId_fkey" FOREIGN KEY ("readingId") REFERENCES "public"."SensorReading"("id") ON DELETE SET NULL ON UPDATE CASCADE;
