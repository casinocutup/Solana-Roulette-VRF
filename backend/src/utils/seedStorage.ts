/**
 * Server seed storage (in-memory for demo, use Redis/DB in production)
 */

// In-memory storage for server seeds (keyed by spinId)
// In production, use Redis or a secure database
const seedStorage = new Map<number, string>();

/**
 * Store a server seed for a spin
 */
export function storeServerSeed(spinId: number, serverSeed: string): void {
  seedStorage.set(spinId, serverSeed);
}

/**
 * Retrieve a server seed for a spin
 */
export function getServerSeed(spinId: number): string | null {
  return seedStorage.get(spinId) || null;
}

/**
 * Remove a server seed after it's been revealed
 */
export function removeServerSeed(spinId: number): void {
  seedStorage.delete(spinId);
}
