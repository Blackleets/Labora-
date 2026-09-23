import { Component, PropsWithChildren } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props extends PropsWithChildren {
  resetKey: string;
}

interface State {
  failed: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[LABORA_VIEW_RENDER_FAILED]', error);
  }

  componentDidUpdate(previousProps: Props) {
    if (this.state.failed && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <section className="mx-auto flex min-h-[50vh] max-w-xl items-center px-4" role="alert">
        <div className="labora-card w-full p-6 text-center sm:p-8">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--labora-soft-clay)] text-[var(--labora-clay-deep)]">
            <AlertTriangle size={23} aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-extrabold text-[var(--labora-ink)]">Esta pantalla no pudo abrirse</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--labora-muted)]">
            Tus datos no se han borrado. Recarga la aplicación para descargar de nuevo esta sección.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] bg-[var(--labora-primary)] px-5 text-sm font-extrabold text-white"
          >
            <RefreshCw size={16} aria-hidden /> Reintentar
          </button>
        </div>
      </section>
    );
  }
}
