# MTM Report Logic Rules

*Note: Documented on 2026-06-12 based on final confirmation.*

## Data Source
The MTM (Metrics That Matter) Report generates data exclusively using the cached component state (`sessions`, `courses`) directly from the UI. It does **not** perform independent database fetch queries (`getDocs`) to prevent mismatches caused by Firebase security rules or race conditions. What you see in the UI is exactly what the report will parse.

## Display Criteria
A session will ONLY be displayed on the MTM Report if it meets ALL of the following criteria:

1. **Assigned to the Specific Tutor**: The session's `tutorId` must match the tutor ID currently being viewed.
2. **Matching MTM Year**: The session's `startDate` must fall within the selected `mtmYear` filter.
3. **Microsoft Category**: 
   - The associated Course's `category`, `title`, or `certName` must contain "microsoft".
   - OR the Course's `courseCode` or Session's `sessionName` must match Microsoft specific prefixes: `MS-`, `AZ-`, `DP-`, `AI-`, `SC-`, `PL-`, `MB-`, or `AB-`.
4. **Confirmed Status**: The session must have a `sessionStatus` of either:
   - `confirmed`
   - `full`
   - `completed`
   *If a session is just `assigned`, `open`, or `scheduled` but not officially confirmed/full, it will NOT be included in the PDF report.*
5. **Non-Zero Hours**: Any session that results in `0` hours calculated (e.g. invalid times) will be excluded from the final PDF.

## Hours Calculation
The total hours for a session are automatically calculated by taking the session's duration (e.g., 09:00 to 17:00 minus 1 hour lunch = 7 hours) and multiplying it by the number of days the course runs (`course.day`). 
Manual adjustments can still be made using the "Add Manual MTM Record" button if needed.
