// Application-layer errors — no HTTP dependency; use these in domain and use-case layers
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 'not-found')
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = 'conflict') {
    super(message, code)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 'forbidden')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'unauthorized')
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'validation-error')
  }
}

export class MethodNotAllowedError extends AppError {
  constructor(message = 'Method not allowed') {
    super(message, 'method-not-allowed')
  }
}

// HTTP transport error — only for use at the route/handler layer
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}
