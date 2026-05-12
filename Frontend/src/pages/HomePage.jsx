import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccessToken, getUserRole } from '../services/api';
import styles from './HomePage.module.css';

export default function HomePage() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const goToRole = (role) => {
    const token = getAccessToken();
    const savedRole = getUserRole();

    if (token) {
      if (savedRole === role) {
        navigate(role === 'patient' ? '/patient' : '/admin');
      } else {
        navigate('/not-authorized');
      }
      return;
    }

    navigate(role === 'patient' ? '/patient/auth' : '/admin/auth');
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.tag}>Mediqueue</span>
        <h1 className={styles.title}>Skip the wait. Queue smarter. Get seen faster.</h1>
        <p className={styles.intro}>
          Mediqueue helps patients and clinics manage appointments through a real-time digital queue,
          reducing waiting-room congestion and making queue movement visible for everyone.
        </p>
        <button className={styles.getStartedBtn} onClick={() => setOpen(true)}>Get Started</button>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <div className={styles.steps}>
          <article className={styles.step}>
            <span className={styles.stepNum}>1</span>
            <h3>Choose a doctor</h3>
            <p>Browse available doctors and find the right match by specialty or clinic.</p>
          </article>
          <article className={styles.step}>
            <span className={styles.stepNum}>2</span>
            <h3>Join the queue</h3>
            <p>Join with one click after sign in. No manual patient ID entry needed.</p>
          </article>
          <article className={styles.step}>
            <span className={styles.stepNum}>3</span>
            <h3>Get notified</h3>
            <p>Track your live queue status and be ready when your turn is near.</p>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Key Features</h2>
        <p className={styles.sectionSub}>
          Designed for faster patient flow and clearer clinic operations.
        </p>
        <ul className={styles.featureGrid}>
          <li className={styles.featureCard}>
            <span className={styles.featureTitle}>Real-time queue tracking</span>
            <span className={styles.featureLabel}>See queue movement as patients are called.</span>
          </li>
          <li className={styles.featureCard}>
            <span className={styles.featureTitle}>No physical waiting</span>
            <span className={styles.featureLabel}>Patients stay informed without crowding the front desk.</span>
          </li>
          <li className={styles.featureCard}>
            <span className={styles.featureTitle}>Live queue status</span>
            <span className={styles.featureLabel}>Know your position, status, and estimated waiting time.</span>
          </li>
          <li className={styles.featureCard}>
            <span className={styles.featureTitle}>Doctor-focused admin view</span>
            <span className={styles.featureLabel}>Each admin manages one doctor queue with clear controls.</span>
          </li>
        </ul>
      </section>

      {open && (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className={styles.modal}>
            <h3>Select your role</h3>
            <p>Choose where to continue.</p>
            <div className={styles.modalActions}>
              <button
                className={styles.roleBtn}
                onClick={() => {
                  setOpen(false);
                  goToRole('patient');
                }}
              >
                🧑‍⚕️ Patient
              </button>
              <button
                className={styles.roleBtn}
                onClick={() => {
                  setOpen(false);
                  goToRole('admin');
                }}
              >
                🛠️ Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
