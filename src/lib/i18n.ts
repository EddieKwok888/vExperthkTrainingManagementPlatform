import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      common: {
        admin: 'Admin',
        tutor: 'Instructor',
        student: 'Student',
        login: 'Log In',
        logout: 'Log Out',
        status_online: 'System Online',
        copyright: 'Training Management System',
        my_courses: 'My Courses'
      },
      nav: {
        overview: 'Overview',
        courses: 'Course Templates',
        sessions: 'Sessions / Intakes',
        scheduling: 'Instructor & Room Schedule',
        registrations: 'Course Payment',
        finance: 'Financial Reports',
        materials: 'Materials',
        certificates: 'Certificates',
        tutors: 'Instructors & Hours',
        feedback: 'Feedback',
        logs: 'System Logs',
        settings: 'School Settings',
        users: 'User Management'
      },
      admin: {
        dashboard_title: 'Admin Control Center',
        enrollment_stats: 'Enrollment Stats',
        reschedule: 'Reschedule Session',
        print_attendance_sheet: 'Export Attendance Sheet',
        current_students: 'Current Students',
        max_capacity: 'Max Capacity'
      },
      tutor: {
        portal_title: 'Instructor Portal',
        my_sessions: 'My Assigned Classes',
        attendance: 'Attendance Management',
        submit_hours: 'Submit Work Hours',
        hours_history: 'Hours History',
        student_name: 'Student Name',
        status: 'Status',
        mark_present: 'Present',
        mark_absent: 'Absent',
        save_attendance: 'Save Attendance',
        date: 'Date',
        hours: 'Hours',
        description: 'Description',
        submit: 'Submit',
        no_sessions: 'No classes assigned yet.',
        upcoming_shifts: 'Upcoming Classes',
        regular: 'Regular'
      }
    }
  },
  'zh-HK': {
    translation: {
      common: {
        admin: '管理員',
        tutor: '講師 (Instructor)',
        student: '學生',
        login: '登錄',
        logout: '登出',
        status_online: '系統在線',
        copyright: '培訓管理系統',
        my_courses: '我的課程'
      },
      nav: {
        overview: '概覽',
        courses: '課程模板',
        sessions: '開班/期次',
        scheduling: '導師及場地日程',
        registrations: '課程繳費 (Course Payment)',
        finance: '財務報表',
        materials: '教材',
        certificates: '證書',
        tutors: '講師與課時',
        feedback: '反饋',
        logs: '系統日誌',
        settings: '學校設置',
        users: '用戶管理'
      },
      admin: {
        dashboard_title: '管理員控制中心',
        enrollment_stats: '報讀情況',
        reschedule: '修改課堂日期',
        print_attendance_sheet: '生成點名紙',
        current_students: '目前人數',
        max_capacity: '名額上限'
      },
      tutor: {
        portal_title: '講師平台 (Instructor)',
        my_sessions: '我的課堂',
        attendance: '考勤管理',
        submit_hours: '提交工作時數',
        hours_history: '時數記錄',
        student_name: '學生姓名',
        status: '狀態',
        mark_present: '出席',
        mark_absent: '缺席',
        save_attendance: '儲存考勤',
        date: '日期',
        hours: '時數',
        description: '描述',
        submit: '提交',
        no_sessions: '目前沒有分配的課堂。',
        upcoming_shifts: '即將到來的課堂',
        regular: '常規'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    }
  });

export default i18n;
