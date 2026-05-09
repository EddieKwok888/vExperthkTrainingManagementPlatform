# Data Invariants

1. A User can only be created as a student by default. Roles (tutor, admin) must be assigned by an existing admin via the `users` collection or a server-side process, never self-assigned.
2. A Course Template can only be managed by an Admin.
3. A Course Session (Intake) can only be managed by an Admin. It must link to a valid Course Template.
4. A Lesson must be linked to a valid Course Session.
5. A Registration must be linked to a valid Course Session.
6. Attendance can only be recorded by the assigned instructor of the lesson or an admin.
7. Teaching Hours must be linked to a valid Lesson and Session.

# The "Dirty Dozen" Payloads

1. **Role Escalation**: Payload with `role: admin` trying to create a User profile. (Rejected by `isValidUser` checking role).
2. **Ghost Field Injection**: Adding `isVerified: true` to a Registration document. (Rejected by `affectedKeys().hasOnly()`).
3. **Identity Spoofing**: Student trying to create a registration for another `studentId`. (Rejected by `incoming().studentId == request.auth.uid`).
4. **Relational Orphan**: Creating a Lesson for a non-existent Session. (Rejected by `exists()` on parent session).
5. **Session Takeover**: Non-admin trying to update `tutorId` on a Course Session.
6. **Attendance Fraud**: Student trying to mark themselves as `present`. (Rejected by `isTutor()` check on attendance writes).
7. **Hours Padding**: Instructor trying to log 24 hours for a 2-hour lesson. (Rejected by `incoming().hours <= 8`).
8. **PII Leak**: Non-admin user trying to list all `users` and their emails. (Rejected by `allow list: if isAdmin()`).
9. **Status Shortcut**: Student trying to set their own registration `status` to `verified`. (Rejected by `affectedKeys().hasOnly()` on update).
10. **ID Poisoning**: Injecting a 2MB string as a `lessonId`. (Rejected by `isValidId()`).
11. **Cross-Tenant Access**: Instructor A trying to read Attendance for Instructor B's lesson. (Rejected by `resource.data.tutorId == request.auth.uid`).
12. **Unverified Write**: An unverified email user trying to create a course template. (Rejected by `request.auth.token.email_verified == true`).

# Test Runner assertions
- `registrations` create: fails if `status != 'pending'`
- `lessons` read: fails for students (unless enrolled - simplified to Admin/Instructor for now)
- `attendance` write: fails for students
- `teaching_hours` approve: fails for instructors
