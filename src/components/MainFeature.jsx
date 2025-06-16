import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import ApperIcon from './ApperIcon'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Checkbox } from './ui/checkbox'
import { studentService, attendanceService, gradeService, assignmentService } from '../services'

const MainFeature = ({ students, classes, attendance, grades, selectedClass, onClassChange }) => {
  const [localStudents, setLocalStudents] = useState(students || [])
  const [localAttendance, setLocalAttendance] = useState(attendance || [])
  const [localGrades, setLocalGrades] = useState(grades || [])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Form states
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    studentId: ''
  })
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedStudents, setSelectedStudents] = useState(new Set())
  const [gradeForm, setGradeForm] = useState({
    studentId: '',
    assignmentId: '',
    score: '',
    maxScore: 100
  })

  // Load assignments on mount
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const assignmentsData = await assignmentService.getAll()
        setAssignments(assignmentsData || [])
      } catch (err) {
        setError(err.message)
      }
    }
    loadAssignments()
  }, [])

  // Update local states when props change
  useEffect(() => {
    setLocalStudents(students || [])
  }, [students])

  useEffect(() => {
    setLocalAttendance(attendance || [])
  }, [attendance])

  useEffect(() => {
    setLocalGrades(grades || [])
  }, [grades])

  // Get students for selected class
  const getClassStudents = () => {
    if (!selectedClass) return []
    return localStudents.filter(student => student.classId === selectedClass.id) || []
  }

  // Handle student creation
  const handleCreateStudent = async (e) => {
    e.preventDefault()
    if (!newStudent.name.trim() || !newStudent.email.trim() || !newStudent.studentId.trim()) {
      toast.error("Please fill in all student fields")
      return
    }

    if (!selectedClass) {
      toast.error("Please select a class first")
      return
    }

    setLoading(true)
    try {
      const studentData = {
        ...newStudent,
        classId: selectedClass.id,
        enrollmentDate: new Date().toISOString(),
        photo: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face`
      }
      
      const createdStudent = await studentService.create(studentData)
      setLocalStudents(prev => [...prev, createdStudent])
      setNewStudent({ name: '', email: '', studentId: '' })
      toast.success("Student added successfully!")
    } catch (err) {
      setError(err.message)
      toast.error("Failed to add student")
    } finally {
      setLoading(false)
    }
  }

  // Handle attendance marking
  const handleMarkAttendance = async (e) => {
    e.preventDefault()
    if (selectedStudents.size === 0) {
      toast.error("Please select at least one student")
      return
    }

    if (!selectedClass) {
      toast.error("Please select a class first")
      return
    }

    setLoading(true)
    try {
      const attendancePromises = Array.from(selectedStudents).map(studentId => {
        const attendanceData = {
          studentId,
          classId: selectedClass.id,
          date: attendanceDate,
          status: 'present',
          notes: ''
        }
        return attendanceService.create(attendanceData)
      })

      const newAttendanceRecords = await Promise.all(attendancePromises)
      setLocalAttendance(prev => [...prev, ...newAttendanceRecords])
      setSelectedStudents(new Set())
      toast.success(`Attendance marked for ${selectedStudents.size} students`)
    } catch (err) {
      setError(err.message)
      toast.error("Failed to mark attendance")
    } finally {
      setLoading(false)
    }
  }

  // Handle grade entry
  const handleEnterGrade = async (e) => {
    e.preventDefault()
    if (!gradeForm.studentId || !gradeForm.assignmentId || !gradeForm.score) {
      toast.error("Please fill in all grade fields")
      return
    }

    const score = parseFloat(gradeForm.score)
    const maxScore = parseFloat(gradeForm.maxScore)
    
    if (score > maxScore) {
      toast.error("Score cannot exceed maximum points")
      return
    }

    setLoading(true)
    try {
      const gradeData = {
        ...gradeForm,
        score,
        maxScore,
        submittedDate: new Date().toISOString()
      }
      
      const createdGrade = await gradeService.create(gradeData)
      setLocalGrades(prev => [...prev, createdGrade])
      setGradeForm({ studentId: '', assignmentId: '', score: '', maxScore: 100 })
      toast.success("Grade entered successfully!")
    } catch (err) {
      setError(err.message)
      toast.error("Failed to enter grade")
    } finally {
      setLoading(false)
    }
  }

  // Calculate student stats
  const calculateStudentStats = (student) => {
    const studentAttendance = localAttendance.filter(a => a.studentId === student.id && a.classId === selectedClass?.id) || []
    const studentGrades = localGrades.filter(g => g.studentId === student.id) || []
    
    const attendanceRate = studentAttendance.length > 0 
      ? (studentAttendance.filter(a => a.status === 'present').length / studentAttendance.length) * 100
      : 0
    
    const averageGrade = studentGrades.length > 0
      ? studentGrades.reduce((sum, g) => sum + ((g.score / g.maxScore) * 100), 0) / studentGrades.length
      : 0

    return {
      attendanceRate: Math.round(attendanceRate),
      averageGrade: Math.round(averageGrade),
      totalGrades: studentGrades.length
    }
  }

  const classStudents = getClassStudents()

  return (
    <div className="p-4 md:p-6">
      {/* Class Selector */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-slate-700 mb-2 block">Select Class</Label>
        <Select value={selectedClass?.id || ''} onValueChange={(value) => {
          const selected = classes.find(c => c.id === value)
          onClassChange(selected)
        }}>
          <SelectTrigger className="w-full md:w-80 bg-white border-slate-300 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <SelectValue placeholder="Choose a class to manage" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 rounded-xl shadow-education">
            {classes?.map(classItem => (
              <SelectItem key={classItem.id} value={classItem.id} className="hover:bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div>
                    <div className="font-medium">{classItem.name}</div>
                    <div className="text-sm text-slate-500">{classItem.code} • {classItem.semester} {classItem.year}</div>
                  </div>
                </div>
              </SelectItem>
            )) || []}
          </SelectContent>
        </Select>
      </div>

      {selectedClass && (
        <Tabs defaultValue="students" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-slate-100 rounded-xl p-1 mb-6">
            <TabsTrigger value="students" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <ApperIcon name="Users" className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Students</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <ApperIcon name="Calendar" className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="grades" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <ApperIcon name="Award" className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Grades</span>
            </TabsTrigger>
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <ApperIcon name="BarChart3" className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add Student Form */}
              <Card className="lg:col-span-1 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-education">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-800">
                    <ApperIcon name="UserPlus" className="w-5 h-5" />
                    <span>Add New Student</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateStudent} className="space-y-4">
                    <div>
                      <Label htmlFor="studentName" className="text-slate-700">Full Name</Label>
                      <Input
                        id="studentName"
                        value={newStudent.name}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter student name"
                        className="mt-1 bg-white border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="studentEmail" className="text-slate-700">Email Address</Label>
                      <Input
                        id="studentEmail"
                        type="email"
                        value={newStudent.email}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="student@university.edu"
                        className="mt-1 bg-white border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="studentId" className="text-slate-700">Student ID</Label>
                      <Input
                        id="studentId"
                        value={newStudent.studentId}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, studentId: e.target.value }))}
                        placeholder="Enter student ID"
                        className="mt-1 bg-white border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      {loading ? (
                        <ApperIcon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ApperIcon name="Plus" className="w-4 h-4 mr-2" />
                      )}
                      Add Student
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Students List */}
              <Card className="lg:col-span-2 bg-white shadow-education">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ApperIcon name="Users" className="w-5 h-5 text-slate-600" />
                      <span>Class Students ({classStudents.length})</span>
                    </div>
                    <Badge variant="outline" className="bg-slate-50">
                      {selectedClass.name}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {classStudents.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <ApperIcon name="UserX" className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>No students enrolled in this class yet.</p>
                        <p className="text-sm">Add your first student using the form.</p>
                      </div>
                    ) : (
                      classStudents.map(student => {
                        const stats = calculateStudentStats(student)
                        return (
                          <motion.div
                            key={student.id}
                            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            layout
                          >
                            <div className="flex items-center space-x-3">
                              <img
                                src={student.photo}
                                alt={student.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                              />
                              <div>
                                <div className="font-medium text-slate-800">{student.name}</div>
                                <div className="text-sm text-slate-500">ID: {student.studentId}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {stats.attendanceRate}% attendance
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${stats.averageGrade >= 80 ? 'bg-green-50 text-green-700 border-green-200' : 
                                  stats.averageGrade >= 60 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                  'bg-red-50 text-red-700 border-red-200'}`}
                              >
                                {stats.averageGrade}% avg
                              </Badge>
                            </div>
                          </motion.div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Mark Attendance Form */}
              <Card className="lg:col-span-1 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-education">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-800">
                    <ApperIcon name="CheckSquare" className="w-5 h-5" />
                    <span>Mark Attendance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleMarkAttendance} className="space-y-4">
                    <div>
                      <Label htmlFor="attendanceDate" className="text-slate-700">Date</Label>
                      <Input
                        id="attendanceDate"
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        className="mt-1 bg-white border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-700 mb-2 block">Select Present Students</Label>
                      <div className="max-h-40 overflow-y-auto space-y-2 bg-white rounded-lg border border-slate-300 p-3">
                        {classStudents.map(student => (
                          <div key={student.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`student-${student.id}`}
                              checked={selectedStudents.has(student.id)}
                              onCheckedChange={(checked) => {
                                const newSelected = new Set(selectedStudents)
                                if (checked) {
                                  newSelected.add(student.id)
                                } else {
                                  newSelected.delete(student.id)
                                }
                                setSelectedStudents(newSelected)
                              }}
                            />
                            <label
                              htmlFor={`student-${student.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {student.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      disabled={loading || selectedStudents.size === 0}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      {loading ? (
                        <ApperIcon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ApperIcon name="Check" className="w-4 h-4 mr-2" />
                      )}
                      Mark Present ({selectedStudents.size})
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Attendance Records */}
              <Card className="lg:col-span-2 bg-white shadow-education">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ApperIcon name="Calendar" className="w-5 h-5 text-slate-600" />
                    <span>Recent Attendance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {localAttendance
                      .filter(record => record.classId === selectedClass.id)
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .slice(0, 20)
                      .map(record => {
                        const student = localStudents.find(s => s.id === record.studentId)
                        return (
                          <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${record.status === 'present' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <div>
                                <div className="font-medium text-slate-800">{student?.name || 'Unknown Student'}</div>
                                <div className="text-sm text-slate-500">{new Date(record.date).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`${record.status === 'present' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                            >
                              {record.status}
                            </Badge>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Grades Tab */}
          <TabsContent value="grades" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Enter Grade Form */}
              <Card className="lg:col-span-1 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 shadow-education">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-purple-800">
                    <ApperIcon name="Award" className="w-5 h-5" />
                    <span>Enter Grade</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleEnterGrade} className="space-y-4">
                    <div>
                      <Label className="text-slate-700">Student</Label>
                      <Select value={gradeForm.studentId} onValueChange={(value) => setGradeForm(prev => ({ ...prev, studentId: value }))}>
                        <SelectTrigger className="mt-1 bg-white border-slate-300 rounded-lg">
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 rounded-xl shadow-education">
                          {classStudents.map(student => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-700">Assignment</Label>
                      <Select value={gradeForm.assignmentId} onValueChange={(value) => setGradeForm(prev => ({ ...prev, assignmentId: value }))}>
                        <SelectTrigger className="mt-1 bg-white border-slate-300 rounded-lg">
                          <SelectValue placeholder="Select assignment" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 rounded-xl shadow-education">
                          {assignments
                            .filter(assignment => assignment.classId === selectedClass.id)
                            .map(assignment => (
                              <SelectItem key={assignment.id} value={assignment.id}>
                                {assignment.name} ({assignment.totalPoints} pts)
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="score" className="text-slate-700">Score</Label>
                        <Input
                          id="score"
                          type="number"
                          min="0"
                          step="0.1"
                          value={gradeForm.score}
                          onChange={(e) => setGradeForm(prev => ({ ...prev, score: e.target.value }))}
                          placeholder="0"
                          className="mt-1 bg-white border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxScore" className="text-slate-700">Max Points</Label>
                        <Input
                          id="maxScore"
                          type="number"
                          min="1"
                          value={gradeForm.maxScore}
                          onChange={(e) => setGradeForm(prev => ({ ...prev, maxScore: e.target.value }))}
                          className="mt-1 bg-white border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      {loading ? (
                        <ApperIcon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ApperIcon name="Plus" className="w-4 h-4 mr-2" />
                      )}
                      Enter Grade
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Grades List */}
              <Card className="lg:col-span-2 bg-white shadow-education">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ApperIcon name="TrendingUp" className="w-5 h-5 text-slate-600" />
                    <span>Recent Grades</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {localGrades
                      .filter(grade => {
                        const student = localStudents.find(s => s.id === grade.studentId)
                        return student && student.classId === selectedClass.id
                      })
                      .sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate))
                      .slice(0, 20)
                      .map(grade => {
                        const student = localStudents.find(s => s.id === grade.studentId)
                        const assignment = assignments.find(a => a.id === grade.assignmentId)
                        const percentage = Math.round((grade.score / grade.maxScore) * 100)
                        
                        return (
                          <div key={grade.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                percentage >= 90 ? 'bg-green-500' :
                                percentage >= 80 ? 'bg-blue-500' :
                                percentage >= 70 ? 'bg-yellow-500' :
                                percentage >= 60 ? 'bg-orange-500' : 'bg-red-500'
                              }`}></div>
                              <div>
                                <div className="font-medium text-slate-800">{student?.name || 'Unknown Student'}</div>
                                <div className="text-sm text-slate-500">{assignment?.name || 'Unknown Assignment'}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-slate-800">{grade.score}/{grade.maxScore}</div>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  percentage >= 90 ? 'bg-green-50 text-green-700 border-green-200' :
                                  percentage >= 80 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  percentage >= 70 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                  percentage >= 60 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                  'bg-red-50 text-red-700 border-red-200'
                                }`}
                              >
                                {percentage}%
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-education">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Class Summary</span>
                    <ApperIcon name="Users" className="w-6 h-6" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Students:</span>
                      <span className="font-bold">{classStudents.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Attendance Records:</span>
                      <span className="font-bold">{localAttendance.filter(a => a.classId === selectedClass.id).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Grades Entered:</span>
                      <span className="font-bold">
                        {localGrades.filter(g => {
                          const student = localStudents.find(s => s.id === g.studentId)
                          return student && student.classId === selectedClass.id
                        }).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-education">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Performance</span>
                    <ApperIcon name="TrendingUp" className="w-6 h-6" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Above 90%:</span>
                      <span className="font-bold">
                        {classStudents.filter(s => calculateStudentStats(s).averageGrade >= 90).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Above 80%:</span>
                      <span className="font-bold">
                        {classStudents.filter(s => calculateStudentStats(s).averageGrade >= 80).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Below 60%:</span>
                      <span className="font-bold">
                        {classStudents.filter(s => calculateStudentStats(s).averageGrade < 60 && calculateStudentStats(s).averageGrade > 0).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-education md:col-span-2 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Attendance</span>
                    <ApperIcon name="Calendar" className="w-6 h-6" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Perfect Attendance:</span>
                      <span className="font-bold">
                        {classStudents.filter(s => calculateStudentStats(s).attendanceRate === 100).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Above 90%:</span>
                      <span className="font-bold">
                        {classStudents.filter(s => calculateStudentStats(s).attendanceRate >= 90).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Below 70%:</span>
                      <span className="font-bold">
                        {classStudents.filter(s => calculateStudentStats(s).attendanceRate < 70 && calculateStudentStats(s).attendanceRate > 0).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Student Performance Table */}
            <Card className="mt-6 bg-white shadow-education">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ApperIcon name="BarChart3" className="w-5 h-5 text-slate-600" />
                  <span>Student Performance Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Student</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Attendance Rate</TableHead>
                        <TableHead>Average Grade</TableHead>
                        <TableHead>Total Grades</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classStudents.map(student => {
                        const stats = calculateStudentStats(student)
                        return (
                          <TableRow key={student.id} className="hover:bg-slate-50">
                            <TableCell className="font-medium">
                              <div className="flex items-center space-x-2">
                                <img
                                  src={student.photo}
                                  alt={student.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                                <span>{student.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{student.studentId}</TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={`${stats.attendanceRate >= 90 ? 'bg-green-50 text-green-700 border-green-200' : 
                                  stats.attendanceRate >= 70 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                  'bg-red-50 text-red-700 border-red-200'}`}
                              >
                                {stats.attendanceRate}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={`${stats.averageGrade >= 90 ? 'bg-green-50 text-green-700 border-green-200' : 
                                  stats.averageGrade >= 80 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  stats.averageGrade >= 70 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                  stats.averageGrade >= 60 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                  stats.averageGrade > 0 ? 'bg-red-50 text-red-700 border-red-200' :
                                  'bg-slate-50 text-slate-500 border-slate-200'}`}
                              >
                                {stats.averageGrade > 0 ? `${stats.averageGrade}%` : 'No grades'}
                              </Badge>
                            </TableCell>
                            <TableCell>{stats.totalGrades}</TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline"
                                className={`${
                                  stats.averageGrade >= 80 && stats.attendanceRate >= 90 ? 'bg-green-50 text-green-700 border-green-200' :
                                  stats.averageGrade < 60 || stats.attendanceRate < 70 ? 'bg-red-50 text-red-700 border-red-200' :
                                  'bg-yellow-50 text-yellow-700 border-yellow-200'
                                }`}
                              >
                                {stats.averageGrade >= 80 && stats.attendanceRate >= 90 ? 'Excellent' :
                                 stats.averageGrade < 60 || stats.attendanceRate < 70 ? 'At Risk' : 'Good'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!selectedClass && (
        <div className="text-center py-12">
          <ApperIcon name="BookOpen" className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-xl font-semibold text-slate-600 mb-2">Select a Class to Begin</h3>
          <p className="text-slate-500">Choose a class from the dropdown above to start managing your students.</p>
        </div>
      )}
    </div>
  )
}

export default MainFeature