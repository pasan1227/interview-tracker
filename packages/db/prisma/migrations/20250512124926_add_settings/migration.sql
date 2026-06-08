-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT 'Company Name',
    "companyLogo" TEXT,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "feedbackReminders" BOOLEAN NOT NULL DEFAULT true,
    "defaultInterviewLength" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
