import { PrismaClient } from '@prisma/client';
import { SEED_TOPICS, TEST_PARENT_ID, TEST_STUDENT_ID } from './topics';
import { MICRO_LESSONS } from './microLessons';
import { TOPIC_RELATIONSHIPS } from './topicRelationships';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create test parent
  const parent = await prisma.parent.upsert({
    where: { id: TEST_PARENT_ID },
    update: {},
    create: {
      id: TEST_PARENT_ID,
      email: 'test@teachbyte.dev',
      name: 'Test Parent',
    },
  });
  console.log(`Created parent: ${parent.name} (${parent.id})`);

  // Create test student
  const student = await prisma.student.upsert({
    where: { id: TEST_STUDENT_ID },
    update: {},
    create: {
      id: TEST_STUDENT_ID,
      parent_id: TEST_PARENT_ID,
      name: 'Alex',
      age: 9,
      grade_level: 4,
    },
  });
  console.log(`Created student: ${student.name} (${student.id})`);

  // Create streak data for test student
  await prisma.streakData.upsert({
    where: { student_id: TEST_STUDENT_ID },
    update: {},
    create: {
      student_id: TEST_STUDENT_ID,
      current_streak: 0,
      longest_streak: 0,
      streak_status: 'broken',
    },
  });
  console.log('Created streak data for test student');

  // Seed topics
  let created = 0;
  for (const topic of SEED_TOPICS) {
    const existing = await prisma.topic.findFirst({
      where: { title: topic.title },
    });

    if (!existing) {
      await prisma.topic.create({ data: topic });
      created++;
    }
  }
  console.log(`Seeded ${created} topics (${SEED_TOPICS.length - created} already existed)`);

  // Populate micro-lesson content on topics
  let microLessonCount = 0;
  for (const [title, lesson] of Object.entries(MICRO_LESSONS)) {
    const result = await prisma.topic.updateMany({
      where: { title },
      data: {
        micro_lesson_explainer_points: lesson.explainer_points,
        micro_lesson_fun_facts: lesson.fun_facts,
        micro_lesson_visual_descriptions: lesson.visual_descriptions,
      },
    });
    if (result.count > 0) microLessonCount++;
  }
  console.log(`Updated ${microLessonCount} topics with micro-lesson content`);

  // Seed topic relationships
  let relationshipCount = 0;
  for (const rel of TOPIC_RELATIONSHIPS) {
    const fromTopic = await prisma.topic.findFirst({ where: { title: rel.fromTitle } });
    const toTopic = await prisma.topic.findFirst({ where: { title: rel.toTitle } });
    if (!fromTopic || !toTopic) {
      console.warn(`Skipping relationship: ${rel.fromTitle} -> ${rel.toTitle} (topic not found)`);
      continue;
    }
    await prisma.topicRelationship.upsert({
      where: {
        topic_id_related_topic_id: {
          topic_id: fromTopic.id,
          related_topic_id: toTopic.id,
        },
      },
      update: { relationship_type: rel.type },
      create: {
        topic_id: fromTopic.id,
        related_topic_id: toTopic.id,
        relationship_type: rel.type,
      },
    });
    relationshipCount++;
  }
  console.log(`Seeded ${relationshipCount} topic relationships`);

  // Verify
  const topicCount = await prisma.topic.count();
  const parentCount = await prisma.parent.count();
  const studentCount = await prisma.student.count();
  const relCount = await prisma.topicRelationship.count();
  const topicsWithMicroLessons = await prisma.topic.count({
    where: { micro_lesson_explainer_points: { isEmpty: false } },
  });
  console.log(`\nDatabase state: ${topicCount} topics, ${parentCount} parents, ${studentCount} students`);
  console.log(`Topic graph: ${relCount} relationships, ${topicsWithMicroLessons} topics with micro-lessons`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
