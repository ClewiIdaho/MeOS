import { useLiveQuery } from 'dexie-react-hooks';
import { db, type NotebookEntry } from '@/db';

/**
 * Notebook + Voice quip persistence. The Voice itself is rendered ephemerally
 * (no DB round-trip) but the Notebook is the durable side of the Coach module.
 */

export function useNotebookEntries(query: string): NotebookEntry[] | undefined {
  return useLiveQuery(async () => {
    const all = await db.notebookEntries.orderBy('updatedAt').reverse().toArray();
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((entry) => {
      if (entry.title.toLowerCase().includes(q)) return true;
      if (entry.body.toLowerCase().includes(q)) return true;
      return entry.tags.some((t) => t.toLowerCase().includes(q));
    });
  }, [query]);
}

interface CreateEntryInput {
  title: string;
  body: string;
  tagsRaw: string;
  fromVoice?: boolean;
  voiceCategory?: string;
}

function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export async function createNotebookEntry(input: CreateEntryInput): Promise<number> {
  const now = Date.now();
  const entry: Omit<NotebookEntry, 'id'> = {
    title: input.title.trim() || 'Untitled',
    body: input.body.trim(),
    tags: parseTags(input.tagsRaw),
    fromVoice: Boolean(input.fromVoice),
    createdAt: now,
    updatedAt: now,
    ...(input.voiceCategory ? { voiceCategory: input.voiceCategory } : {}),
  };
  return (await db.notebookEntries.add(entry as NotebookEntry)) as number;
}

interface UpdateEntryInput {
  title?: string;
  body?: string;
  tagsRaw?: string;
}

export async function updateNotebookEntry(id: number, patch: UpdateEntryInput): Promise<void> {
  const now = Date.now();
  const cleaned: Partial<NotebookEntry> = { updatedAt: now };
  if (patch.title !== undefined) cleaned.title = patch.title.trim() || 'Untitled';
  if (patch.body !== undefined) cleaned.body = patch.body.trim();
  if (patch.tagsRaw !== undefined) cleaned.tags = parseTags(patch.tagsRaw);
  await db.notebookEntries.update(id, cleaned);
}

export async function deleteNotebookEntry(id: number): Promise<void> {
  await db.notebookEntries.delete(id);
}
