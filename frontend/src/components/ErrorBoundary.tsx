import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0f1115] text-white flex flex-col items-center justify-center p-8">
                    <div className="bg-rose-900/20 border border-rose-500/50 p-6 rounded-xl max-w-2xl w-full">
                        <h1 className="text-2xl font-bold text-rose-400 mb-4">Algo salió mal (Application Error)</h1>
                        <p className="mb-4 text-slate-300">Se ha producido un error crítico en la aplicación.</p>

                        <div className="bg-black/50 p-4 rounded-lg overflow-auto mb-4 border border-white/5 max-h-60">
                            <code className="text-red-300 font-mono text-sm whitespace-pre-wrap">
                                {this.state.error && this.state.error.toString()}
                            </code>
                        </div>

                        {this.state.errorInfo && (
                            <div className="bg-black/50 p-4 rounded-lg overflow-auto border border-white/5 max-h-60">
                                <p className="text-xs text-slate-500 mb-2">Component Stack:</p>
                                <code className="text-slate-400 font-mono text-xs whitespace-pre-wrap">
                                    {this.state.errorInfo.componentStack}
                                </code>
                            </div>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            Recargar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
