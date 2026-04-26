import React from 'react';
import RoleAuthCard from '../components/RoleAuthCard';

export default function AdminAuthPage() {
  return (
    <RoleAuthCard
      role="admin"
      title="Admin Login"
      subtitle="Sign in with your admin email and password."
      redirectTo="/admin"
    />
  );
}
