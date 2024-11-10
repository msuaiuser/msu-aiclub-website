import { db } from '~/server/db';
import { userRoles } from '../schema';
import { User } from '@supabase/supabase-js';

export function getLevelByPoints(userPoints: number) {

  const pointsLevelDict: Record<number, number> = {
    1: 499,
    2: 999,
    3: 1499,
    4: 1999,
    5: 2499,
    6: 2999
  };

  for (const [level, points] of Object.entries(pointsLevelDict)) {
    if (userPoints <= points) {
      return Number(level);
    }
  }

  return 6;
}

export async function getUsers() {
  const results = await db.query.users.findMany({
    with: {
      roles: {
        with: {
          role: true
        }
      },
      projects: {
        with: {
          project: true
        }
      },
      events: {
        with: {
          event: true
        }
      }
    }
  });

  return results.map(user => ({
    id: user.id,
    email: user.email,
    metadata: user.raw_user_meta_data,
    roles: user.roles.map(ur => ur.role),
    projects: user.projects.map(up => up.project),
    points: user.events.reduce((acc, event) => acc + (event.event?.points || 0), 0),
    level: getLevelByPoints(user.events.reduce((acc, event) => acc + (event.event?.points || 0), 0)),
  }));
}

export async function getUserPoints(userId: string) {
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
    with: {
      events: {
        with: {
          event: true
        }
      }
    }
  });

  if (!user) return 0;
  
  return user.events.reduce((acc, event) => acc + (event.event?.points || 0), 0);
}
