import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CustomQuip } from '@/db';
import type { QuipCategory } from '@/voice/types';

export function useCustomQuips(): CustomQuip[] | undefined {
  return useLiveQuery(async () => {
    const all = await db.customQuips.toArray();
    return all.sort((a, b) => b.createdAt - a.createdAt);
  }, []);
}

export async function createCustomQuip(input: {
  category: QuipCategory;
  text: string;
}): Promise<number> {
  const row: Omit<CustomQuip, 'id'> = {
    category: input.category,
    text: input.text.trim(),
    enabled: true,
    createdAt: Date.now(),
  };
  return (await db.customQuips.add(row as CustomQuip)) as number;
}

export async function updateCustomQuip(
  id: number,
  patch: Partial<Pick<CustomQuip, 'category' | 'text' | 'enabled'>>,
): Promise<void> {
  const cleaned: Partial<CustomQuip> = {};
  if (patch.category !== undefined) cleaned.category = patch.category;
  if (patch.text !== undefined) cleaned.text = patch.text.trim();
  if (patch.enabled !== undefined) cleaned.enabled = patch.enabled;
  await db.customQuips.update(id, cleaned);
}

export async function deleteCustomQuip(id: number): Promise<void> {
  await db.customQuips.delete(id);
}
