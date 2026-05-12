import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { getAccessToken, getUserRole } from '../services/api';
import { supabase } from '../services/supabaseClient';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [token, setToken] = useState(getAccessToken());
  const [role, setRole] = useState(getUserRole());

  useEffect(() => {
    let active = true;

    const syncAuthState = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      const sessionToken = data?.session?.access_token || getAccessToken();
      const sessionRole = data?.session?.user?.user_metadata?.role || getUserRole();

      setToken(sessionToken || null);
      setRole(sessionRole || null);
    };

    syncAuthState();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      syncAuthState();
    });

    const handleStorageChange = () => {
      setToken(getAccessToken());
      setRole(getUserRole());
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      active = false;
      listener?.subscription?.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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
