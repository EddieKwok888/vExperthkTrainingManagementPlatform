# User Acceptance Testing (UAT) Checklist

## Environment constraints

Ensure testing is done on the Staging/Pre-production URL.

## 1. Public & Student Scenarios

- [ ] **Public Course Browsing:** User can view active courses without logging in.
- [ ] **AI Enquiry:** AI chatbot answers strictly based on course context and rejects private info queries securely.
- [ ] **Student Registration:** User can authenticate via Google and fill out registration form.
- [ ] **Payment Proof Upload:**
  - Fails if file > 2MB.
  - Fails if file is not an image.
  - Succeeds with valid image and updates status to `pending_verification`.
- [ ] **Student Dashboard (My Courses):** User sees accurate enrollment status.

## 2. Tutor Scenarios

- [ ] **Tutor Login:** Successfully logs in and accesses specific `/tutor` route.
- [ ] **Access Control:** Tutor is blocked from `/admin`.
- [ ] **Attendance Marking:** Tutor can check off students and save attendance to the session.
- [ ] **Hours Submission:** Tutor can submit teaching hours and view them as `pending_approval`.

## 3. Admin Scenarios

- [ ] **Role Validation:** Only users explicitly containing the `admin` role can access `/admin`.
- [ ] **Payment Verification:** Admin can view base64 payment proof image and click `Verify` or `Reject`.
- [ ] **Course Management:** Admin can create courses and associate sessions.
- [ ] **Hours Approval:** Admin can approve/pay submitted tutor teaching hours.
- [ ] **Audit Trail:** Admin can view the immutable System Logs and verify recent actions.
- [ ] **CSV Export:** Admin can click "Export" on data tables and successfully download valid `.csv` files.

## 4. Security & Edge Cases

- [ ] **Object-Level Security:** Attempting to fetch another user's registration via direct network manipulation returns `Permission Denied` from Firestore.
- [ ] **Role Manipulation:** User cannot escalate their own role within the client.
