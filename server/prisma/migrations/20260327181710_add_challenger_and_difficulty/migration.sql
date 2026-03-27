-- CreateTable
CREATE TABLE "challenge_scenarios" (
    "id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "hints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "difficulty_level" INTEGER NOT NULL,
    "age_range_min" INTEGER NOT NULL,
    "age_range_max" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "difficulty_profiles" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "current_level" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "success_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "consecutive_successes" INTEGER NOT NULL DEFAULT 0,
    "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
    "total_challenges" INTEGER NOT NULL DEFAULT 0,
    "total_correct" INTEGER NOT NULL DEFAULT 0,
    "last_calibration_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "difficulty_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "difficulty_profiles_student_id_key" ON "difficulty_profiles"("student_id");

-- AddForeignKey
ALTER TABLE "challenge_scenarios" ADD CONSTRAINT "challenge_scenarios_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "difficulty_profiles" ADD CONSTRAINT "difficulty_profiles_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
