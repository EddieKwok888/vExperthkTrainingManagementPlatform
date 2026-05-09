# Enterprise Features Roadmap

This document outlines the planned future features and migrations for the Professional Training Management Platform.

## 1. Identity & Access Management
*   **SSO Login:** Integrate SAML/OIDC for corporate clients.
*   **Microsoft Entra ID Integration:** Sync user directories and provide seamless login for enterprise users.
*   **Role-Based Access Control (RBAC) V2:** Implement granular permissions system.

## 2. Integration & Ecosystem
*   **Microsoft Teams Integration:** Automated session scheduling and notification sync into MS Teams.
*   **Power BI Reporting:** Export real-time operational data schemas or build a direct connector for BI analytics.

## 3. LMS & Learning Experience
*   **LMS Video Platform:** Host proprietary course recordings securely with adaptive streaming and watermark protection.
*   **AI Tutor Assistant:** Implement contextual AI-driven Q&A within the course content.
*   **Cantonese AI Voice Assistant:** Offer native TTS/STT capabilities in Cantonese for regional user adoption.

## 4. Globalization & Localization
*   **Multi-Language Support:** I18n architecture to support En, Zh-HK, Zh-CN dynamically.
*   **Local Payment Flow Support:** Native integration with FPS, PayMe, and local bank portals.

## 5. Operations & Workflow
*   **Corporate Approval Workflow:** Introduce B2B company portal where HR can approve training budgets before enrollment.
*   **Automated Certificate Dispatch:** Configure AI agents to review completion criteria and issue verifiable digital credentials via blockchain.

## 6. Architecture & Migration Path
*   **Service Abstraction Layer:** Moving towards a repository pattern where data stores (e.g., Firestore vs. PostgreSQL) can be swapped out modularly.
*   **Self-Hosting & Open Source:** Provide Ubuntu Server automated deployment scripts (Ansible/Docker Compose) for high security data-sovereign enterprise environments.
