import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

export function ErrorPage() {
  const error = useRouteError()

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : 'Something went wrong'

  const message = isRouteErrorResponse(error)
    ? error.data
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred.'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="font-display text-ink-1000 text-2xl font-bold">{title}</h1>
      {message && <p className="text-ink-500 text-sm">{String(message)}</p>}
      <a href="/app" className="text-tropical-magenta text-sm underline underline-offset-2">
        Go back
      </a>
    </div>
  )
}
