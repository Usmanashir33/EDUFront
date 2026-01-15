


export type UserRole = 'director' | 'teacher' | 'staff' | 'student';

export interface School {
  id: string;
  name: string;
  address: string;
  studentCount: number;
  image: string;
  headerTemplate?: string; // URL/Base64 of the letterhead/header
}

export interface Director {
  fullname: string;
  email: string;
  phone: string;
  title: string;
  picture?: string;
}

export interface SessionData {
  role: UserRole;
  userId: string;
  schoolId?: string;
  timestamp: number;
}

export enum ViewState {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  VERIFY = 'VERIFY',
  SELECT_SCHOOL = 'SELECT_SCHOOL',
  DASHBOARD = 'DASHBOARD',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD'
}

// --- DJANGO MODEL MAPPINGS ---

export type Gender = 'Male' | 'Female' | 'Other';

export interface SchoolSection {
  id: string;
  name: string; // e.g. "SS1", "Junior Secondary"
  schoolId?: string;
  headTeacherId?: string; // Section Head / Coordinator
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "SS1 A"
  sectionId: string; // ForeignKey to SchoolSection
  classTeacherId?: string; // ForeignKey to Teacher (Class Head Teacher)
}

export interface SubjectAssignment {
  classId: string;
  teacherId: string;
}

export interface Subject {
  id: string;
  name: string; // e.g. "Mathematics"
  code: string; // e.g. "MTH101"
  classRoomIds: string[]; // ManyToMany to ClassRoom
  teacherIds: string[]; // ManyToMany to Teacher
  assignments?: SubjectAssignment[]; // Specific teacher assignments per class
}

export interface PaymentBreakdown {
  baseSalary: string;
  bonus: string;
  bonusRemark: string;
  deductions: string;
  deductionRemark: string;
  tax: string;
  netSalary: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: string;
  status: string;
  month: string;
  transactionRef: string;
  breakdown?: PaymentBreakdown;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface DisciplinaryRecord {
  id: string;
  date: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High'; // Severity of the record
}

export interface KYCDocument {
  type: string;
  name: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  url?: string;
}

export interface KYCInfo {
  isVerified: boolean;
  documents: KYCDocument[];
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  title?: string;
  gender: Gender;
  picture?: string;
  nin?: string; // National Identity Number
  dateOfBirth?: string;
  phone: string;
  address?: string;
  
  // Relationships
  sectionIds: string[]; // ManyToMany to SchoolSection
  staffId: string;
  joinedAt: string;

  // Extended properties needed for TeacherManager
  status: 'Active' | 'Inactive' | 'Suspended';
  salary?: string;
  paymentHistory?: PaymentRecord[];
  
  // New Fields
  bankDetails?: BankDetails;
  disciplinaryRecords?: DisciplinaryRecord[];
  kyc?: KYCInfo;
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: Gender;
  picture?: string;
  nin?: string; // National Identity Number
  address?: string;
  
  // Job Info
  role: string; // e.g., 'Driver', 'Security', 'Bursar'
  department: string; // e.g., 'Transport', 'Security', 'Admin'
  staffId: string;
  joinedAt: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  salary?: string;
  
  // Finance
  bankDetails?: BankDetails;
  paymentHistory?: PaymentRecord[];

  // KYC
  kyc?: KYCInfo;
}

// --- NEW STUDENT STRUCTURES ---

export interface Guardian {
  fullName: string;
  relationship: string; // Father, Mother, Guardian
  phone: string;
  email?: string;
  address: string;
  altPhone?: string;
}

export interface Grade {
  subjectId: string;
  score: number; // 0-100
  remark: string; // Excellent, Good, Poor
}

export interface AcademicRecord {
  classRoomId: string;
  session: string; // e.g., "2023/2024"
  grades: Grade[];
  attendancePercentage: number;
  behaviorComment: string; // "Good", "Disruptive"
  isGoodRecord: boolean; // Computed or stored
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  gender: Gender;
  picture?: string; // URL
  nin?: string; // National Identity Number
  
  // Relationships
  classRoomIds: string[]; 
  
  admissionNumber: string;
  dateOfBirth?: string;
  joinedAt: string;
  
  status: 'Active' | 'Inactive' | 'Suspended';
  
  // Expanded Details
  guardian: Guardian;
  academicHistory: AcademicRecord[];
}

// --- FINANCE TYPES ---

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: 'FEES' | 'SALARY' | 'MAINTENANCE' | 'OTHER';
  amount: number;
  description: string;
  date: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  reference: string;
}

export interface FeeRecord {
    id: string;
    studentId: string;
    session: string;
    term: string;
    amountPaid: number;
    totalDue: number;
    status: 'PAID' | 'PARTIAL' | 'UNPAID';
    lastPaymentDate?: string;
}

// --- ACTIVITY LOG ---
export interface ActivityLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SUSPEND' | 'LOGIN' | 'PAYMENT';
  module: 'STUDENTS' | 'TEACHERS' | 'STAFF' | 'ACADEMICS' | 'FINANCE' | 'SETTINGS' | 'PROFILE';
  description: string;
  timestamp: number;
  user: string;
}
