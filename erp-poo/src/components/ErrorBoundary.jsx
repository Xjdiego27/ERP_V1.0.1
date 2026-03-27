import { Component } from 'react';

/**
 * ErrorBoundary — Captura errores de renderizado en React.
 * Evita que un error en un componente hijo colapse toda la app.
 *
 * Uso:
 *   <ErrorBoundary>
 *     <MiComponente />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary] Error capturado:', error, errorInfo);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '200px',
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#64748b',
                }}>
                    <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: '#ef4444' }}>
                        Algo salio mal
                    </h2>
                    <p style={{ margin: '0 0 1rem', fontSize: '0.9rem' }}>
                        Ocurrió un error inesperado. Intenta recargar la sección.
                    </p>
                    <button
                        onClick={this.handleReload}
                        style={{
                            padding: '0.5rem 1.5rem',
                            background: '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                        }}
                    >
                        Reintentar
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
