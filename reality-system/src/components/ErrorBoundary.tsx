import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  fallback: (error: Error, reset: () => void) => ReactNode
  children: ReactNode
  onError?: (error: Error) => void
}

/** Keeps a failure in one part of the UI (e.g. a 3D scene) from breaking the whole app. */
export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  override state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[REALITY SYSTEM] UI error:', error, info.componentStack)
    this.props.onError?.(error)
  }

  reset = () => this.setState({ error: null })

  override render() {
    if (this.state.error) return this.props.fallback(this.state.error, this.reset)
    return this.props.children
  }
}
