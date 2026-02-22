# MediQueue – Feature recommendations

This document summarizes the intended app behavior and recommended next steps for the school project and future integration.

---

## Current flow (implemented)

- **Homepage:** Introduces MediQueue, purpose, convenience stats, and asks “Are you a patient or admin?”
- **Patient:** Join a doctor’s queue and monitor status (position in queue).
- **Admin:** Dashboard to manage a doctor’s queue (view list, call next patient).

---

## Admin dashboard (receptionist) GOAL

| Feature | Description | Priority |
|--------|-------------|----------|
| **Queue management** | View today’s queue per doctor, call next patient, reorder if needed 
| **Operations** | Mark patient as “seen”, cancel/no-show, basic status (waiting / called / in progress / done) 
| **Documents from patients** | Accept uploads (e.g. referral, ID) linked to patient/visit; list and download 
| **Document requests** | Patient can request documents (e.g. medical certificate); admin sees list and marks as “issued” or uploads file 
| **Statistics / analytics** | Peak hours (e.g. visits per hour), average wait time, queue length over time; simple charts 


## Patient – recommended additions

- **Queue status:** Show current position, estimated wait (optional), “You’ve been called” when admin calls next.
- **Document upload:** Before or after joining queue, upload referral/ID for this visit.
- **Document requests:** Request a document (e.g. medical certificate); see status (pending / ready) and download when ready.

---

## Hospital vs mini-admin (future)

- **Hospital = main admin:** One “hospital” tenant; can create departments, doctors, and receptionist accounts.
- **Receptionist / doctor = mini-admin:** Can only manage their own queue(s) and documents; no access to other doctors’ data.
- **Roles:** Super admin (hospital), Receptionist (per doctor or per department), Doctor (optional: view own queue only).

---

## Tech suggestions

- **Documents:** Store files in cloud storage (e.g. S3 or similar), DB stores `patient_id`, `visit_id`, `type`, `url`, `uploaded_at`.
- **Analytics:** Backend endpoints that aggregate by hour/day; frontend uses a small chart library (e.g. Chart.js or Recharts) for peak hours and wait times.
- **Auth (later):** Login for admins (receptionist, doctor, super admin); patients can stay “guest” with optional registration for history and document requests.

---


