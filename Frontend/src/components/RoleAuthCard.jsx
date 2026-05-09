import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAccessToken, getAccessToken, getUserRole, login, register } from '../services/api';
import { supabase } from '../services/supabaseClient';
import styles from './RoleAuthCard.module.css';

export default function RoleAuthCard({ role, title, subtitle, registerEnabled = false, redirectTo }) {
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const verifyAndRedirect = async () => {
      const { data, error } = await supabase.auth.getSession();
      const sessionRole = data?.session?.user?.user_metadata?.role;

      if (error) return;

      if (sessionRole === role) {
        navigate(redirectTo, { replace: true });
      }
    };

    verifyAndRedirect();
  }, [navigate, redirectTo, role]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isLoginMode) {
        const result = await login(email, password);
        if (!result?.role) {
          clearAccessToken();
          await supabase.auth.signOut({ scope: 'local' });
          setError('Unable to verify your role. Please log in again.');
          return;
        }

        if (result.role !== role) {
          clearAccessToken();
          await supabase.auth.signOut({ scope: 'local' });
          setError(`You are signed in as ${result.role}, not ${role}.`);
          return;
        }

        navigate(redirectTo, { replace: true });
        return;
      }

      await register(fullName, email, password, role);
      setMessage('Account created. Please sign in.');
      setIsLoginMode(true);
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>

        <form onSubmit={onSubmit} className={styles.form}>
          {!isLoginMode && registerEnabled && (
            <input
              className={styles.input}
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          )}

          <input
            className={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          <button className={styles.submitBtn} disabled={loading}>
            {loading ? 'Please wait...' : isLoginMode ? 'Sign In' : 'Create account'}
          </button>
        </form>

        {registerEnabled && (
          <button
            type="button"
            className={styles.switchBtn}
            onClick={() => {
              setIsLoginMode((v) => !v);
              setError('');
              setMessage('');
            }}
          >
            {isLoginMode ? 'Need an account? Register' : 'Have an account? Sign in'}
          </button>
        )}

        {!registerEnabled && (
          <p className={styles.adminNote}>Admin signup is managed by system administrators.</p>
        )}

        {message && <p className={styles.success}>{message}</p>}
        {error && <p className={styles.error}>{error}</p>}

        <Link className={styles.backLink} to="/">Back to landing page</Link>
      </section>
    </main>
  );
}
