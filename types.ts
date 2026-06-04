


export type UserRole = 'director' | 'teacher' | 'staff' | 'student' | "parent";

export interface School {
  id: string;
  name: string;
  address: string;
  studentCount: number;
  image: string;
  headerTemplate?: string; // URL/Base64 of the letterhead/header
}

// Updated to match Django Model
export interface Director {
  id: string; // CharField max_length=25
  title: string;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  gender: Gender;
  phone: string;
  picture?: string;
}


export interface SessionData {
  role: string;
  user: any;
  school?: any;
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
  credits?: string | number; // e.g. "3hrs/week"
  classRoomIds?: string[]; // ManyToMany to ClassRoom
  teacherIds?: string[]; // ManyToMany to Teacher
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
  title: string;
  description: string;
  school?: string;/// the school id for verification
  teacher?: string;// the teacher for forign key connection 
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
  // Roles & Permissions Links

}


// --- DJANGO ROLE & PERMISSION MODELS ---
export interface SchoolPermission {
  id: string;
  school?: string;
  name: string;
  description: string;
}

export interface SchoolRole {
  id: string;
  school?: string;
  name: string;
  description: string;
  permissions?: any[]; // For easier frontend handling, we can store the full permission objects here
  permissionIds?: string[]; // List of permission IDs for quick checks
  users?: string[]; // List of permission IDs for quick checks
}


// Updated to match Django Model + Frontend extensions
export interface Teacher {
  id: string; // CharField(max_length=25)
  // User OneToOne relation handled via auth/API usually, but we keep fields here

  firstName: string; // first_name
  lastName: string;  // last_name
  middleName?: string; // middle_name
  email: string;
  gender: Gender;
  title: string; // title
  picture?: string; // picture
  dateOfBirth?: string; // date_of_birth
  phone: string;

  // Relationships
  schoolId?: string; // ForeignKey to School
  classRoomIds: string[]; // ManyToMany to ClassRoom
  role: string; // default 'Teacher'

  staffId: string; // staff_id (Unique)
  joinedAt: string; // joined_at

  // --- Frontend / Extended Logic Fields (Not in Django model snippet, likely related models) ---
  sectionIds: string[]; // Helper for UI grouping
  address?: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  salary?: string;
  bankDetails?: BankDetails;

  paymentHistory?: PaymentRecord[];
  disciplinaryRecords?: DisciplinaryRecord[];
  kyc?: KYCInfo;
  nin?: string;
  schoolRoleIds?: string[];

}
// --- ActivityRole Model ---
export interface ActivityRole {
  id: string; // CharField(max_length=25)
  role: 'security' | 'cleaner' | 'driver' | 'staff'; // NSA_CHOICES
  rank: 'header' | 'vice' | 'standerd'; // NSA_RANKS
  active: boolean;
  description: string;
  dateAssigned?: string;
}
// Updated Staff to match Django Model
export interface Staff {
  id: string; // CharField(max_length=25)

  firstName: string; // first_name
  lastName: string;  // last_name
  middleName?: string; // middle_name
  email: string; // email
  title: string; // title
  gender: Gender; // gender

  picture?: string; // picture
  dateOfBirth?: string; // date_of_birth
  phone: string; // phone

  schoolId?: string; // school ForeignKey

  role: string; // role (CharField default 'Staff')
  activityRole?: ActivityRole; // ForeignKey to ActivityRole

  address?: string; // address
  staffId: string; // staff_id (Unique)
  joinedAt: string; // joined_at

  // --- Frontend Extensions ---
  status: 'Active' | 'Inactive' | 'Suspended';
  salary?: string;

  // Finance
  bankDetails?: BankDetails;
  paymentHistory?: PaymentRecord[];

  // KYC
  kyc?: KYCInfo;
  nin?: string; // Usually part of profile but not in model snippet explicitly
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
// --- RESULT / GRADEBOOK TYPES ---
export interface StudentScore {
  studentId: string;
  ca1: number; // e.g. 20
  ca2: number; // e.g. 20
  exam: number; // e.g. 60
  total: number; // Calculated
  grade: string; // A, B, C...
  remark: string;
}


export interface ApprovalRecord {
  id: string;
  description: string;
  timestamp: number;
  directorName: string;
  batchCount: number;
}

export interface ResultBatch {
  id: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  session: string;
  term: string;
  isUploaded: boolean;
  isLocked: boolean;
  lastUpdated?: string;
  scores: StudentScore[];
  status: string
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
  active_class_rooms?: string[]; // For quick access to currently active class rooms

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
  created_at: number;
  user: string;
  school?: string;
  userName?: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Early';

export interface AttendanceRecord {
  id: string;
  school?: string;

  userId: string;
  userType?: 'teacher' | 'staff' | 'student';
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  remarks?: string;
  mode?: string;
}
export interface Device {
  id: string;
  school?: string;
  name: string;
  type: 'Fingerprint Scanner' | 'Camera' | 'Other';
  purpose: 'Attendance' | 'Other';
  uniqueCode?: string;
  status: 'Active' | 'Inactive';
  connectivity: 'Connected' | 'Disconnected';
  location: string;
  lastSeen?: string;
  createdAt: string;
}
export interface BiometricIdentity {
  id: string;
  school?: string;
  userId: string;
  userName?: string;
  userData?: any; // Can hold additional user info for display (e.g. name, admission number)
  userType?: 'teacher' | 'staff' | 'student';
  faceRegistered: boolean;
  faceData?: string[]; // Array of image URLs or base64 (mini video frames)
  fingerprintRegistered: boolean;
  fingerprintId?: string; // Simulated ID
  livePhoto?: string; // The "live picture" the user requested
  status: 'Active' | 'Inactive';
  lastUpdated: string;
  createdAt: string;
}

export interface ClassFeeSetting {
  id: string;
  name: string; // e.g. "Default Fee", "Special Fee"
  // school: string;
  classIds: any[]; // For easier frontend handling, we can store the full class objects here
  // session: string;
  createdAt: string;
  updatedAt: string;
  // term: string;
  amount: number;
}

export interface ParentPaymentInitiation {
  id: string;
  parentId: string;
  studentIds: string[];
  session: string;
  term: string;
  amountPaid: number;
  totalAmount: number;
  phoneNumber?: string; // Optional if cash
  accountNumber?: string; // Optional if cash
  bankName?: string; // Optional if cash
  receiptImage?: string; // Optional if cash
  paymentMethod: 'TRANSFER' | 'CASH';
  note?: string; // For cash payments
  walletUsed: number; // Amount of wallet balance applied
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  dateInitiated: string;
  dateResolved?: string;
  resolvedBy?: string; // Director ID
}