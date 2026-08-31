-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "street2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "listingPriceCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpenHouse" (
    "id" TEXT NOT NULL,
    "publicCode" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "agentId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpenHouse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpenHouse_publicCode_key" ON "OpenHouse"("publicCode");

-- AddForeignKey
ALTER TABLE "OpenHouse" ADD CONSTRAINT "OpenHouse_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenHouse" ADD CONSTRAINT "OpenHouse_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
