import React from 'react';
import { Link } from 'react-router-dom';

export default function NotAuthorizedPage() {
  return (
    <main style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: '48px 24px' }}>
      <section style={{ maxWidth: 560, width: '100%', padding: '32px', border: '1px solid var(--border)', borderRadius: '24px', background: 'var(--bg2)' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--accent)', fontSize: 12, fontWeight: 700 }}>Access restricted</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 48px)', margin: '12px 0 16px', color: 'var(--ink)' }}>Not Authorized</h1>
        <p style={{ color: 'var(--ink-muted)', lineHeight: 1.7, marginBottom: 24 }}>
          Your current account does not have permission to view that page.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/" style={{ padding: '10px 16px', borderRadius: 999, background: 'var(--accent)', color: '#111', fontWeight: 700 }}>Go Home</Link>
          <Link to="/login" style={{ padding: '10px 16px', borderRadius: 999, border: '1px solid var(--border)', color: 'var(--ink)' }}>Go to Login</Link>
        </div>
      </section>
    </main>
  );
}
