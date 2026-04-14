import type { Request, Response, NextFunction } from 'express';

/**
 * Standard error response shape for all BFF API errors.
 * `error` is a human-readable message safe to send to the client.
 * `code` is a machine-readable constant that the SPA can branch on.
 */
export interface ApiError {
  error: string;
  code: string;
}

/**
 * Extends the built-in Error with an HTTP status code and a machine-readable
 * code string so route handlers can throw typed errors.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Express 404 handler — must be registered after all routes.
 */
export function notFoundHandler(_req: Request, res: Response): void {
  const body: ApiError = { error: 'Not found', code: 'NOT_FOUND' };
  res.status(404).json(body);
}

/**
 * Express error-handling middleware — must be registered last (4-arg signature).
 *
 * Rules enforced here (per REQ-SEC-data-protection / DEC-teaser-server-strip):
 * - Never echo request data back in error messages
 * - Never expose internal stack traces to clients
 * - Never include field values that might be PII
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    const body: ApiError = { error: err.message, code: err.code };
    res.status(err.status).json(body);
    return;
  }

  // Unknown error — log internally, return a generic message to the client
  console.error('[error]', err instanceof Error ? err.message : String(err));
  const body: ApiError = { error: 'Internal server error', code: 'INTERNAL_ERROR' };
  res.status(500).json(body);
}
