# VExpert HK - Training Management System (TMS)

A comprehensive, role-based Training Management System designed to handle courses, user registrations, tutor scheduling, and administrative tasks for educational centers.

## 🚀 Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS & shadcn/ui components
- **Routing**: React Router DOM (v6)
- **Backend & Database**: Firebase (Authentication, Firestore)
- **Internationalization (i18n)**: react-i18next
- **Icons**: Lucide React

## 👥 User Roles & Permissions

The system operates with a robust Role-Based Access Control (RBAC) model:

1. **Admin (`admin`)**: Full access to all system modules, configurations, and user management.
2. **Course Coordinator (`coordinator`)**: Manages courses, schedules, sessions, tutor assignments, and student feedback.
3. **Finance (`finance`)**: Access to financial reports, payment tracking, and transaction records.
4. **Staff / Other (`staff`)**: Operational support, mainly managing active sessions, student attendances, and feedback.
5. **Instructor / Tutor (`tutor` / `tutor_pt`)**: Can view their assigned teaching schedules, mark student attendance, view class rosters, and access teaching materials.
6. **Student (`student`)**: Can browse available courses, register, submit payments, view their enrolled courses, and submit feedback.

## 🌟 Key Features

### For Students
- **Course Catalog**: Browse available course templates and upcoming sessions.
- **Registration**: Enroll in course sessions.
- **My Courses**: View upcoming classes, enrolled sessions, and attendance records.
- **Feedback System**: Submit post-course feedback.

### For Instructors
- **Instructor Dashboard**: Overview of assigned teaching hours.
- **Class Management**: View list of students per class.
- **Attendance Tracking**: Mark student attendance (AM / PM / Evening).
- **Schedule**: View upcoming lessons and shifts.

### For Administrators & Staff (Admin Portal)
- **Course & Session Management**: Create templates, schedule sessions, define pricing and capacities.
- **Registration & Payment**: Track student enrollments, approve payments, and manage invoices.
- **User Management**: Create and manage staff, tutor, and student accounts. Address password resets.
- **Tutor Scheduling**: Assign tutors to specific lessons and manage monthly tutor shifts.
- **Certification**: Issue digital certificates to students upon course completion.
- **Promotions**: Manage discount codes and promotional banners.
- **Audit Logs**: Track system usage and critical data changes.
- **Branch Management**: Set up multiple training location branches.

## 📂 Project Structure

```text
├── src/
│   ├── components/      # Reusable UI components (shadcn/ui, layout components)
│   │   ├── ui/          # Generic UI primitives (Buttons, Inputs, Dialogs)
│   │   └── common/      # Shared components (Chatbot, etc.)
│   ├── features/        # Feature-based module organization
│   │   ├── admin/       # Modules for Admin Dashboard
│   │   ├── courses/     # Public catalog, course details, registration
│   │   ├── instructor/  # Instructor portal and class management
│   │   ├── student/     # Student portal (My Courses)
│   │   ├── payment/     # Checkout and payment status flows
│   │   └── feedback/    # Feedback submission forms
│   ├── lib/             # Utility functions, configurations
│   │   └── firebase.ts  # Firebase configuration and initialization
│   ├── App.tsx          # Main application router and context providers
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles and Tailwind directives
├── firestore.rules      # Firebase security rules
└── package.json         # Project dependencies and npm scripts
```

## 🔒 Security

- **Firestore Rules**: Strict security rules implemented to ensure users can only access and modify data relevant to their specific role.
- **Protected Routes**: Frontend routing enforces role constraints, redirecting unauthorized users automatically.
- **Data Encapsulation**: Tutors can only see their own assigned shifts; students only see their own registrations.

## 🌐 Localization (i18n)

The system supports multi-language capabilities easily switchable via the UI.
- English (`en`)
- Traditional Chinese (`zh-HK`)

## 🛠 Set Up & Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Ensure `.env` contains the required Firebase API keys.
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   # ...other firebase config
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

## 📝 Database Schema (Firestore)

- `users`: User profiles, roles, contact info.
- `courses`: Course templates and descriptions.
- `course_sessions`: Scheduled instances of courses with start/end dates.
- `lessons`: Individual class blocks tied to sessions.
- `registrations`: Student enrollments mapping users to sessions.
- `certificates`: Issued completion certificates.
- `feedbacks`: Submitted course reviews.
- `tutor_shifts`: Monthly scheduling mapping for instructors.
- `audit_logs`: Immutable tracking of critical system operations.
- `branches`: Set up multiple training location branches.

> 📜 **View past updates:** Older update logs have been archived. Please check the [CHANGELOG.md](CHANGELOG.md) file for historical updates.

## 📅 Today's Updates (2026-06-12)

### 1. 🛡️ Duplicate Registration Prevention (防重複報名機制)
- **Validation**: Implemented an automated validation check during course registration to ensure that a student cannot register for the same course session twice using the same email address. This prevents accidental duplicate bookings and keeps class rosters accurate.

### 2. 📅 Unrestricted Weekend Scheduling (解除星期六排堂限制)
- **Holiday System Logic**: Updated the system's underlying holiday and weekend detection logic (`isWeekendOrHoliday`). Saturday is now recognized as a valid, schedulable working day, allowing coordinators to seamlessly schedule Saturday classes and instructor shifts without encountering blockage.

### 3. 🎯 Promo Code Accuracy Fix (優惠代碼修正)
- **Targeted Bundles**: Resolved an issue where purchasing a single course would inadvertently auto-apply bundle-specific promo codes (like `AB Series`). Bundle promotions are now strictly contained within the unified bundle registration flow.

### 4. 📄 Robust PDF Generation (高穩定性 CV 導出)
- **Native PDF Engine Integration**: Completely migrated the "Instructor Profile (CV)" PDF export feature away from problematic browser-capture tools (html2canvas) back to the ultra-fast, native `jsPDF` text rendering engine.
- **Language Translation Fallback**: To elegantly bypass CJK font encoding limitations inherent to `jsPDF` and CSS `oklch` parser crashes, the system now dynamically maps local languages ("廣東話", "普通話") to English equivalents ("Cantonese", "Mandarin") instantly on export, guaranteeing a flawless, searchable, and crash-free PDF output.

### 5. 🚀 Live Production Deployment (系統正式上線)
- **Firebase Hosting Integration**: Configured `firebase.json` and `.firebaserc` to establish a seamless deployment pipeline. The entire React SPA is now successfully built and hosted live on Firebase Hosting, directly integrated with the existing Firebase backend services.
- **Branding Update**: Updated the global application title to correctly display **"VExpert HK - Training Management"** on all browser tabs instead of the default placeholder.

## 📅 Updates (2026-06-11)

### 1. 🔠 Alphabetical Student Roster Sorting (學生名單 A-Z 排序)
- **Attendance Sheets**: The generated PDF Attendance Sheets now sort all student names alphabetically (A-Z) by their first name, ensuring a structured and organized format for instructors during roll call.
- **System Rosters**: The in-app student rosters and certificate generation lists are also strictly sorted case-insensitively to match the printable documents.

### 2. 🚶‍♂️ Walk-in Registration Bypass (即場報名特快通道)
- **Direct Verification**: Added an administrative "Walk-in" registration mode. When staff registers a walk-in student via the internal dashboard links, the system intelligently bypasses the Stripe checkout requirements and automatically marks the payment status as `verified` (Paid), streamlining on-site processing.

### 3. 🎯 Dashboard Navigation & Status Consistency (儀表板導航與狀態統一)
- **Smart Next 7 Days Links**: Clicking a course inside the "Next 7 Days" widget on the Admin Dashboard now flawlessly routes administrators to the exact related class tab. "Open" courses route to the *Active Courses & Intakes* tab, while "Confirmed" courses route seamlessly to the *Confirmed Courses (Attendance)* tab.
- **Global Status Color Standardization**: Harmonized the internal mapping of course statuses. System-wide, the underlying `"full"` status is now strictly displayed as **"Confirmed"** to the user, visually unified with a signature **Blue** badge (`bg-blue-100 text-blue-700`). "Open" status uses an **Emerald Green** badge.

### 4. 🎁 Unified Bundle Registration Flow (全新套裝報名體驗)
- **Frictionless Checkout**: Upgraded the "Special Deals" course bundle display on the homepage. Instead of providing two separate confusing links, students now click a single prominent **"🎁 Register for Bundle"** button.
- **Dual-Session Selection**: The unified bundle registration page seamlessly allows students to pick intake sessions for both Course A and Course B concurrently in a single intuitive form.
- **Automated Calculations**: The system automatically tallies the combined tuition fee, subtracts the bundle discount, and submits both registrations via one linked invoice transaction.
