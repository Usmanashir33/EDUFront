
import { Subject, ClassRoom, Teacher, ResultBatch, Student } from '../../types';

export const calculateGrade = (total: number) => {
    if (total >= 75) return { grade: 'A', remark: 'Excellent' };
    if (total >= 65) return { grade: 'B', remark: 'Very Good' };
    if (total >= 50) return { grade: 'C', remark: 'Credit' };
    if (total >= 40) return { grade: 'D', remark: 'Pass' };
    return { grade: 'F', remark: 'Fail' };
};

export const getCompletenessStats = (batch: ResultBatch) => {
    // Filter students actually enrolled in this class
    if (batch?.totalStudents === 0) return { scored: 0, total: 0, percentage: 0, status: 'EMPTY' };

    // Count students who have a recorded score(Total > 0 or explicitly ABS)
    // We check if the student ID exists in the batch scores and has a valid entry
    // const scoredCount = batch?.scores?.reduce((acc, score) => {
    //     // Adjust logic based on your specific "is recorded" definition
    //     let hasAbs = score.ca1Abs || score.ca2Abs || score.examAbs
    //     if (score && (score.total > 0 || hasAbs)) {
    //         return acc + 1 ;
    //     }
    //     return acc;
    // }, 0);markedStudents


    const percentage = Math.round(((batch?.markedStudents || 0) / batch?.totalStudents) * 100);

    let status: 'EMPTY' | 'PARTIAL' | 'COMPLETE' = 'EMPTY';
    if (percentage === 100) status = 'COMPLETE';
    else if (percentage > 0) status = 'PARTIAL';

    return { scored: (batch?.markedStudents || 0), total: batch?.totalStudents, percentage, status };
};


export const getCompleteSkillStats = (batch: any, totalStudents) => {
    if (totalStudents === 0) return { scored: 0, total: 0, percentage: 0, status: 'EMPTY' };

    // We check if the student ID exists in the batch scores and has a valid entry
    const scoredCount = batch?.charAndSkills?.filter((char) => char?.is_submitted === true).length

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

