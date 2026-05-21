// --- MOCK DATA GENERATORS FOR REPORT CARD ---
export const StudentInfoFieldsAvailable = [
    "name",
    "admissionNo",
    "gender",
    "dob",
    "attendance",
    'positionInClass',
    'averageMark',
    'classRoom',
    'term',
]
export const generateStudentReportData = (reportData) => {
    // Deterministic random based on student ID and term
    const seed = 0;
    let student = reportData?.student || {}
    let studentClass = reportData?.class_room?.name
    let session = reportData?.session?.name
    let term = reportData?.term?.name
    let skills = reportData?.skills

    return {
        data: {
            attendanceDetails: { present: 112 + (seed % 10), total: 120 },
            attendance: 112 + (seed % 10) / 120,
            positionInClass: reportData?.position,
            totalMarks: reportData?.total_marks,
            averageMark: reportData?.average_marks,
            totalClassStudents: reportData?.classTotalStudents,
            classRoom: studentClass,
            session: session,
            term: term,
            generatedAt: reportData?.generated_at,
            updatedAt: reportData?.last_updated
        },
        studentDetails: {
            name: `${student.first_name} ${student.middle_name || ""} ${student.last_name} `,
            admissionNo: student.admission_number,
            gender: student.gender,
            dob: student?.date_of_birth,
            picture: student?.picture,
            positionInClass: reportData?.position,
            totalClassStudents: reportData?.classTotalStudents,
            classRoom: studentClass,
            attendanceData: { present: 112 + (seed % 10), total: 120 },
            attendance: 112 + (seed % 10) / 120,
            term: term,

        },
        academics: reportData?.scores?.map((s) => {
            return {
                subject: s.subject_name,
                code: s.subject_code,
                ca1: s.ca1,
                ca2: s.ca2,
                exam: s.exam,
                total: s.ca1 + s.ca2 + s.exam,
                grade: s.grade,
                remark: s.remark, classAvg: 0
            };
        }),

        affective: [
            { trait: "Punctuality", rating: skills?.punctuality || 3 },
            { trait: "Honesty", rating: skills?.honesty || 3 },
            { trait: "Neatness", rating: skills?.neatness || 3 },
        ],

        psychomotor: [
            { skill: "Handwriting", rating: skills?.handwriting || 3 },
            { skill: "Verbal Fluency", rating: skills?.verbal_fluency || 3 },
            { skill: "Creativity", rating: skills?.creativity || 3 },
        ],

        remarks: {
            teacher: "A disciplined and focused student. Shows great promise in sciences.",
            principal: "Result is satisfactory. Promoted to the next class.",
        },
        // Extra records for the "Records" tab
        termRecords: {
            fees: { status: "Paid", amount: "150,000", date: "2023-09-15" },
            incidents: [
                { date: "2023-10-10", title: "Late to Assembly", description: "Arrived 15 mins late." },
                { date: "2023-11-05", title: "Forgot Homework", description: "Math assignment not submitted." },
            ],
            activities: ["Science Club", "Debate Team"],
        },
    };
};

export const studentMockReportData = {
    "id": 8,
    "student": {
        "id": "09feae73-b318-4efe-8527-51fa89049bde",
        "user": {
            "id": "4f2adf45-7b16-4d84-8d5b-21ea0fb3b563",
            "username": "AIN/26/0005",
            "phone_number": "",
            "email": "jamila@gmail.com",
            "picture": "/media/default.png",
            "first_name": "Jamila",
            "last_name": "Ashir",
            "middle_name": "Muhammad",
            "refarrel_code": "DD911F",
            "kyc_submitted": " UNVERIFIED ",
            "otp_required": true,
            "pin_set": false,
            "is_active": true,
            "kyc_confirmed": false,
            "email_varified": false,
            "is_staff": false,
            "is_superuser": false
        },
        "guardian": null,
        "class_rooms": [
            {
                "id": 22,
                "date_joined": "2026-02-17T20:04:42.431108Z",
                "date_left": null,
                "status": "active",
                "student": "09feae73-b318-4efe-8527-51fa89049bde",
                "class_room": "68cde5cf-93de-4e4a-b4e7-161f307c1330"
            }
        ],
        "active_class_rooms": [
            "68cde5cf-93de-4e4a-b4e7-161f307c1330"
        ],
        "first_name": "Jamila",
        "last_name": "Ashir",
        "middle_name": "Muhammad",
        "email": "jamila@gmail.com",
        "gender": "female",
        "picture": "/media/students/09feae73-b318-4efe-8527-51fa89049bde_logo_5TdA0xH.jpg",
        "role": "Student",
        "admission_number": "AIN/26/0005",
        "date_of_birth": "2010-01-01",
        "joined_at": "2026-01-29T14:14:47.508236Z",
        "school": "c1d544ad-5ea2-42bc-ba86-1131fe9a6b0a"
    },
    "class_room": {
        "id": "68cde5cf-93de-4e4a-b4e7-161f307c1330",
        "name": "Primary  2",
        "joined_at": "2026-01-29T12:22:19.648525Z",
        "section": "62ed6ce3-6ff8-4c06-a39e-d50e1316f3e5",
        "form_teacher": "ed4456f3-9b69-41d0-b6c4-3a4366605906"
    },
    "term": {
        "id": "7c321c4c-1db3-43b5-b6a8-1adec2c95269",
        "name": "1st Term",
        "start_date": null,
        "end_date": null,
        "is_current": true,
        "date_added": "2026-02-15T11:57:21.455111Z",
        "school": "c1d544ad-5ea2-42bc-ba86-1131fe9a6b0a"
    },
    "session": {
        "id": "30fe0ae9-07fa-460d-8486-d7b72bf7e985",
        "name": "2025/2026",
        "start_date": null,
        "end_date": null,
        "is_current": true,
        "date_added": "2026-02-15T11:57:09.365084Z",
        "school": "c1d544ad-5ea2-42bc-ba86-1131fe9a6b0a"
    },
    "scores": [
        {
            "id": 11,
            "studentId": "09feae73-b318-4efe-8527-51fa89049bde",
            "student_name": "Jamila Muhammad Ashir",
            "subject_name": "Nashida",
            "subject_code": "ARA 1",
            "subject_credits": null,
            "ca1": 20,
            "ca2": 20,
            "exam": 60,
            "total": 100,
            "grade": "A",
            "remark": "Excellent"
        },
        {
            "id": 112,
            "studentId": "09feae73-b318-4efe-8527-51fa89049bde",
            "student_name": "Jamila Muhammad Ashir",
            "subject_name": "Nashida",
            "subject_code": "ARA 1",
            "subject_credits": null,
            "ca1": 20,
            "ca2": 20,
            "exam": 60,
            "total": 100,
            "grade": "A",
            "remark": "Excellent"
        },
        {
            "id": 112,
            "studentId": "09feae73-b318-4efe-8527-51fa89049bde",
            "student_name": "Jamila Muhammad Ashir",
            "subject_name": "Nashida",
            "subject_code": "ARA 1",
            "subject_credits": null,
            "ca1": 20,
            "ca2": 20,
            "exam": 60,
            "total": 100,
            "grade": "A",
            "remark": "Excellent"
        },
        {
            "id": 11200,
            "studentId": "09feae73-b318-4efe-8527-51fa89049bde",
            "student_name": "Jamila Muhammad Ashir",
            "subject_name": "Nashida",
            "subject_code": "ARA 1",
            "subject_credits": null,
            "ca1": 20,
            "ca2": 20,
            "exam": 60,
            "total": 100,
            "grade": "A",
            "remark": "Excellent"
        },
        {
            "id": 112200,
            "studentId": "09feae73-b318-4efe-8527-51fa89049bde",
            "student_name": "Jamila Muhammad Ashir",
            "subject_name": "Nashida",
            "subject_code": "ARA 1",
            "subject_credits": null,
            "ca1": 20,
            "ca2": 20,
            "exam": 60,
            "total": 100,
            "grade": "A",
            "remark": "Excellent"
        },
        {
            "id": 1100,
            "studentId": "09feae73-b318-4efe-8527-51fa89049bde",
            "student_name": "Jamila Muhammad Ashir",
            "subject_name": "Nashida",
            "subject_code": "ARA 1",
            "subject_credits": null,
            "ca1": 20,
            "ca2": 20,
            "exam": 60,
            "total": 100,
            "grade": "A",
            "remark": "Excellent"
        },
        {
            "id": 17,
            "studentId": "09feae73-b318-4efe-8527-51fa89049bde",
            "student_name": "Jamila Muhammad Ashir",
            "subject_name": "AL Quran",
            "subject_code": "IRK 1",
            "subject_credits": null,
            "ca1": 20,
            "ca2": 20,
            "exam": 33,
            "total": 73,
            "grade": "B",
            "remark": "Very Good"
        },
        {
            "id": 7,
            "studentId": "09feae73-b318-4efe-8527-51fa89049bde",
            "student_name": "Jamila Muhammad Ashir",
            "subject_name": "English",
            "subject_code": "ENG2",
            "subject_credits": 1,
            "ca1": 12,
            "ca2": 12,
            "exam": 60,
            "total": 84,
            "grade": "A",
            "remark": "Excellent"
        },
        {
            "id": 13,
            "studentId": "09feae73-b318-4efe-8527-51fa89049bde",
            "student_name": "Jamila Muhammad Ashir",
            "subject_name": "Mathematics",
            "subject_code": "MATH2",
            "subject_credits": 3,
            "ca1": 20,
            "ca2": 6,
            "exam": 60,
            "total": 86,
            "grade": "A",
            "remark": "Excellent"
        },
        {
            "id": 33,
            "studentId": "09feae73-b318-4efe-8527-51fa89049bde",
            "student_name": "Jamila Muhammad Ashir",
            "subject_name": "Mutaliah",
            "subject_code": "ARA2",
            "subject_credits": 2,
            "ca1": 13,
            "ca2": 20,
            "exam": 60,
            "total": 93,
            "grade": "A",
            "remark": "Excellent"
        },
        {
            "id": 113,
            "studentId": "09feae73-b318-4efe-8527-51fa89049bde",
            "student_name": "Jamila Muhammad Ashir",
            "subject_name": "Nashida",
            "subject_code": "ARA 1",
            "subject_credits": null,
            "ca1": 20,
            "ca2": 20,
            "exam": 60,
            "total": 100,
            "grade": "A",
            "remark": "Excellent"
        },
        {
            "id": 173,
            "studentId": "09feae73-b318-4efe-8527-51fa89049bde",
            "student_name": "Jamila Muhammad Ashir",
            "subject_name": "AL Quran",
            "subject_code": "IRK 1",
            "subject_credits": null,
            "ca1": 20,
            "ca2": 20,
            "exam": 33,
            "total": 73,
            "grade": "B",
            "remark": "Very Good"
        },
        {
            "id": 73,
            "studentId": "09feae73-b318-4efe-8527-51fa89049bde",
            "student_name": "Jamila Muhammad Ashir",
            "subject_name": "English",
            "subject_code": "ENG2",
            "subject_credits": 1,
            "ca1": 12,
            "ca2": 12,
            "exam": 60,
            "total": 84,
            "grade": "A",
            "remark": "Excellent"
        },
        {
            "id": 133,
            "studentId": "09feae73-b318-4efe-8527-51fa89049bde",
            "student_name": "Jamila Muhammad Ashir",
            "subject_name": "Mathematics",
            "subject_code": "MATH2",
            "subject_credits": 3,
            "ca1": 20,
            "ca2": 6,
            "exam": 60,
            "total": 86,
            "grade": "A",
            "remark": "Excellent"
        },
        {
            "id": 33,
            "studentId": "09feae73-b318-4efe-8527-51fa89049bde",
            "student_name": "Jamila Muhammad Ashir",
            "subject_name": "Mutaliah",
            "subject_code": "ARA2",
            "subject_credits": 2,
            "ca1": 13,
            "ca2": 20,
            "exam": 60,
            "total": 93,
            "grade": "A",
            "remark": "Excellent"
        }
    ],
    "classTotalStudents": 4,
    "skills": {
        "id": 1,
        "studentId": "09feae73-b318-4efe-8527-51fa89049bde",
        "punctuality": 2,
        "honesty": 5,
        "neatness": 5,
        "leadership": 3,
        "handwriting": 5,
        "verbal_fluency": 5,
        "creativity": 5,
        "generated_at": "2026-03-04T17:26:50.536199Z",
        "batch": 1,
        "student": "09feae73-b318-4efe-8527-51fa89049bde"
    },
    "total_marks": "436.00",
    "average_marks": "87.20",
    "overall_grade": "A",
    "form_teacher_comment": "",
    "head_teacher_comment": "",
    "remarks": "",
    "position": 1,
    "total_class_students": 4,
    "generated_at": "2026-02-23T17:26:38.551932Z",
    "last_updated": "2026-03-08T12:25:57.958533Z",
    "approved": false
}