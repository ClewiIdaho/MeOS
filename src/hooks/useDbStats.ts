import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';

export interface DbStats {
  bills: number;
  incomes: number;
  tasks: number;
  taskCategories: number;
  workouts: number;
  goals: number;
  notebookEntries: number;
  xpTotal: number;
}

/**
 * Live count of every primary entity in the database.
 * Lets early-phase placeholder screens prove that seeding + persistence work
 * across app reloads. Removed once each module ships its own dashboard.
 */
export function useDbStats(): DbStats | undefined {
  return useLiveQuery(async () => {
    const [
      bills,
      incomes,
      tasks,
      taskCategories,
      workouts,
      goals,
      notebookEntries,
      xpEvents,
    ] = await Promise.all([
      db.bills.count(),
      db.incomes.count(),
      db.tasks.count(),
      db.taskCategories.count(),
      db.workoutSessions.count(),
      db.goals.count(),
      db.notebookEntries.count(),
      db.xpEvents.toArray(),
    ]);

    const xpTotal = xpEvents.reduce((sum, e) => sum + e.delta, 0);

    return {
      bills,
      incomes,
      tasks,
      taskCategories,
      workouts,
      goals,
      notebookEntries,
      xpTotal,
    };
  }, []);
}
