# Limitation Statement (Phase 1 MVP)

## Scope Awareness

The current deployment of the ProTrain AI Platform represents **Phase 1 (MVP coupled with strong Security Hardening)**. It is designed to modernize existing manual workflows but intentionally defers certain complex automations to future phases.

### What is NOT included in Phase 1:

1. **Full Payment Gateway:** No Stripe, PayPal, or credit card autofill. Payments rely on bank transfer/PayMe screen captures and manual admin approval.
2. **Automatic Payroll:** The system calculates and tracks tutor teaching hours, but actual financial disbursement must be done externally via the company's accounting software.
3. **Official Accounting Integration:** No direct API sync to Xero, QuickBooks, or Oracle.
4. **Full LMS (Learning Management System):** The platform handles _Logistics_, not _Learning_. Video hosting, quizzes, and SCORM packages are not supported.
5. **Student Learning Portal:** Students can view their courses and download certificates, but there is no interactive study materials hub.
6. **Production-grade CRM:** Marketing automation, email drip campaigns, and complex sales funnels require a dedicated CRM (e.g. HubSpot) integration in the future.
7. **Automatic Certificate Generation:** Unless manually mapped, generating the PDF certificate remains a semi-manual workflow trigger.
