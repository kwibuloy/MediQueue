import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAccessToken, getAccessToken, getUserRole, login, register } from '../services/api';
import { supabase } from '../services/supabaseClient';
import styles from './RoleAuthCard.module.css';

export default function RoleAuthCard({
  role,
  title,
  subtitle,
  registerTitle,
  registerSubtitle,
  registerEnabled = false,
  redirectTo,
  forceRegisterMode = false,
  hideRegisterToggle = false,
  backLinkTo = '/',
  backLinkLabel = 'Back to landing page',
  onRegisterSuccess,
  footer,
  invitationCode,
  defaultEmail = '',
}) {
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(!forceRegisterMode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const displayTitle = !isLoginMode && registerTitle ? registerTitle : title;
  const displaySubtitle = !isLoginMode && registerSubtitle ? registerSubtitle : subtitle;

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

      await register({
        firstName,
        lastName,
        email,
        password,
        role,
        invitationCode,
      });
      onRegisterSuccess?.();
      setMessage('Account created. Please sign in.');
      if (!forceRegisterMode) {
        setIsLoginMode(true);
      }
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
        <h1 className={styles.title}>{displayTitle}</h1>
        <p className={styles.subtitle}>{displaySubtitle}</p>

        <form onSubmit={onSubmit} className={styles.form}>
          {!isLoginMode && registerEnabled && (
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

          <button className={styles.submitBtn} disabled={loading}>
            {loading ? 'Please wait...' : isLoginMode ? 'Sign In' : 'Create account'}
          </button>
        </form>

        {registerEnabled && !hideRegisterToggle && (
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

        {footer}

        {message && <p className={styles.success}>{message}</p>}
        {error && <p className={styles.error}>{error}</p>}

        <Link className={styles.backLink} to={backLinkTo}>{backLinkLabel}</Link>
      </section>
    </main>
  );
}
