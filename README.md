# ProTrain AI: Enterprise Training Management Platform

This is a comprehensive platform for managing training schedules, registrations, tutor payments, and student progress with AI-driven RAG assistance for course recommendations and support.

## Phase 5: Security-First Hardening & Production Operations

### Cloud Run Security Preparation
- The backend features a production-ready `Dockerfile` multi-stage build running behind NGINX.
- The `nginx.conf.template` applies important security headers out-of-the-box (`X-Frame-Options`, `X-XSS-Protection`).
- Container exposes port bound to `${PORT}` for zero-downtime deployment compatibility via Google Cloud Run scaling.
- When deploying, ensure the service securely connects to Gemini using **Secret Manager** instead of injecting API keys as plain-text env variables.

### Environment & Secrets Checklist
- `GEMINI_API_KEY`: Kept off client-facing code (or scoped appropriately within server logic/functions when migrating the Gemini call out of the ChatBot).
- All `.env` variations (`.env.local`, `.env.production`) should be tracked in `.gitignore` to prevent secret spills.

### Security Testing Checklist (Phase 5 Completion)
- [x] **Public user cannot access admin dashboard**: `ProtectedRoute` and `firestore.rules` blocks them and prevents queries.
- [x] **Tutor cannot access another tutor's sessions**: `firestore.rules` enforces `resource.data.tutor_id == request.auth.uid`.
- [x] **Tutor cannot read payment proof**: Tutors are blocked from reading the `registrations` collection where base64 payment strings live.
- [x] **Student cannot read another student's registration**: Enforced via `student_id == request.auth.uid`.
- [x] **Student cannot mark payment as paid**: Rules block updates where `payment_status` is forcibly set to anything other than `pending_verification`.
- [x] **Public user cannot read registrations collection**: Reads require authentication.
- [x] **Public user cannot upload unsupported file type**: Type (`image/*`) and size constraints (`2MB`) on the frontend block invalid proofs before reading/upload.
- [x] **AI assistant refuses private data requests**: RAG Instruction prevents revealing internal structure, payment data, and sensitive admin info.
- [x] **Deleted records are soft-deleted, not permanently removed**: Administrative workflows have eschewed `deleteDoc()` mutations in favor of audit-logged state changes.

For further details on Access Control and Incident Response, view `SECURITY.md`.
