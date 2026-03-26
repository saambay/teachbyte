import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

declare module 'fastify' {
  interface FastifyRequest {
    parentId?: string;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const isDev = process.env.NODE_ENV !== 'production';

  // Dev mode: accept x-dev-user-id header
  if (isDev) {
    const devUserId = request.headers['x-dev-user-id'] as string | undefined;
    if (devUserId) {
      request.parentId = devUserId;
      return;
    }
  }

  // JWT auth
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    if (isDev) {
      // Verify JWT with local secret
      const payload = jwt.verify(token, JWT_SECRET) as { parentId: string };
      request.parentId = payload.parentId;
    } else {
      // Production: Firebase token validation would go here
      // For now, fall back to JWT
      const payload = jwt.verify(token, JWT_SECRET) as { parentId: string };
      request.parentId = payload.parentId;
    }
  } catch {
    reply.status(401).send({ error: 'Invalid or expired token' });
  }
}

export function generateDevToken(parentId: string): string {
  return jwt.sign({ parentId }, JWT_SECRET, { expiresIn: '7d' });
}

export async function verifyStudentBelongsToParent(
  studentId: string,
  parentId: string,
): Promise<boolean> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });
  return student?.parent_id === parentId;
}
