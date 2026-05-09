# Incident Response Plan

## 1. Severity Levels

- **Sev 1 (Critical):** Data breach, complete system downtime, data corruption.
- **Sev 2 (High):** Major workflow broken (e.g. users cannot register or upload payments).
- **Sev 3 (Medium):** Minor bug affecting a few users, AI returning hallucinated responses.

## 2. Response Workflows

### A. Suspected Data Leak / Unauthorized Access (Sev 1)

- **Owner:** Technical Admin / Security Lead
- **First Response:**
  1. Revoke the suspected user's session.
  2. Implement a lockdown rule in Firestore (`allow read, write: if false;`) if the vulnerability is unpatched.
- **Escalation:** Notify management within 1 hr.
- **Recovery:** Review `audit_logs`, patch the Firestore Security Rules, force re-authentication for all users.

### B. Payment Verification Failure / Mismatch (Sev 2)

- **Owner:** Finance / General Admin
- **First Response:** Halt the user's registration progress by explicitly maintaining `pending_verification`.
- **Escalation:** Contact the user manually for clarification.
- **Recovery:** Ask user to re-submit proof manually via email if system upload is disrupted.

### C. System Downtime (Sev 1/2)

- **Owner:** DevOps / Technical Admin
- **First Response:** Check Google Cloud Run and Firebase Status Dashboards.
- **Escalation:** Notify users via external channels (Email/Social Media) if downtime > 1 hr.
- **Recovery:** Rollback to the previous stable Cloud Run revision if it was caused by a bad deployment.

### D. AI Hallucination / Wrong Answer (Sev 3)

- **Owner:** Content Admin
- **First Response:** Review the AI interaction logs (if captured externally).
- **Escalation:** Update the system prompt in the codebase to strictly enforce `CONFIDENCE_LOW` fallbacks for that specific edge case.
- **Recovery:** Deploy updated frontend with the adjusted AI system prompt.
