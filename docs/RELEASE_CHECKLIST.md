# Pre-Release & Deployment Checklist

To be executed by the DevOps/Lead Engineer prior to transitioning Phase 1 to Production.

## Code & Configuration

- [ ] **Code Committed:** All final changes pushed to the main repository track.
- [ ] **Environment Variables:** `VITE_FIREBASE_*` and `GEMINI_API_KEY` are securely loaded in Google Secret Manager / Cloud Run Envs.
- [ ] **Security Headers:** `nginx.conf.template` configured with `SAMEORIGIN` and `nosniff`.

## Firebase Validation

- [ ] **Rules Deployed:** `firestore.rules` audited and fully deployed.
- [ ] **Indexes Created:** Custom compound indexes required by queries are built in the Firebase Console.
- [ ] **Test Accounts:** Defined `admin`, `tutor`, and `student` test accounts exist and work.
- [ ] **Sample Data Cleaned:** All developer dummy records (e.g. 'test course 123') removed from production DB.
- [ ] **Admin Account Configured:** The primary operations manager has been manually set as `admin` in the DB.

## Infrastructure & Availability

- [ ] **Backup Plan Ready:** Firestore Scheduled Exports are configured using Cloud Scheduler.
- [ ] **Load Testing:** Basic stress test performed to ensure Gemini API quota limits and Cloud Run auto-scaling behave as expected.
- [ ] **Security Checklist Passed:** Completed Phase 5 security audit successfully.
