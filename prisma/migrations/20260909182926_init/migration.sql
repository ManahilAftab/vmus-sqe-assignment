-- CreateTable
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL,
    "projectCode" TEXT NOT NULL,
    "groupBatch" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "voucherNumber" TEXT NOT NULL,
    "securityCode" TEXT NOT NULL,
    "mrp" DOUBLE PRECISION NOT NULL,
    "validityDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Distributor" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "proprietorName" TEXT NOT NULL,
    "designation" TEXT,
    "address" TEXT NOT NULL,
    "contactNo" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Distributor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionTransaction" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "distributorId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" INTEGER NOT NULL,
    "invoiceAmount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DistributionTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionItem" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,

    CONSTRAINT "DistributionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VSP" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "physicalAddress" TEXT NOT NULL,
    "communicationAddress" TEXT NOT NULL,
    "contactPerson" TEXT,
    "contactNo" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "paymentMode" TEXT,
    "bankAccountNo" TEXT,
    "bankName" TEXT,
    "paymentType" TEXT,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "firstVisitFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "firstFollowUpFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "secondFollowUpFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "labFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mismatchCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VSP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "claimNo" TEXT NOT NULL,
    "treatmentFormNo" TEXT NOT NULL,
    "submittedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vspId" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "visitType" TEXT NOT NULL,
    "patientType" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "doctorName" TEXT NOT NULL,
    "drugsQty" INTEGER NOT NULL DEFAULT 0,
    "drugsCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "thumbprintMismatch" BOOLEAN NOT NULL DEFAULT false,
    "claimAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "claimStatus" TEXT NOT NULL DEFAULT 'accepted',

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesReturn" (
    "id" TEXT NOT NULL,
    "distributorId" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnAmount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SalesReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "UserGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "screenName" TEXT NOT NULL,
    "canNew" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canPrint" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_voucherNumber_key" ON "Voucher"("voucherNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Distributor_code_key" ON "Distributor"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DistributionTransaction_invoiceNo_key" ON "DistributionTransaction"("invoiceNo");

-- CreateIndex
CREATE UNIQUE INDEX "VSP_code_key" ON "VSP"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Claim_claimNo_key" ON "Claim"("claimNo");

-- CreateIndex
CREATE UNIQUE INDEX "UserGroup_name_key" ON "UserGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "DistributionTransaction" ADD CONSTRAINT "DistributionTransaction_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "Distributor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionItem" ADD CONSTRAINT "DistributionItem_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "DistributionTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionItem" ADD CONSTRAINT "DistributionItem_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_vspId_fkey" FOREIGN KEY ("vspId") REFERENCES "VSP"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "Distributor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "UserGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "UserGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
