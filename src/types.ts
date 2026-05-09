
export type UserRole = 'admin' | 'tutor' | 'student';
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
  status: UserStatus;
  remarks?: string;
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
