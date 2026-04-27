import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Task, type TaskCategory, type TaskCompletion } from '@/db';
import { todayYmd, weekStartYmd } from '@/utils/dates';
import { eventBus } from '@/utils/events';

export interface TaskWithStatus {
  task: Task;
  category?: TaskCategory;
  completion?: TaskCompletion;
  /** True if the task already counts as done for the relevant period (today/week/ever). */
  done: boolean;
}

export function useTaskCategories(): TaskCategory[] | undefined {
  return useLiveQuery(() => db.taskCategories.orderBy('order').toArray(), []);
}

/**
 * Returns active tasks bucketed by cadence with their completion state for
 * the current local-day (daily), current week (weekly), or ever (one-off).
 */
export function useTodayTasks(): {
  daily: TaskWithStatus[];
  weekly: TaskWithStatus[];
  oneoff: TaskWithStatus[];
} | undefined {
  return useLiveQuery(async () => {
    const today = todayYmd();
    const weekStart = weekStartYmd();

    const [tasks, categories] = await Promise.all([
      db.tasks.toArray(),
      db.taskCategories.toArray(),
    ]);

    // Boolean indexing in Dexie isn't reliable cross-platform; filter in memory.
    const active = tasks.filter((t) => t.active);
    active.sort((a, b) => a.order - b.order);

    const categoryById = new Map(categories.map((c) => [c.id!, c]));

    const dailyTasks = active.filter((t) => t.cadence === 'daily');
    const weeklyTasks = active.filter((t) => t.cadence === 'weekly');
    const oneoffTasks = active.filter((t) => t.cadence === 'one-off');

    // Daily: look up completion for today.
    const dailyIds = dailyTasks.map((t) => t.id!).filter(Boolean);
    const todaysCompletions = dailyIds.length
      ? await db.taskCompletions.where('forDate').equals(today).toArray()
      : [];
    const todayByTask = new Map(todaysCompletions.map((c) => [c.taskId, c]));

    // Weekly: any completion for this task on or after weekStart counts.
    const weeklyCompletionsByTask = new Map<number, TaskCompletion>();
    if (weeklyTasks.length) {
      const all = await db.taskCompletions.toArray();
      for (const c of all) {
        if (c.forDate >= weekStart) {
          const existing = weeklyCompletionsByTask.get(c.taskId);
          if (!existing || existing.completedAt < c.completedAt) {
            weeklyCompletionsByTask.set(c.taskId, c);
          }
        }
      }
    }

    const map = (t: Task): TaskWithStatus => {
      const category = t.categoryId !== undefined ? categoryById.get(t.categoryId) : undefined;
      const completion =
        t.cadence === 'daily'
          ? todayByTask.get(t.id!)
          : t.cadence === 'weekly'
            ? weeklyCompletionsByTask.get(t.id!)
            : undefined;
      const done =
        t.cadence === 'one-off' ? Boolean(t.completedAt) : Boolean(completion);
      return {
        task: t,
        ...(category !== undefined ? { category } : {}),
        ...(completion !== undefined ? { completion } : {}),
        done,
      };
    };

    return {
      daily: dailyTasks.map(map),
      weekly: weeklyTasks.map(map),
      oneoff: oneoffTasks.filter((t) => !t.completedAt).map(map),
    };
  }, []);
}

interface CreateTaskInput {
  title: string;
  description?: string;
  cadence: Task['cadence'];
  categoryId?: number;
}

export async function createTask(input: CreateTaskInput): Promise<number> {
  const now = Date.now();
  const lastOrder = await db.tasks.orderBy('order').last();
  const order = lastOrder ? lastOrder.order + 1 : 0;
  const newTask: Omit<Task, 'id'> = {
    title: input.title.trim(),
    cadence: input.cadence,
    order,
    active: true,
    createdAt: now,
    ...(input.description ? { description: input.description.trim() } : {}),
    ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
  };
  return (await db.tasks.add(newTask as Task)) as number;
}

export async function updateTask(id: number, patch: Partial<Task>): Promise<void> {
  await db.tasks.update(id, patch);
}

export async function deleteTask(id: number): Promise<void> {
  await db.transaction('rw', [db.tasks, db.taskCompletions], async () => {
    await db.taskCompletions.where('taskId').equals(id).delete();
    await db.tasks.delete(id);
  });
}

/**
 * Marks a task complete for the current local-day. Idempotent — calling twice
 * the same day returns the existing completion. Emits `task:completed` so the
 * orchestrator can award XP and tick the streak.
 */
export async function completeTask(taskId: number): Promise<{ created: boolean; completion: TaskCompletion } | null> {
  const today = todayYmd();
  const task = await db.tasks.get(taskId);
  if (!task) return null;

  let created = false;
  let completion: TaskCompletion | undefined;

  await db.transaction('rw', [db.taskCompletions, db.tasks], async () => {
    if (task.cadence === 'daily' || task.cadence === 'weekly') {
      const existing = await db.taskCompletions
        .where('[taskId+forDate]')
        .equals([taskId, today])
        .first();
      if (existing) {
        completion = existing;
        return;
      }
    }

    const newCompletion: Omit<TaskCompletion, 'id'> = {
      taskId,
      completedAt: Date.now(),
      forDate: today,
      xpAwarded: 0, // engine will record actual XP via xpEvents
    };
    const id = await db.taskCompletions.add(newCompletion as TaskCompletion);
    completion = { ...newCompletion, id } as TaskCompletion;
    created = true;

    if (task.cadence === 'one-off') {
      await db.tasks.update(taskId, { completedAt: Date.now() });
    }
  });

  if (created && completion) {
    await eventBus.emit('task:completed', {
      taskId,
      title: task.title,
      cadence: task.cadence,
      forDate: today,
    });
  }

  return completion ? { created, completion } : null;
}

/**
 * Undoes today's (or this week's) completion of a task. Used for "I clicked
 * the wrong one" — does not refund XP (XP events are append-only audit).
 */
export async function uncompleteTaskToday(taskId: number): Promise<boolean> {
  const today = todayYmd();
  const weekStart = weekStartYmd();
  const task = await db.tasks.get(taskId);
  if (!task) return false;

  let removed = false;
  await db.transaction('rw', [db.taskCompletions, db.tasks], async () => {
    if (task.cadence === 'one-off') {
      const all = await db.taskCompletions.where('taskId').equals(taskId).toArray();
      for (const c of all) await db.taskCompletions.delete(c.id!);
      await db.tasks.update(taskId, { completedAt: undefined as unknown as number });
      removed = all.length > 0;
      return;
    }
    const target = task.cadence === 'daily' ? today : weekStart;
    const matches = await db.taskCompletions
      .where('taskId').equals(taskId).toArray();
    for (const c of matches) {
      if (task.cadence === 'daily' ? c.forDate === today : c.forDate >= target) {
        await db.taskCompletions.delete(c.id!);
        removed = true;
      }
    }
  });
  return removed;
}
