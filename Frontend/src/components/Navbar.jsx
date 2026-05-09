import React from 'react';
import { NavLink } from 'react-router-dom';
import { getAccessToken, getUserRole } from '../services/api';
import styles from './Navbar.module.css';

export default function Navbar() {
  const token = getAccessToken();
  const role = getUserRole();

  const navItems = [{ to: '/', label: 'Home', end: true }];

  if (token && role === 'admin') {
    navItems.push({ to: '/admin', label: 'Admin Dashboard' });
  } else if (token && role === 'patient') {
    navItems.push({ to: '/patient', label: 'My Status' });
  } else {
    navItems.push({ to: '/login', label: 'Login' });
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <span className={styles.cross}>✚</span>
        <span className={styles.title}>MediQueue</span>
      </div>
      <div className={styles.tabs}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `${styles.tab} ${isActive ? styles.active : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
