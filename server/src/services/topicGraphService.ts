import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getTopicGraph(topicId: string) {
  const topic = await prisma.topic.findUniqueOrThrow({
    where: { id: topicId },
  });

  const relationships = await prisma.topicRelationship.findMany({
    where: {
      OR: [
        { topic_id: topicId },
        { related_topic_id: topicId },
      ],
    },
    include: {
      topic: { select: { id: true, title: true } },
      relatedTopic: { select: { id: true, title: true } },
    },
  });

  return { topic, relationships };
}

export async function getConnectedTopics(
  topicId: string,
  depth = 2,
): Promise<{ id: string; title: string; distance: number; path: string[] }[]> {
  const visited = new Set<string>();
  const result: { id: string; title: string; distance: number; path: string[] }[] = [];
  const queue: { id: string; title: string; distance: number; path: string[] }[] = [];

  // Seed with the starting topic
  visited.add(topicId);
  const startTopic = await prisma.topic.findUniqueOrThrow({
    where: { id: topicId },
    select: { id: true, title: true },
  });
  queue.push({ id: startTopic.id, title: startTopic.title, distance: 0, path: [] });

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.distance > 0) {
      result.push(current);
    }
    if (current.distance >= depth) continue;

    // Get all outgoing relationships
    const relationships = await prisma.topicRelationship.findMany({
      where: { topic_id: current.id },
      include: { relatedTopic: { select: { id: true, title: true } } },
    });

    for (const rel of relationships) {
      if (!visited.has(rel.related_topic_id)) {
        visited.add(rel.related_topic_id);
        queue.push({
          id: rel.related_topic_id,
          title: rel.relatedTopic.title,
          distance: current.distance + 1,
          path: [...current.path, rel.relationship_type],
        });
      }
    }
  }

  return result;
}

export interface ScoredTopic {
  id: string;
  title: string;
  description: string;
  score: number;
  difficultyLevel: number;
}

export async function getRecommendedTopicsGraph(
  studentId: string,
  count = 3,
): Promise<ScoredTopic[]> {
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
  });

  // Get student's progress
  const progress = await prisma.studentProgress.findMany({
    where: { student_id: studentId },
  });
  const progressMap = new Map(progress.map((p) => [p.topic_id, p]));

  // Get recently completed sessions (last 3)
  const recentSessions = await prisma.session.findMany({
    where: {
      student_id: studentId,
      status: 'completed',
      topic_id: { not: null },
    },
    orderBy: { ended_at: 'desc' },
    take: 3,
    select: { topic_id: true },
  });
  const recentTopicIds = recentSessions
    .map((s) => s.topic_id)
    .filter((id): id is string => id !== null);

  // Get all age-appropriate topics
  const allTopics = await prisma.topic.findMany({
    where: {
      age_range_min: { lte: student.age },
      age_range_max: { gte: student.age },
    },
  });

  // If no recent topics, fall back to flat-list recommendations
  if (recentTopicIds.length === 0) {
    return fallbackRecommendations(allTopics, progressMap, count);
  }

  // Get graph connections for recent topics
  const connectionScores = new Map<string, number>();

  for (const recentTopicId of recentTopicIds) {
    const relationships = await prisma.topicRelationship.findMany({
      where: { topic_id: recentTopicId },
    });

    for (const rel of relationships) {
      const current = connectionScores.get(rel.related_topic_id) || 0;
      let bonus = 0;
      if (rel.relationship_type === 'builds_on') bonus = 3;
      else if (rel.relationship_type === 'related') bonus = 2;
      else if (rel.relationship_type === 'prerequisite') bonus = 1;
      connectionScores.set(rel.related_topic_id, current + bonus);
    }
  }

  // Score all candidate topics
  const scored: ScoredTopic[] = allTopics.map((topic) => {
    let score = connectionScores.get(topic.id) || 0;
    const prog = progressMap.get(topic.id);

    // Deprioritize mastered topics
    if (prog?.status === 'mastered') {
      score -= 2;
    }

    // Bonus for unmastered prerequisites
    if (prog?.status !== 'mastered' && !prog) {
      score += 0.5; // slight bonus for fresh topics
    }

    // Variety: penalize if same as recent topics
    if (recentTopicIds.includes(topic.id)) {
      score -= 3;
    }

    return {
      id: topic.id,
      title: topic.title,
      description: topic.description,
      score,
      difficultyLevel: topic.difficulty_level,
    };
  });

  // Sort by score (desc), then difficulty (asc)
  scored.sort((a, b) => b.score - a.score || a.difficultyLevel - b.difficultyLevel);

  return scored.slice(0, count);
}

function fallbackRecommendations(
  topics: { id: string; title: string; description: string; difficulty_level: number }[],
  progressMap: Map<string, { status: string }>,
  count: number,
): ScoredTopic[] {
  const notMastered = topics.filter((t) => progressMap.get(t.id)?.status !== 'mastered');
  const sorted = notMastered.sort((a, b) => a.difficulty_level - b.difficulty_level);
  return sorted.slice(0, count).map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    score: 0,
    difficultyLevel: t.difficulty_level,
  }));
}

export async function getExplorerConnections(topicId: string): Promise<string[]> {
  const relationships = await prisma.topicRelationship.findMany({
    where: { topic_id: topicId },
    include: {
      relatedTopic: { select: { title: true } },
    },
    take: 3,
  });

  const typeVerbs: Record<string, string> = {
    prerequisite: 'is a foundation for understanding',
    related: 'connects to',
    builds_on: 'builds on what you learn about',
  };

  return relationships.map((r) => {
    const verb = typeVerbs[r.relationship_type] || 'connects to';
    return `Did you know? This topic ${verb} ${r.relatedTopic.title}!`;
  });
}
