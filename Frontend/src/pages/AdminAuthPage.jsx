import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleAuthCard from '../components/RoleAuthCard';
import { validateInvitationCode } from '../services/api';
import styles from '../components/RoleAuthCard.module.css';

const INVITATION_VERIFIED_KEY = 'admin_invitation_verified';
const INVITATION_CODE_KEY = 'admin_invitation_code';
const INVITATION_EMAIL_KEY = 'admin_invitation_email';

export default function AdminAuthPage() {
  const navigate = useNavigate();
  const [invitationCode, setInvitationCode] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const handleInvitationSubmit = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteLoading(true);

    try {
      const trimmed = invitationCode.trim();
      const result = await validateInvitationCode(trimmed);
      sessionStorage.setItem(INVITATION_CODE_KEY, trimmed);
      sessionStorage.setItem(INVITATION_VERIFIED_KEY, 'true');
      if (result?.email) {
        sessionStorage.setItem(INVITATION_EMAIL_KEY, result.email);
      }
      navigate('/admin/register', { replace: true });
    } catch (err) {
      setInviteError(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const invitationSection = (
    <div className={styles.inviteSection}>
      <p className={styles.inviteLabel}>Enter an invitation code</p>
      <form onSubmit={handleInvitationSubmit} className={styles.inviteForm}>
        <input
          className={styles.input}
          type="text"
          placeholder="Invitation code"
          value={invitationCode}
          onChange={(e) => setInvitationCode(e.target.value)}
          required
          autoComplete="off"
        />
        <button className={styles.inviteBtn} type="submit" disabled={inviteLoading}>
          {inviteLoading ? 'Checking...' : 'Continue to registration'}
        </button>
      </form>
      {inviteError && <p className={styles.error}>{inviteError}</p>}
    </div>
  );

  return (
    <RoleAuthCard
      role="admin"
      title="Admin Login"
      subtitle="Sign in with your admin email and password."
      redirectTo="/admin"
      backLinkTo="/login"
      backLinkLabel="Back to login options"
      footer={invitationSection}
    />
  );
}
