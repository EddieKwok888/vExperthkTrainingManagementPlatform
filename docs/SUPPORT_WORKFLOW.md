# Customer Support & Ticketing Workflow

_Note: In Phase 1 MVP, support is managed externally via designated email and escalated AI chat logs. This outlines the SOP._

## 1. Support Ticket Categories

- **Payment Issue:** Incorrect proof uploaded, missing funds.
- **Technical Issue:** Cannot login, page errors.
- **Course Enquiry:** Details not covered by the AI.
- **Refund/Cancellation:** Requests to drop out.

## 2. Enquiry Status Flow

1. **New / Unassigned:** Incoming escalation from AI Chatbot or direct email.
2. **In Progress:** Support agent is investigating (e.g. checking bank logs).
3. **Pending User Response:** Waiting for the student to reply with details.
4. **Resolved:** Issue fixed.
5. **Closed:** Issue completed or duplicate.

## 3. Responsible Owner

- L1 Support: General Admin (Handling course details, proof rejects).
- L2 Support: Finance (Processing refunds and bank missing transfers).
- L3 Support: Technical Admin (Fixing login / system bugs).

## 4. Escalation Path

- If AI Chatbot gives `CONFIDENCE_LOW`, it prompts the user to email support.
- If it's a technical bug, the General Admin logs it in the **Change Request Log**.
- If it's a dispute, it is escalated to the Training Center Manager.

## 5. Close Ticket Reason

Always log a closure reason in the CRM or email thread:

- `Resolved - System Fixed`
- `Resolved - User educated`
- `Rejected - Invalid request`
- `Duplicate`
