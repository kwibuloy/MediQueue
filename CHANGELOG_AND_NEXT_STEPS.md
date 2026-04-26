# Mediqueue Frontend Update Handover

Date: 2026-04-26  
Scope: UI/UX revamp, auth/session flow updates, queue status behavior fixes, and integration readiness notes.

## 1) CHANGES

### Landing Page and Navigation
- Reworked landing page into a modern structure with:
  - Hero section and strong CTA
  - "How It Works" 3-step section
  - Key features section
  - "Get Started" role-selection modal
- Role modal now routes to:
  - Patient auth flow (`/patient/auth`) when no session
  - Admin auth flow (`/admin/auth`) when no session
  - Direct dashboard (`/patient` or `/admin`) when a valid matching session exists
- Updated navbar routes to point to dashboards and improved role flow continuity.

### Authentication and Session Handling
- Added reusable role-based auth UI for login/register:
  - `RoleAuthCard` component
  - `PatientAuthPage` and `AdminAuthPage`
- Login now persists:
  - `access_token`
  - `user_role`
- Auth pages now auto-redirect to dashboards if a valid saved session is detected.

### API Layer Improvements
- Updated API client to include `Authorization: Bearer <token>` automatically when available.
- Fixed login token extraction to match backend payload (`session.access_token`).
- Fixed patient status endpoint path from incorrect route to:
  - `/queue/patient-status`
- Hardened API parsing to surface clearer errors when non-JSON responses are returned.

### Patient Dashboard Enhancements
- Added doctor search/filter by:
  - Name
  - Specialty
  - Clinic
- Enhanced doctor cards with richer details:
  - Name, specialty, clinic
  - Queue length (if available)
  - Estimated wait (if available)
- Queue join flow remains one-click and token-based (no manual patient ID input).
- Queue status area improved with:
  - Position/status/wait indicators
  - Auto-refresh support
  - Reduced refresh flicker via silent background sync

### Admin Dashboard Enhancements
- Expanded layout to include:
  - Queue management area
  - Analytics preview area
  - Availability control section
  - Patient logs placeholder area
- Kept currently supported backend actions functional (e.g., call next).
- Added placeholders/messages for controls requiring backend endpoints not yet available.

### Queue Auto Refresh
- Mimicks real time live refresh by refreshing data every 7 seconds using interval polling.


## 2) Backend Integration Needed 

The frontend now has sections/buttons ready, but the following backend capabilities are required for full functionality:

1. **Patient Queue Cancellation**
   - Endpoint needed to cancel current waiting entry for authenticated patient.
   - Suggested: `PATCH /api/queue/cancel` (auth required)

2. **Admin Queue Actions**
   - Mark served
   - Skip patient
   - Close queue
   - Suggested:
     - `PATCH /api/admin/served/:doctorId`
     - `PATCH /api/admin/skip/:doctorId`
     - `PATCH /api/admin/close/:doctorId`

3. **Doctor Availability Toggle**
   - Endpoint to set doctor availability from admin panel.
   - Suggested: `PATCH /api/admin/doctor/:doctorId/availability`

4. **Queue History / Patient Logs**
   - Patient personal queue history endpoint.
   - Admin doctor-specific historical queue logs endpoint.
   - Suggested:
     - `GET /api/queue/history` (patient, auth required)
     - `GET /api/admin/logs/:doctorId`

5. **Analytics Endpoint**
   - Accurate metrics (served today, average wait, peak hours) should come from backend calculations.
   - Suggested: `GET /api/admin/analytics/:doctorId`

6. **Role Enforcement for Admin Routes**
   - Ensure admin routes validate user role = `admin`.
   - Ensure each admin is mapped to one doctor and restricted to that doctor's data/actions.

## 3) Realtime Integration Needed

Current frontend uses interval polling for queue updates.  
To complete the intended realtime experience:

- Add Supabase Realtime subscription strategy for:
  - Queue row inserts/updates/deletes for relevant doctor/patient
- Expose enough metadata in payload to update UI without full refetch.
- Keep polling as fallback for unreliable network conditions.

## 4) Recommended Improvements and Features

### Reliability
- Add token expiry handling:
  - Detect 401 globally
  - Redirect to login with context message
- Add centralized API error model and retry strategy for transient failures.


