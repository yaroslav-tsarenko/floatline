export class SihError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "SihError";
  }
}

export class SihHttpError extends SihError {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "SihHttpError";
  }
}

/** Thrown when SIH reports `{ success: false }` in a 2xx/4xx body. */
export class SihApiError extends SihError {
  constructor(
    readonly apiError: string,
    readonly body?: unknown,
  ) {
    super(`SIH API error: ${apiError}`);
    this.name = "SihApiError";
  }
}
