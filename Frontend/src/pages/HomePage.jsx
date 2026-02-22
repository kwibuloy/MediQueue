import React from 'react';
import { Link } from 'react-router-dom';
import styles from './HomePage.module.css';

export default function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.tag}>Welcome</span>
        <h1 className={styles.title}>MediQueue</h1>
        <p className={styles.intro}>
          MediQueue is a digital queue management system for clinics and hospitals.
          It lets patients join a doctor’s queue online and track their position in real time,
          while staff manage queues, call the next patient, and keep operations smooth.
        </p>
      </section>

      <section className={styles.stats}>
        <h2 className={styles.sectionTitle}>Why convenience matters</h2>
        <p className={styles.sectionSub}>
          Digital queues reduce wait anxiety and improve both patient and staff experience.
        </p>
        <ul className={styles.statGrid}>
          <li className={styles.statCard}>
            <span className={styles.statValue}>~40%</span>
            <span className={styles.statLabel}>faster perceived check-in when patients see their position</span>
          </li>
          <li className={styles.statCard}>
            <span className={styles.statValue}>Less crowding</span>
            <span className={styles.statLabel}>patients wait with clarity instead of crowding the counter</span>
          </li>
          <li className={styles.statCard}>
            <span className={styles.statValue}>Better flow</span>
            <span className={styles.statLabel}>receptionists and admins manage one clear queue per doctor</span>
          </li>
        </ul>
      </section>

      <section className={styles.choose}>
        <h2 className={styles.sectionTitle}>How are you using MediQueue?</h2>
        <p className={styles.sectionSub}>
          Choose your role to continue.
        </p>
        <div className={styles.roleCards}>
          <Link to="/patient" className={styles.roleCard}>
            <span className={styles.roleIcon}>👤</span>
            <h3 className={styles.roleTitle}>I’m a patient</h3>
            <p className={styles.roleDesc}>
              Join a doctor’s queue and monitor your status — see your position and when you’re called.
            </p>
            <span className={styles.roleCta}>Go to patient view →</span>
          </Link>
          <Link to="/admin" className={styles.roleCard}>
            <span className={styles.roleIcon}>🖥️</span>
            <h3 className={styles.roleTitle}>I’m an admin / receptionist</h3>
            <p className={styles.roleDesc}>
              Access the admin dashboard to manage the doctor’s queue, operations, and patient flow.
            </p>
            <span className={styles.roleCta}>Go to admin dashboard →</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
