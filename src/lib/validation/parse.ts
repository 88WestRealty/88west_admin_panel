import type { z } from 'zod';

export type FieldErrors<T> = Partial<Record<keyof T & string, string>>;

export interface ParseResult<T> {
  values: T | null;
  errors: FieldErrors<T>;
}

/**
 * Flattens a Zod result into `{ values, errors }` — one message per field,
 * which is all a form row can render anyway.
 */
export function parseForm<S extends z.ZodType>(
  schema: S,
  input: unknown,
): ParseResult<z.infer<S>> {
  const result = schema.safeParse(input);
  if (result.success) return { values: result.data, errors: {} };

  const errors: FieldErrors<z.infer<S>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !(field in errors)) {
      Object.assign(errors, { [field]: issue.message });
    }
  }
  return { values: null, errors };
}

export const hasErrors = <T>(errors: FieldErrors<T>): boolean =>
  Object.keys(errors).length > 0;
