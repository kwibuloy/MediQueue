import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleAuthCard from '../components/RoleAuthCard';

const INVITATION_VERIFIED_KEY = 'admin_invitation_verified';
const INVITATION_CODE_KEY = 'admin_invitation_code';

export default function AdminRegisterPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem(INVITATION_VERIFIED_KEY) !== 'true') {
      navigate('/admin/auth', { replace: true });
    }
  }, [navigate]);

  const handleRegisterSuccess = () => {
    sessionStorage.removeItem(INVITATION_VERIFIED_KEY);
    sessionStorage.removeItem(INVITATION_CODE_KEY);
    navigate('/admin/auth', { replace: true });
  };

  return (
    <RoleAuthCard
      role="admin"
      title="Admin Registration"
      subtitle="Create your admin account with the email you were invited with."
      registerEnabled
      forceRegisterMode
      hideRegisterToggle
      redirectTo="/admin"
      backLinkTo="/admin/auth"
      backLinkLabel="Back to admin login"
      onRegisterSuccess={handleRegisterSuccess}
    />
  );
}
