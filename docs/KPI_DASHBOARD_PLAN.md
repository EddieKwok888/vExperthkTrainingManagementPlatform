# Business KPI Dashboard Planning

_To be implemented further in Analytics modules (Phase 3+), built atop the current Admin Dashboard Overview._

## Target Management KPIs

1. **Registration Flow:**
   - **Number of Registrations (MTD/YTD):** Track volume of signup growth.
   - **Payment Conversion Rate:** `%` of users who register vs. those who upload valid payment proof.
   - **Pending Payment Count:** Real-time bottleneck indicator requiring admin follow-up.

2. **Course Metrics:**
   - **Course Fill Rate:** `(Enrolled Students / Session Capacity) * 100`. Optimal target > 85%.
   - **Revenue by Course:** Identifies primary cash-cow programs.

3. **Tutor Operations:**
   - **Tutor Utilization Rate:** Number of sessions assigned vs. total available pool.
   - **Attendance Rate:** Average student attendance across sessions.

4. **Quality & Satisfaction:**
   - **Feedback Rating (CSAT/NPS):** Average score pulled from the `feedbacks` collection.
   - **Repeat Student Rate:** Number of students with > 1 registration over total unique students (Indicator of LTV).

## Implementation Strategy

- Data is currently natively tracked in Firestore.
- Future enhancement involves exporting Firestore data to Google BigQuery via Extensions.
- Connect BigQuery to **Looker Studio (Power BI)** for multi-dimensional executive reporting without overloading the application database.
