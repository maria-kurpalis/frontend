import type { DemoLoginResponse } from '../types/demoLogin';

const storageKey = 'anacity.demoUser';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isDemoUser(value: unknown): value is DemoLoginResponse {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && uuid.test(item.id)
    && typeof item.communityId === 'string' && uuid.test(item.communityId)
    && typeof item.name === 'string' && !!item.name.trim()
    && typeof item.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)
    && (item.userType === 'ADMIN' || (item.userType === 'RESIDENT' && typeof item.unitId === 'string' && uuid.test(item.unitId)));
}
export function clearCurrentDemoUser(): void { sessionStorage.removeItem(storageKey); }
export function getCurrentDemoUser(): DemoLoginResponse | null {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (raw === null) return null;
    const value: unknown = JSON.parse(raw);
    if (isDemoUser(value)) return value;
  } catch { /* Corrupt or unavailable storage is not a valid demo session. */ }
  try { clearCurrentDemoUser(); } catch { /* Storage can be disabled by the browser. */ }
  return null;
}
export function setCurrentDemoUser(user: DemoLoginResponse): void {
  if (!isDemoUser(user)) throw new Error('Invalid demo identity.');
  const { id, name, email, userType, communityId } = user;
  sessionStorage.setItem(storageKey, JSON.stringify({ id, name, email, userType, communityId,
    ...(user.userType === 'RESIDENT' ? { unitId: user.unitId } : {}) }));
}
export function demoDashboard(user: DemoLoginResponse): string {
  return user.userType === 'RESIDENT' ? `/resident/${user.id}` : `/admin/${user.id}/community/${user.communityId}`;
}
