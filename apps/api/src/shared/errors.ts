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

export class NotFoundError extends HttpError {
  constructor(message = 'Not found') {
    super(404, message, 'not-found')
  }
}

export class ConflictError extends HttpError {
  constructor(message: string, code = 'conflict') {
    super(409, message, code)
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden') {
    super(403, message, 'forbidden')
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'unauthorized')
  }
}

export class ValidationError extends HttpError {
  constructor(message: string) {
    super(400, message, 'validation-error')
  }
}

export class MethodNotAllowedError extends HttpError {
  constructor(message = 'Method not allowed') {
    super(405, message, 'method-not-allowed')
  }
}
