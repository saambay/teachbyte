import { PrismaClient } from '@prisma/client';
import { SEED_TOPICS, TEST_PARENT_ID, TEST_STUDENT_ID } from './topics';

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

  // Verify
  const topicCount = await prisma.topic.count();
  const parentCount = await prisma.parent.count();
  const studentCount = await prisma.student.count();
  console.log(`\nDatabase state: ${topicCount} topics, ${parentCount} parents, ${studentCount} students`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
