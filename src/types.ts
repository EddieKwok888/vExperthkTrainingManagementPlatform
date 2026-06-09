
export type UserRole = 'admin' | 'tutor' | 'tutor_pt' | 'staff' | 'coordinator' | 'finance' | 'student' | string;
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type EmploymentType = 'full_time' | 'part_time' | 'freelance';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'corporate';
export type CertificationStatus = 'active' | 'expired' | 'pending_verification';

export interface TutorProfile {
  displayName?: string;
  profilePhoto?: string;
  teachingLanguages?: string[];
  hourlyRate?: number;
  employmentType?: EmploymentType;
  bio?: string;
  availableDays?: string[];
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  company?: string;
  status: UserStatus;
  remarks?: string;
  qualifiedCourses?: string[];
  qualifiedCategories?: string[];
  createdAt: any;
  lastLoginAt?: any;
  tutorProfile?: TutorProfile;
}

export interface TutorCertification {
  id: string;
  tutorId: string;
  certificationName: string;
  issuingOrganization: string;
  certificationLevel?: string;
  certificationNumber?: string;
  issueDate: string;
  expiryDate?: string;
  certificateFileUrl?: string;
  verificationUrl?: string;
  status: CertificationStatus;
  remarks?: string;
}

export interface TutorExpertise {
  id: string;
  tutorId: string;
  expertiseArea: string;
  skillLevel: SkillLevel;
  yearsOfExperience: number;
  canTeach: boolean;
  preferredCourseLevel: CourseLevel;
  remarks?: string;
}

export type PromotionType = 'code' | 'bundle';
export type DiscountType = 'fixed';

export interface Promotion {
  id: string;
  name: string;
  code?: string; // Optional if it's an auto-applied bundle
  type: PromotionType;
  discountType: DiscountType;
  discountValue: number;
  conditions?: {
    requiredCourseIds?: string[]; // for bundle (always 2 items)
  };
  applicableCourseIds?: string[]; // empty means all courses
  status: 'active' | 'inactive';
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  usageCount?: number;
  createdAt: any;
  createdByAdminId?: string;
  createdByAdminEmail?: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetCollection: string;
  targetId: string;
  payload?: any;
  createdAt: any;
}
