'use client'

import { useEffect } from 'react'
import "./globals.css"


export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // If the error is a chunk loading error (common on new deployments)
    // Automatically force reload the page to clear caches and fetch new chunks
    if (
      error.message.includes('Failed to fetch') ||
      error.message.includes('Load failed') ||
      error.message.includes('ChunkLoadError') ||
      error.name === 'ChunkLoadError'
    ) {
      window.location.reload()
    }
  }, [error])

  return (
    <html>
      <body>
        <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 text-white">
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl text-center max-w-lg">
            <h2 className="mb-4 text-2xl font-bold text-red-400">Something went wrong!</h2>
            <p className="mb-4 text-indigo-200/70">
              The application encountered a critical error.
            </p>
            <div className="mb-6 rounded bg-slate-950 p-4 text-left text-sm font-mono text-red-300 overflow-auto max-h-48 border border-red-900/50">
              {error.message || "Unknown Error"}
            </div>
            <button
              onClick={() => reset()}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
