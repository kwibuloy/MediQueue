import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleAuthCard from '../components/RoleAuthCard';

const INVITATION_VERIFIED_KEY = 'admin_invitation_verified';
const INVITATION_CODE_KEY = 'admin_invitation_code';
const INVITATION_EMAIL_KEY = 'admin_invitation_email';

export default function AdminRegisterPage() {
  const navigate = useNavigate();

  const invitationCode = useMemo(
    () => sessionStorage.getItem(INVITATION_CODE_KEY) || '',
    []
  );

  const invitedEmail = useMemo(
    () => sessionStorage.getItem(INVITATION_EMAIL_KEY) || '',
    []
  );

  useEffect(() => {
    if (sessionStorage.getItem(INVITATION_VERIFIED_KEY) !== 'true' || !invitationCode) {
      navigate('/admin/auth', { replace: true });
    }
  }, [navigate, invitationCode]);

  const handleRegisterSuccess = () => {
    sessionStorage.removeItem(INVITATION_VERIFIED_KEY);
    sessionStorage.removeItem(INVITATION_CODE_KEY);
    sessionStorage.removeItem(INVITATION_EMAIL_KEY);
    navigate('/admin/auth', { replace: true });
  };

  const subtitle = invitedEmail
    ? `Register using the invited email address: ${invitedEmail}`
    : 'Create your admin account with the email you were invited with.';

  return (
    <RoleAuthCard
      role="admin"
      title="Admin Registration"
      subtitle={subtitle}
      registerEnabled
      forceRegisterMode
      hideRegisterToggle
      redirectTo="/admin"
      backLinkTo="/admin/auth"
      backLinkLabel="Back to admin login"
      invitationCode={invitationCode}
      defaultEmail={invitedEmail}
      onRegisterSuccess={handleRegisterSuccess}
    />
  );
}
