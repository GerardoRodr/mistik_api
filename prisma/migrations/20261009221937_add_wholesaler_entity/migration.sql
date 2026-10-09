-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "wholesalerId" TEXT;

-- CreateTable
CREATE TABLE "wholesalers" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(30) NOT NULL DEFAULT 'WHOLESALER',
    "ruc" VARCHAR(11),
    "contactEmail" VARCHAR(100),
    "contactPhone" VARCHAR(20),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wholesalers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wholesalers_code_key" ON "wholesalers"("code");

-- CreateIndex
CREATE INDEX "bookings_status_serviceType_idx" ON "bookings"("status", "serviceType");

-- CreateIndex
CREATE INDEX "bookings_customerId_idx" ON "bookings"("customerId");

-- CreateIndex
CREATE INDEX "bookings_wholesalerId_idx" ON "bookings"("wholesalerId");

-- CreateIndex
CREATE INDEX "customers_lastName_firstName_idx" ON "customers"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "customers_documentType_documentNumber_idx" ON "customers"("documentType", "documentNumber");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- CreateIndex
CREATE INDEX "visa_processes_bookingId_idx" ON "visa_processes"("bookingId");

-- CreateIndex
CREATE INDEX "visa_processes_currentStep_idx" ON "visa_processes"("currentStep");

-- CreateIndex
CREATE INDEX "visa_processes_confirmationCode_idx" ON "visa_processes"("confirmationCode");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_wholesalerId_fkey" FOREIGN KEY ("wholesalerId") REFERENCES "wholesalers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
