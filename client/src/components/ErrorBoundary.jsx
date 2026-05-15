import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Application render error", error, info);
  }

  handleReset = () => {
    localStorage.removeItem("restaurant-saas-preferences");
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center bg-cream px-6 text-ink">
        <section className="max-w-xl rounded-[28px] bg-white p-8 text-center shadow-soft">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-copper">Erreur interface</p>
          <h1 className="mt-3 text-4xl font-black">La page a besoin d'etre rechargee</h1>
          <p className="mt-4 text-elegant">
            Un ancien etat local du navigateur a bloque l'affichage. Cliquez ici pour nettoyer cet etat et relancer
            l'application.
          </p>
          <button type="button" onClick={this.handleReset} className="mt-6 rounded-2xl bg-ink px-6 py-3 font-black text-cream">
            Recharger l'application
          </button>
          <pre className="mt-5 max-h-32 overflow-auto rounded-2xl bg-cream p-3 text-left text-xs text-elegant">
            {this.state.error?.message || "Erreur inconnue"}
          </pre>
        </section>
      </main>
    );
  }
}
