import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Logar erro para análise
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
          <h1 className="text-base font-bold text-[#394353] mb-2">Ocorreu um erro inesperado</h1>
          <p className="text-xs text-[#394353] mb-4">{this.state.error?.message || 'Erro desconhecido.'}</p>
          <button className="bg-[#394353] text-white text-sm font-semibold px-4 py-2 rounded hover:opacity-90" onClick={() => window.location.reload()}>Recarregar página</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
