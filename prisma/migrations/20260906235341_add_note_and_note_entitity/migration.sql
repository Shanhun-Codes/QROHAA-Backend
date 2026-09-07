-- CreateEnum
CREATE TYPE "NoteEntityType" AS ENUM ('LEAD', 'PROPERTY', 'OPEN_HOUSE');

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "subjectType" "NoteEntityType" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteMention" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "targetType" "NoteEntityType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteMention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Note_subjectType_subjectId_idx" ON "Note"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "Note_agentId_idx" ON "Note"("agentId");

-- CreateIndex
CREATE INDEX "NoteMention_noteId_idx" ON "NoteMention"("noteId");

-- CreateIndex
CREATE INDEX "NoteMention_targetType_targetId_idx" ON "NoteMention"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteMention" ADD CONSTRAINT "NoteMention_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
