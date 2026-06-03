import { useEffect, useState } from "react";
import { FadeIn, Modal } from "../UI";

const AllClassStudents = ({schoolId, cls,requestSender,showAllStudents,setShowAllStudents}) => {
    let classId = cls.id;
    let url = `/student/all-students/${schoolId}/${classId}/`
    const [allStudents, setAllStudents] = useState<any[] | null>(null);

    let TriggeredFunc = (resp) => {
        setAllStudents(resp.classStudents || []);
    }
    useEffect(() => {
        requestSender(url, "GET", null, TriggeredFunc,!true,false);
        return () => {setAllStudents(null);
        }
    },[])
    return ( 
        <FadeIn>
            <Modal
                isOpen={showAllStudents}
                onClose={() => setShowAllStudents(false)}
                title={`All Students in Class ${cls?.name}`}
                icon="fa-solid fa-users"
                >
                   {allStudents?.map((student :any ) => (
                  <div
                    key={student.id}
                    onClick={() => {
                      setShowAllStudents(false);
                    //   setClassMasterPendingId( student.id );
                    }}
                    className="flex items-center justify-between p-3 border-b border-gray-50 cursor-pointer hover:bg-navy-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-xs font-bold text-navy-700">
                        {student?.first_name[0]}
                        {student?.last_name[0]}
                      </div>
                      <div>
                        <div className="">
                          <p className="text-sm font-bold text-navy-900">
                             {student.first_name} {student.middle_name} {student.last_name} 
                          </p>
                          <p className="text-xs text-gray-500">
                            {student?.admission_number} | {student.email || "No Email"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <i className="fa-solid fa-check text-green-300"></i>
                  </div>
                ))}
                {allStudents?.length===0 && <div className="text-center text-gray-400 py-8">No students assigned to this class.</div>}
                {allStudents === null && <div className="text-center text-gray-400 py-8">Loading students...</div>}
                   
            </Modal>
        </FadeIn>

    );
}
 
export default AllClassStudents;