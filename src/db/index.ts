/**
 * Public DB surface. Modules import from `@/db`, never from the schema file directly.
 * That way we can swap the persistence layer (e.g. add encryption-at-rest) without
 * touching call sites.
 */
export { db } from './schema';
export { runSeeds, nukeAllData, type SeedReport } from './seeds';
export * from './types';
