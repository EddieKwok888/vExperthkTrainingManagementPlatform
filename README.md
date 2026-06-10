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

## 📅 Today's Updates (2026-06-09)

### 1. 🛡️ Comprehensive RBAC Permission Matrix & Role Configurator
Upgraded the Role-Based Access Control (RBAC) setup to support strict **Cell-by-Cell Permission Controls** for **14 system modules** instead of a subset of features. The grid mapping includes:
- **Overview** (概覽)
- **Templates** (課程模板 - Base course catalog outlines)
- **Courses** (開班/期次 - Actual session runs and timetabled lessons)
- **Certificates** (證書 - Issuing student printable rewards)
- **Instructor & Room Schedule** (導師及場地日程 - Drag-and-drop live rooms)
- **Part-time Instructor** (兼職導師/學時審計 - Review tutor hours worked)
- **Feedback** (意見反饋 - Create and check student course feedback)
- **System Logs** (系統日誌 - Chronological security audit logs trail)
- **Staff Directory** (職員名錄 - Administrator, Coordinator & Tutor rosters)
- **Student Directory** (學生名錄 - Filter student cell digits and status details)
- **Promotions** (推廣優惠 - Code campaigns, referral rewards)
- **Access Control** (權限控制 - Live Interactive Matrix Grid control panel)
- **School Settings** (學校設置 - Invoices and branch configurations)
- **Financial Reports** (財務報表 - Settle tuitions, track register amounts, print PDFs)

### ⚡ 2. Real-Time Dynamic Synchronization (實時更新)
- **Firestore `onSnapshot` Streams**: Shifted permission storage from isolated `localStorage` variables to deep, real-time Firestore listening streams (`settings/role_permissions`).
- **Instant Propagation**: Any permission adjustment applied in the grid updates the database immediately. The updated tab boundaries, action visibility selectors, and read-only flags propagate to all authenticated admins and staff in real-time, instantly blocking or granting access without needing any browser page refresh.
- **Fail-Safe Seeding**: Implemented auto-seeding defaults for `Super Admin`, `Course Coordinator`, `Finance`, and `Staff (Other)` roles to pre-populate custom properties in new database setups safely.

### 🔒 3. Precision Access Guarding & UI Controls
- **ReadOnlyAlert Integration**: Dynamic alerts warning users of their limited permissions show up clearly across the **Staff Directory**, **Student Directory**, and **Access Control** panels if set to `view` access.
- **Action Invalidation**:
  - Hidden critical action triggers (such as *Add Student*, *Add Staff*, *Reset Password* triggers) for users configured with "view-only" permissions.
  - Locked input states in modals (Full Name, Role, Phone, Remarks) dynamically to read-only when accessed by limited views.

### 📅 4. Intake Chronological Sorting & Clean Layout (最近開課排頂及精簡版面)
- **Upcoming Intakes Sorting**: Optimized "Upcoming Intakes" lists across the **Course Catalog (Home)**, **Course Details**, and **Registration Dialogs** to prioritize chronologically closer classes. Open sessions are now automatically sorted by their starting date ascendingly, putting the most immediate available opening at the very top for seamless browsing and pre-selected bookings.
- **Simplified UI**:
  - Removed time displays (hours/minutes clock indicators) from the course catalog details panel based on client feedback, keeping the focus entirely on starting dates and available delivery modes.
  - Removed enrollment seat indicators (such as `● 0/5 Filled`) from the upcoming intakes view so numeric slot counts remain completely clean and elegant.

### 🎓 5. Student Dashboard Enhancements (學生介面優化)
- **Sleeker Class Schedules**: Hid the classroom capacity indicator (e.g., "Persons: 10") across the "My Class Schedule" and "Course Progress" tabs to keep the student interface clean and focused solely on the venue name.
- **Chronological Sorting**: Upcoming classes and enrolled course progresses are now intelligently sorted chronologically by their closest start dates, ensuring students always see their most immediate upcoming lessons first. 
- **Clear Progress Indicators**: Added a bold red "**已完成**" (Completed) badge alongside elegantly greyed-out text for past and completed lessons, making it intuitively easy to visually separate course histories from upcoming classes.
- **Detailed Registration Badging**: Course progress cards now clearly display the exact course date ranges (Start Date to End Date) right on the progress overview screen.

### 🛠️ 6. AdminDashboard Code Slimming & Modal Extraction (代碼瘦身與模組化)
- **UI Decoupling**: Extracted over 15 complex popup `Dialog` components into standalone React components under `src/features/admin/components/modals/`.
- **Improved Maintainability**: Greatly reduced the file size of the primary `AdminDashboard.tsx`, slicing off thousands of lines of markup.
- **Extracted Modals included**: *UserFormModal, SessionCreationModal, SessionEditModal, UserViewModal, CertificateModal, DeleteConfirmModal, PromoModal, AttendanceModal, SessionAttendanceModal, ManualHoursModal, and DeleteLogsModal*.
- **Optimized Props**: Explicit typings, structured callback parameters, and automated lazy loading references help improve long-term scaleable application speed and code legibility without altering functionality.
## 📅 Today's Updates (2026-06-10)

### 1. 🌌 Enterprise Futuristic UI Redesign (企業未來級 UI 升級)
- **Deep Dark Theme & Glassmorphism**: Overhauled the main `Home` dashboard and `CourseDetail` screens to feature a premium dark theme (`#0A0F1C`) with frosted glass components, subtle gradient glows, and neon accents. 
- **Neon Glow Hover Effects**: Introduced immersive interactive micro-animations for course cards, rendering sleek gradient blue and purple tracking borders that illuminate on hover.
- **Dynamic Hero Section**: Redesigned the top landing banner with a tighter layout, reducing excessive padding, while displaying glowing technology grid backgrounds to convey a true "Enterprise Next-Gen" aesthetic.

### 2. 💎 "Special Deals" Component Revamp (精選優惠板塊優化)
- **Full Visibility & Compact Layout**: Redesigned the promotional sidebar into a standalone, fully visible neon-highlighted widget. Removed vertical scrollbars so users can see all bundles and discount coupons at a glance.
- **Micro-Typography**: Scaled down fonts and internal padding intelligently so the Special Deals card acts as a sleek side-widget, preventing it from overpowering the main course listings visually.
- **Neon Highlighting**: Highlighted the Special Deals box with an animated pulse and a gradient `indigo/purple` box shadow to attract immediate user attention.

### 3. 📑 Category-Based Course Selector (全新課程分類選單)
- **Course List Dropdown**: Replaced the standard search and filter row with an intuitive, unified "Course List (By Category)" dropdown selector. Courses are automatically grouped inside elegant `<optgroup>` dropdown blocks based on their database categories.
- **Instant Filtering**: Selecting any course instantly filters the active view to display that exact course's intakes, eliminating unnecessary search steps.
- **"Show All Courses" Toggle**: Integrated a dedicated reset button that re-renders all available classes elegantly into the main grid.

### 4. 📅 Consistent Naming Conventions (Code Title - Start Date 排版規範)
- **Registration Form Standardization**: Refactored the `RegisterCourse.tsx` UI flows to strictly enforce the requested format string: `Code Title - Start Date` across all summary labels and intake selection dropdowns.
- **Bundle Consistency**: Ensured that the multi-course bundle registration workflows also pull the corresponding Course Code strings from the database and properly interpolate them within the cart summaries.

### 5. 👨‍🏫 Instructor Dashboard Refinements (導師介面過濾優化)
- **Status-based Intake Filters**: Instructors' "My Assigned Intakes" view now exclusively focuses on relevant class sessions. Pending or entirely completed historic sessions are cleanly hidden from the immediate view to minimize screen clutter.
