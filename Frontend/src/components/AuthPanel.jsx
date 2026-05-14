import React, { useMemo, useState } from 'react';
import { clearAccessToken, getAccessToken, login, register } from '../services/api';
import styles from './AuthPanel.module.css';

export default function AuthPanel() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sessionVersion, setSessionVersion] = useState(0);

  const hasToken = useMemo(() => !!getAccessToken(), [sessionVersion]);

  const resetFeedback = () => {
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetFeedback();
    setLoading(true);

    try {
      if (isLoginMode) {
        await login(email, password);
        setMessage('You are logged in. You can now join the queue and check status.');
        setSessionVersion((v) => v + 1);
      } else {
        await register({ firstName, lastName, email, password, role: 'patient' });
        setMessage('Registration successful. Please sign in to continue.');
        setIsLoginMode(true);
        setPassword('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAccessToken();
    setSessionVersion((v) => v + 1);
    setMessage('Signed out.');
    setError('');
  };

  return (
    <section className={styles.card}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Patient Session</h2>
        {hasToken && (
          <button type="button" className={styles.secondaryBtn} onClick={handleLogout}>
            Sign out
          </button>
        )}
      </div>

      <p className={styles.sub}>
        {hasToken
          ? 'Authenticated session active.'
          : 'Sign in or register to use queue actions.'}
      </p>

      {!hasToken && (
        <form onSubmit={handleSubmit} className={styles.form}>
          {!isLoginMode && (
            <>
              <input
                className={styles.input}
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <input
                className={styles.input}
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </>
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

          <button type="submit" className={styles.primaryBtn} disabled={loading}>
            {loading ? 'Please wait…' : isLoginMode ? 'Sign in' : 'Register as patient'}
          </button>
        </form>
      )}

      <div className={styles.switchRow}>
        {!hasToken && (
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => {
              setIsLoginMode((v) => !v);
              resetFeedback();
            }}
          >
            {isLoginMode ? 'Need an account? Register' : 'Already have an account? Sign in'}
          </button>
        )}
      </div>

      {message && <p className={styles.success}>{message}</p>}
      {error && <p className={styles.error}>{error}</p>}
    </section>
  );
}
