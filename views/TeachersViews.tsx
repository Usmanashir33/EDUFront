// --- TEACHER: MY CLASSES ---
  const TeacherClassesView = () => {
      // Filter classes where this teacher is assigned (Mocked for ID 't1')
      const teacherId = 't1';
      const myClasses = classRooms.filter(c => 
          subjects.some(s => s.teacherIds.includes(teacherId) && s.classRoomIds.includes(c.id))
      );

    return (
          <div className="space-y-6 animate-fadeIn">

              <div className="flex justify-between items-center mb-4">
                  <div>
                      <h2 className="text-2xl font-bold text-navy-900">My Classes</h2>
                      <p className="text-sm text-gray-500">Manage students and grading for your subjects.</p>
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">  
                  {myClasses.map(c => (
                      <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
                          <div className="bg-navy-900 p-4 flex justify-between items-center">
                              <h3 className="text-white font-bold text-lg">{c.name}</h3>
                              <span className="text-xs bg-white/20 text-white px-2 py-1 rounded">2 Subjects</span>
                          </div>
                          <div className="p-6">
                              <div className="flex justify-between text-sm text-gray-600 mb-4">
                                  <span><i className="fa-solid fa-users mr-2"></i> {students.filter(s => s.classRoomIds.includes(c.id)).length} Students</span>
                              </div>
                              <div className="space-y-2">
                                  {subjects.filter(s => s.teacherIds.includes(teacherId) && s.classRoomIds.includes(c.id)).map(sub => (
                                      <div key={sub.id} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100">
                                          <span className="text-sm font-bold text-navy-800">{sub.name}</span>
                                          <button onClick={() => setToast({message: `Opened grading for ${sub.name}`, type: 'info'})} className="text-xs text-blue-600 hover:underline">Grade</button>
                                      </div>
                                  ))}
                              </div>
                          </div>
                          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                              <button className="w-full text-center text-sm font-bold text-navy-700 hover:text-navy-900">View Student List</button>
                          </div>
                      </div>
                  ))}
                  {myClasses.length === 0 && <div className="col-span-3 text-center py-12 text-gray-400">No classes assigned yet.</div>}
              </div>
          </div>
      );
  };