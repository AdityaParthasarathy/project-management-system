// Pure validation helpers shared by web and mobile forms (the backend enforces the same
// rules again with class-validator, so the client checks are only for fast feedback).

export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 72;
export const MAX_NAME_LENGTH = 100;

export type ValidationResult = { ok: true } | { ok: false; message: string };

const ok: ValidationResult = { ok: true };
const fail = (message: string): ValidationResult => ({ ok: false, message });

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidDate(value?: string | null): boolean {
  if (!value) return true;
  return !Number.isNaN(new Date(value).getTime());
}

export function validateRegister(input: { fullName: string; email: string; password: string }): ValidationResult {
  if (!input.fullName.trim()) return fail('Full name is required.');
  if (input.fullName.trim().length > MAX_NAME_LENGTH) return fail(`Full name must be at most ${MAX_NAME_LENGTH} characters.`);
  if (!isValidEmail(input.email)) return fail('Enter a valid email address.');
  if (input.password.length < MIN_PASSWORD_LENGTH) return fail(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  if (input.password.length > MAX_PASSWORD_LENGTH) return fail(`Password must be at most ${MAX_PASSWORD_LENGTH} characters.`);
  return ok;
}

export function validateLogin(input: { email: string; password: string }): ValidationResult {
  if (!isValidEmail(input.email)) return fail('Enter a valid email address.');
  if (!input.password) return fail('Password is required.');
  return ok;
}

export function validateProject(input: { name: string; startDate?: string | null; endDate?: string | null }): ValidationResult {
  if (!input.name.trim()) return fail('Project name is required.');
  if (!isValidDate(input.startDate)) return fail('Start date is not a valid date.');
  if (!isValidDate(input.endDate)) return fail('End date is not a valid date.');
  if (input.startDate && input.endDate && new Date(input.endDate) < new Date(input.startDate)) {
    return fail('End date cannot be before the start date.');
  }
  return ok;
}

export function validateTask(input: { name: string; projectId?: number | string | null; dueDate?: string | null }): ValidationResult {
  if (!input.name.trim()) return fail('Task name is required.');
  if (!input.projectId) return fail('Please select a project.');
  if (!isValidDate(input.dueDate)) return fail('Due date is not a valid date.');
  return ok;
}

/** True when the task is due on tomorrow's calendar date (local time) and not completed. */
export function isDueTomorrow(task: { dueDate?: string | null; status: string }, now: Date = new Date()): boolean {
  if (!task.dueDate || task.status === 'COMPLETED') return false;
  const due = new Date(task.dueDate);
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return (
    due.getFullYear() === tomorrow.getFullYear() &&
    due.getMonth() === tomorrow.getMonth() &&
    due.getDate() === tomorrow.getDate()
  );
}
