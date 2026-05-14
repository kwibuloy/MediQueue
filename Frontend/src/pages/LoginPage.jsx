import React from 'react';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  return (
    <main style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: '48px 24px', background: 'var(--bg)' }}>
      <section style={{ maxWidth: 720, width: '100%', padding: '32px', border: '1px solid var(--border)', borderRadius: '24px', background: 'var(--bg2)', boxShadow: 'var(--shadow-lg)' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--accent-dark)', fontSize: 12, fontWeight: 700 }}>Choose access</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 48px)', margin: '12px 0 16px', color: 'var(--ink)' }}>Sign in to MediQueue</h1>
        <p style={{ color: 'var(--ink-muted)', lineHeight: 1.7, marginBottom: 24 }}>
          Continue as a patient or an admin to access the right dashboard.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/patient/auth" style={{ padding: '12px 18px', borderRadius: 999, background: 'var(--accent)', color: 'var(--accent-ink)', fontWeight: 700, textDecoration: 'none' }}>Patient Login</Link>
          <Link to="/admin/auth" style={{ padding: '12px 18px', borderRadius: 999, border: '1px solid var(--border)', color: 'var(--ink)', background: 'var(--bg2)', textDecoration: 'none' }}>Admin Login</Link>
        </div>
      </section>
    </main>
  );
}
