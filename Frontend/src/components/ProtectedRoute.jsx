import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { clearAccessToken, getAccessToken, getUserRole } from '../services/api';
import { supabase } from '../services/supabaseClient';

export default function ProtectedRoute({ requiredRole, children }) {
  const location = useLocation();
  const token = getAccessToken();
  const [verifying, setVerifying] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    const verify = async () => {
      if (!token) {
        if (active) {
          setVerifying(false);
          setAllowed(false);
        }
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      const user = data?.user;
      const role = user?.user_metadata?.role || getUserRole();

      if (!active) return;

      if (error || !user) {
        clearAccessToken();
        await supabase.auth.signOut({ scope: 'local' });
        setAllowed(false);
      } else if (requiredRole && role !== requiredRole) {
        clearAccessToken();
        await supabase.auth.signOut({ scope: 'local' });
        setAllowed(false);
      } else {
        setAllowed(true);
      }

      setVerifying(false);
    };

    verify();

    return () => {
      active = false;
    };
  }, [requiredRole, token]);

  if (verifying) return null;

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowed) {
    return <Navigate to="/not-authorized" replace />;
  }

  return children;
}
