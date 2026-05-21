
import { Subject, ClassRoom, Teacher, ResultBatch, Student } from '../../types';

export const calculateGrade = (total: number) => {
    if (total >= 75) return { grade: 'A', remark: 'Excellent' };
    if (total >= 65) return { grade: 'B', remark: 'Very Good' };
    if (total >= 50) return { grade: 'C', remark: 'Credit' };
    if (total >= 40) return { grade: 'D', remark: 'Pass' };
    return { grade: 'F', remark: 'Fail' };
};

export const getCompletenessStats = (batch: ResultBatch, students) => {
    // Filter students actually enrolled in this class
    const classStudents = students.filter(s => s.class_rooms.map(cls => cls.class_room).includes(batch?.classId));
    const totalStudents = classStudents.length;

    if (totalStudents === 0) return { scored: 0, total: 0, percentage: 0, status: 'EMPTY' };

    // Count students who have a recorded score (Total > 0 or explicitly marked)
    // We check if the student ID exists in the batch scores and has a valid entry
    const scoredCount = classStudents.reduce((acc, student) => {
        const score = batch.scores?.find(s => s.studentId === student.id);
        // We consider it "scored" if there is a total > 0 or exam > 0
        // Adjust logic based on your specific "is recorded" definition
        if (score && (score.total > 0 || score.exam > 0 || score.ca1 > 0)) {
            return acc + 1;
        }
        return acc;
    }, 0);

    const percentage = Math.round((scoredCount / totalStudents) * 100);

    let status: 'EMPTY' | 'PARTIAL' | 'COMPLETE' = 'EMPTY';
    if (percentage === 100) status = 'COMPLETE';
    else if (percentage > 0) status = 'PARTIAL';

    return { scored: scoredCount, total: totalStudents, percentage, status };
};
export const getCompleteSkillStats = (batch: any, students) => {
    // Filter students actually enrolled in this class
    const classStudents = students.filter(s => s.class_rooms.map(cls => cls.class_room).includes(batch?.classId));
    const totalStudents = classStudents.length;

    if (totalStudents === 0) return { scored: 0, total: 0, percentage: 0, status: 'EMPTY' };

    // Count students who have a recorded score (Total > 0 or explicitly marked)
    // We check if the student ID exists in the batch scores and has a valid entry
    const scoredCount = classStudents.reduce((acc, student) => {
        const skill = batch.charAndSkills?.find(s => s.studentId === student.id);
        // We consider it "scored" if there is a any of the skill marked 
        // Adjust logic based on your specific"is recorded" definition
        if (skill && (skill.punctuality > 0 || skill.honesty > 0 || skill.neatness > 0 || skill.handwriting > 0 || skill.verbal_fluency)) {
            return acc + 1;
        }
        return acc;
    }, 0);

    const percentage = Math.round((scoredCount / totalStudents) * 100);

    let status: 'EMPTY' | 'PARTIAL' | 'COMPLETE' = 'EMPTY';
    if (percentage === 100) status = 'COMPLETE';
    else if (percentage > 0) status = 'PARTIAL';

    return { scored: scoredCount, total: totalStudents, percentage, status };
};

export const generateResultCSV = (batch: ResultBatch, students, subjects: Subject[], classes: ClassRoom[]) => {
    const cls = classes.find(c => c.id === batch.classId);
    const sub = subjects.find(s => s.id === batch.subjectId);
    const classStudents = students.filter(s => s.active_class_rooms.includes(batch.classId));

    if (!cls || !sub) return null;

    const header = `Student Name,Admission No,CA1 (20),CA2 (20),Exam (60)\n`;
    const rows = classStudents.map(s => {
        const existing = batch.scores.find(sc => sc.studentId === s.id);
        const ca1 = existing ? existing.ca1 : 0;
        const ca2 = existing ? existing.ca2 : 0;
        const exam = existing ? existing.exam : 0;
        return `"${s.first_name} ${s.last_name}",${s.admission_number},${ca1},${ca2},${exam}`;
    }).join('\n');

    return {
        filename: `${sub.name}_${cls.name}_Results.csv`,
        content: "data:text/csv;charset=utf-8," + encodeURI(header + rows)
    };
};

