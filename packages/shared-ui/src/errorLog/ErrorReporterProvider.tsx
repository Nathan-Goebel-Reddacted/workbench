import { Component, createContext, useContext, useEffect, useMemo, type ErrorInfo, type ReactNode } from 'react'
import { createErrorReporter, type ErrorReport } from './errorReporter'

type Report = (entry: ErrorReport) => void

const noop: Report = () => {}

// Le reporter porte la déduplication et le plafond d'envois : tout le monde doit passer par la
// même instance, sinon chaque appelant a son propre quota.
const ReporterContext = createContext<Report>(noop)

export function useErrorReporter(): Report {
  return useContext(ReporterContext)
}

type BoundaryProps = { report: Report; children: ReactNode }
type BoundaryState = { crashed: boolean }

const fallbackStyle = {
  padding: '2rem',
  margin: '2rem auto',
  maxWidth: '40rem',
  borderRadius: '0.5rem',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  textAlign: 'center',
} as const

class ErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { crashed: false }

  static getDerivedStateFromError(): BoundaryState {
    return { crashed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.report({
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      context: { kind: 'render', componentStack: info.componentStack ?? undefined },
    })
  }

  render(): ReactNode {
    if (!this.state.crashed) return this.props.children
    return (
      <div style={fallbackStyle}>
        <p style={{ margin: 0 }}>Une erreur est survenue sur cette page.</p>
        <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-muted)' }}>
          Elle a été enregistrée. Rechargez la page pour continuer.
        </p>
      </div>
    )
  }
}

export function ErrorReporterProvider({ apiUrl, children }: { apiUrl: string; children: ReactNode }) {
  const report = useMemo(() => createErrorReporter(apiUrl), [apiUrl])

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      report({
        message: event.message,
        stack: event.error instanceof Error ? event.error.stack : undefined,
        url: event.filename || window.location.href,
        context: { kind: 'window', line: event.lineno, column: event.colno },
      })
    }

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      report({
        message: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
        url: window.location.href,
        context: { kind: 'unhandledrejection' },
      })
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [report])

  return (
    <ReporterContext.Provider value={report}>
      <ErrorBoundary report={report}>{children}</ErrorBoundary>
    </ReporterContext.Provider>
  )
}
