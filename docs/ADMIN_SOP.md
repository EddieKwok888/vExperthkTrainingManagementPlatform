# Admin Operation Standard Operating Procedure (SOP)

## 1. Create Course

1. Log in to the Admin Dashboard.
2. Navigate to the **Courses** tab.
3. Scroll to **Create New Course**.
4. Enter the Course Title, Description, and Price (HKD).
5. (Optional) Assign a default Tutor.
6. Click **Create Course**. The course is immediately live and visible to the public.

## 2. Create Session

1. Navigate to the **Course Sessions** tab.
2. Find the relevant course.
3. Add a new session by specifying:
   - Start Date & Time
   - End Date & Time
   - Capacity (Maximum number of students)
   - Location (e.g., Zoom Link or Physical Room)
   - Assigned Tutor
4. Click **Add Session**.

## 3. Assign Tutor

- Tutors can be assigned at the **Course** level (default tutor) or at the **Session** level.
- Ensure the tutor has an account registered and their role is set to `tutor` in the database.

## 4. Verify Payment

1. Navigate to the **Registrations & Payments** tab.
2. Look for registrations with `payment_status` as `pending_verification`.
3. Click **View Proof** to inspect the uploaded payment screenshot.
4. Cross-reference the payment amount, reference number, and timestamp with the company bank account/PayMe records.
5. If valid, click **Mark as Verified**. If invalid, click **Reject**.

## 5. Confirm Registration

1. Once payment is verified, the registration status will automatically progress or can be manually set to `confirmed`.
2. The student will be allocated a seat in the selected session.

## 6. Mark Completion

1. Tutors will mark attendance natively in their Tutor Portal.
2. Admins can override or verify this in the **Registrations** tab.
3. Update the Registration Status to `completed` once the course is finished.

## 7. Export Reports

1. Use the **Export CSV** buttons available at the top right of the dashboard widgets.
2. Select the relevant table (e.g., Registrations, Audit Logs, Feedback).

## 8. Handle Refund Request

1. Search the student's email in the **Registrations** tab.
2. If the refund is approved offline, manually update the `payment_status` to `refunded`.
3. Update `registration_status` to `cancelled`.
4. Release the seat back to the session capacity.

## 9. Handle Student Enquiry

1. For general enquiries handled via the AI chatbot that required escalation, or manual emails received:
2. Review the `feedbacks` or manual inbox.
3. Respond externally via email, and update any system records if the enquiry results in a registration change.
