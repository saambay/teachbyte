-- AlterTable
ALTER TABLE "topics" ADD COLUMN     "micro_lesson_explainer_points" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "micro_lesson_fun_facts" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "micro_lesson_visual_descriptions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "topic_relationships" (
    "id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "related_topic_id" UUID NOT NULL,
    "relationship_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topic_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "topic_relationships_topic_id_related_topic_id_key" ON "topic_relationships"("topic_id", "related_topic_id");

-- AddForeignKey
ALTER TABLE "topic_relationships" ADD CONSTRAINT "topic_relationships_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_relationships" ADD CONSTRAINT "topic_relationships_related_topic_id_fkey" FOREIGN KEY ("related_topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
