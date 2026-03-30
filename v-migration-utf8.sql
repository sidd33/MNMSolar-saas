-- CreateTable
CREATE TABLE "StageConfig" (
    "id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "expectedDays" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StageConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StageConfig_stage_key" ON "StageConfig"("stage");

