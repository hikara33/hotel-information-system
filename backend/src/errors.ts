export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export function isConflictError(e: unknown): e is ConflictError {
  return e instanceof ConflictError;
}
