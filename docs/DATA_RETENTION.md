# Data Retention & Archiving Policy

## Retention Periods

1. **Registration Records:**
   - Retained for **7 years** for accounting and audit compliance.
   - Archive strategy: Move to cold storage after 3 years of inactivity.

2. **Payment Proofs (Images):**
   - Retained for **1 year** after the course completes.
   - Archive strategy: Delete the base64 / blob data to save storage costs after the financial year audit closes.

3. **Attendance Records & Certificates:**
   - Retained **Indefinitely**.
   - Business Reason: Students may request certificate validation years later.

4. **Feedback:**
   - Retained for **3 years** for internal KPI tracking.

5. **Audit Logs:**
   - Retained for **1 year** in hot storage, exported to CSV cold storage thereafter.

6. **Support Tickets:**
   - Retained for **2 years**.

## Soft Delete Approach

- Permanent deletion (`deleteDoc`) is strictly prohibited in the UI for operational data.
- The platform employs a **Soft Delete** mechanism.
- Records are marked with `is_deleted: true`.
- Firestore queries should be updated to filter `where('is_deleted', '!=', true)` as needed in future scaling.
