import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <span className={styles.cross}>✚</span>
        <span className={styles.title}>MediQueue</span>
      </div>
      <div className={styles.tabs}>
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.active : ''}`
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/patient"
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.active : ''}`
          }
        >
          Patient
        </NavLink>
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.active : ''}`
          }
        >
          Admin
        </NavLink>
      </div>
    </nav>
  );
}
