# Security & Production Hardening Guide

## 1. Role-Based Access Control (RBAC)
We enforce security at the database level using **Firestore Security Rules**, rather than just hiding UI elements.
- **Admin**: Can read and write all collections. Used for dashboard administration and payment verification.
- **Tutor**: Can read and write only to their assigned `teaching_hours` and `attendance` sheets. Can read `feedbacks` and active `courses`.
- **Student**: Can only read and update their own `registrations` and `certificates`.
- **Public**: Can only read active `courses` and `course_sessions`.

> **Note on Custom Claims**: Currently, roles are maintained via the `users` collection. In a production environment, you should issue Firebase Auth Custom Claims (`admin`, `tutor`) through a serverless Cloud Function when a user's role is updated, avoiding an extra client-side read.

## 2. Protected Collections and Assets
- **Payment Proofs**: Base64 strings embedded in `registrations` documents. Rules strictly allow only Admins to read the entire `registrations` collection, preventing students or tutors from downloading others' proofs.
- **Tutor Payroll (`teaching_hours`)**: Restricted so only the specific tutor and Admins can view.
- **Feedback**: Anonymous to the public, readable only by Tutors and Admins.
- **System Logs (`error_logs`, `audit_logs`)**: Strictly readable only by Admins. They are immutable and cannot be modified or deleted.

## 3. Environment Variables
Local development requires the following file:
```
# .env.example
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
GEMINI_API_KEY=your_gemini_key (For server-side usage if deployed on Cloud Run)
```
> **Warning**: Never commit the real `.env` file containing the `GEMINI_API_KEY` to public Git repositories.

## 4. Cloud Run Deployment Security Notes
- Run the container under a **restricted Service Account** with minimal IAM privileges—only access to Secret Manager and Firebase necessary to run the service.
- The default `Compute Engine` service account should not be used.
- Ensure the NGINX configuration disables older TLS versions and removes identifiable server headers (e.g. `server_tokens off;`).
- Expose the API through a load balancer to enable Cloud Armor (WAF) for rate limiting and DDoS protection.

## 5. Input Validation & Verification
- We strictly validate payment proof uploads before reading them (max `2MB` per image, strict MIME type matching).
- Users cannot mutate their own payment status to `verified`. They can only set it to `pending_verification` when submitting a proof.
- Registrations are tied explicitly to the student's UID and validated during `get()` and `update()` workflows.

## 6. Backup and Recovery
- All tables support soft deletion using `is_deleted: true` or a `deleted_at` field (if expanded later).
- Do not permanently delete critical operational records like `registrations` or `payments`.
- We recommend scheduling nightly **Firestore Managed Exports** via a Cloud Scheduler cron job triggering the `gcloud firestore export` service.
- In the event of data loss, import the subset of data directly into the specified bucket.

## 7. AI & Prompt Injection Safety
- The RAG Assistant (GenAI) is sandboxed with critical system instructions forbidding the release of student data, payment proofs or internal system architectures.
- The assistant is provided only public `courses`, `course_sessions`, and approved `knowledge_base` entries as context.

## 8. Incident Response
If a security breach is detected:
1. Revoke the affected user's session from the Firebase Admin Console.
2. Search `audit_logs` where `user_id` matches the compromised account to trace changes.
3. Review `error_logs` for any tampering attempts.
4. If the database schema is at risk, deploy a blanket `allow read, write: if false;` to Firestore rules temporarily while mitigating.
