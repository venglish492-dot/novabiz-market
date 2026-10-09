import type { UserRole } from '../../types/index.ts';

export const USER_ROLES: UserRole[] = ['buyer', 'creator', 'editor', 'admin', 'super_admin'];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as string[]).includes(value);
}

/** Full admin access (orders, payments, customers, settings). */
export function isAdminRole(role: UserRole): boolean {
  return role === 'admin' || role === 'super_admin';
}

/** Content staff: can manage catalog content but not money or customers. */
export function isStaffRole(role: UserRole): boolean {
  return role === 'editor' || isAdminRole(role);
}
