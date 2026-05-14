import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';

function Fallback({ error }) {
  return (
    <div style={{ padding: 24, color: '#0f172a', fontFamily: "'Source Sans 3', system-ui, sans-serif", maxWidth: 560, background: '#f8fafc', minHeight: '100vh' }}>
      <h1 style={{ color: '#0d9488' }}>Something went wrong</h1>
      <pre style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 13, color: '#334155' }}>
        {error?.message || String(error)}
      </pre>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) return <Fallback error={this.state.error} />;
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
