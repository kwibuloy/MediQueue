import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';

function Fallback({ error }) {
  return (
    <div style={{ padding: 24, color: '#f0eeea', fontFamily: 'sans-serif', maxWidth: 560 }}>
      <h1 style={{ color: '#e8c86d' }}>Something went wrong</h1>
      <pre style={{ background: '#161719', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 13 }}>
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
