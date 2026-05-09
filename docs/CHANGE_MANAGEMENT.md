# Change Request & Issue Management

## Change Management Process

All system changes, feature requests, and bug reports should be documented and tracked.

### Priority Levels

- **Low:** Cosmetic issues, minor inconveniences.
- **Medium:** Non-critical bugs, nice-to-have features.
- **High:** Critical workflow disruptions (e.g. cannot mark attendance).
- **Critical:** System downtime, security breach, payment failure.

### Status Flow

`Requested` -> `Approved` -> `In Progress` -> `Completed` / `Rejected`

### Logging Format (Example)

| ID      | Type    | Priority | Status      | Requester  | Business Reason                                              |
| ------- | ------- | -------- | ----------- | ---------- | ------------------------------------------------------------ |
| CR-001  | Feature | Medium   | Approved    | Tutor Team | Need ability to export attendance to CSV for offline backup. |
| BUG-002 | Bug     | High     | In Progress | Ops Admin  | Payment proof upload fails for HEIC images from iPhones.     |

_Action:_ Use a shared Google Sheet or Jira/Trello board to maintain this exact log schema alongside the development team.
