import React from 'react';
import RoleAuthCard from '../components/RoleAuthCard';

export default function AdminAuthPage() {
  return (
    <RoleAuthCard
      role="admin"
      title="Admin Login"
      subtitle="Sign in or register with your admin email. If invited, registering will grant admin access."
      redirectTo="/admin"
      registerEnabled={true}
    />
  );
}
