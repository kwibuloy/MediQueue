import React from 'react';
import RoleAuthCard from '../components/RoleAuthCard';

export default function PatientAuthPage() {
  return (
    <RoleAuthCard
      role="patient"
      title="Patient Login / Register"
      subtitle="Access your account with your email and password."
      registerEnabled
      redirectTo="/patient"
    />
  );
}
