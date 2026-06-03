import { useEffect, useState } from "react";
import { FadeIn, Modal } from "../UI";

const AllClassTeachers = ({schoolId, cls,requestSender,showAllTeachers,setShowAllTeachers}) => {
    let classId = cls.id ;
    let url = `/teacher/all-teachers/${schoolId}/${classId}/`
    const [allTeachers, setAllTeachers] = useState<any[] | null>(null);
    let TriggeredFunc = (resp) => {
        console.log('resp: ', resp);
        setAllTeachers(resp.classTeachers || []);
    }

    useEffect(() => {
        requestSender(url, "GET", null, TriggeredFunc,false,false);
        return () => {setAllTeachers(null);
        }
    },[])

    return ( 
        <FadeIn>
            <Modal
                isOpen={showAllTeachers}
                onClose={() => setShowAllTeachers(false)}
                title={`All Teachers in Class ${cls?.name}`}
                icon="fa-solid fa-users"
                >
            {allTeachers?.map((teacher :any ) => (
                  <div
                    key={teacher.id}
                    onClick={() => {
                      setShowAllTeachers(false);
                    //   setClassMasterPendingId( teacher.id );
                    }}
                    className="flex items-center justify-between p-3 border-b border-gray-50 cursor-pointer hover:bg-navy-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-xs font-bold text-navy-700">
                        {teacher?.first_name[0]}
                        {teacher?.last_name[0]}
                      </div>
                      <div>
                        <div className="">
                          <p className="text-sm font-bold text-navy-900">
                             {teacher.first_name} {teacher.middle_name} {teacher.last_name} 
                          </p>
                          <p className="text-xs text-gray-500">
                            {teacher?.staff_id} | {teacher.email || "No Email"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <i className="fa-solid fa-check text-green-300"></i>
                  </div>
                ))}
                {allTeachers?.length===0 && <div className="text-center text-gray-400 py-8">No teachers assigned to this class.</div>}
                {allTeachers === null && <div className="text-center text-gray-400 py-8">Loading teachers...</div>}
                   
            </Modal>
        </FadeIn>

    );
}
 
export default AllClassTeachers;