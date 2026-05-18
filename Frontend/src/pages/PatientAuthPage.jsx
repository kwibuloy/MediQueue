import React from 'react';
import RoleAuthCard from '../components/RoleAuthCard';

export default function PatientAuthPage() {
  return (
    <RoleAuthCard
      role="patient"
      title="Patient Login"
      subtitle="Sign in with your email and password to join queues and track your visit."
      registerTitle="Patient Registration"
      registerSubtitle="Create a patient account to browse doctors and join virtual queues."
      registerEnabled
      redirectTo="/patient"
      backLinkTo="/login"
      backLinkLabel="Back to login options"
    />
  );
}
