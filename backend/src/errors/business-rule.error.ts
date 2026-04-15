export class BusinessRuleError extends Error {
  constructor(
    message: string,
    public readonly httpStatus: number = 400
  ) {
    super(message);
    this.name = "BusinessRuleError";
  }
}

export function isBusinessRuleError(e: unknown): e is BusinessRuleError {
  return e instanceof BusinessRuleError;
}
