import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import MainFeature from '../components/MainFeature'
import ApperIcon from '../components/ApperIcon'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Badge } from '../components/ui/badge'
import { studentService } from '../services'
import { classService } from '../services'
import { attendanceService } from '../services'
import { gradeService } from '../services'

const Home = () => {
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [attendance, setAttendance] = useState([])
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [studentsData, classesData, attendanceData, gradesData] = await Promise.all([
          studentService.getAll(),
          classService.getAll(),
          attendanceService.getAll(),
          gradeService.getAll()
        ])
        
        setStudents(studentsData || [])
        setClasses(classesData || [])
        setAttendance(attendanceData || [])
        setGrades(gradesData || [])
        
        if (classesData?.length > 0) {
          setSelectedClass(classesData[0])
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const calculateClassStats = () => {
    if (!selectedClass) return { totalStudents: 0, averageAttendance: 0, averageGrade: 0 }
    
    const classStudents = students.filter(s => s.classId === selectedClass.id) || []
    const classAttendance = attendance.filter(a => a.classId === selectedClass.id) || []
    const classGrades = grades.filter(g => classStudents.some(s => s.id === g.studentId)) || []
    
    const attendanceRate = classAttendance.length > 0 
      ? (classAttendance.filter(a => a.status === 'present').length / classAttendance.length) * 100
      : 0
    
    const averageGrade = classGrades.length > 0
      ? classGrades.reduce((sum, g) => sum + ((g.score / g.maxScore) * 100), 0) / classGrades.length
      : 0

    return {
      totalStudents: classStudents.length,
      averageAttendance: Math.round(attendanceRate),
      averageGrade: Math.round(averageGrade)
    }
  }

  const stats = calculateClassStats()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-medium text-slate-600">Loading ClassHub Pro...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-white/80 border-b border-slate-200/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                <ApperIcon name="GraduationCap" className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  ClassHub Pro
                </h1>
                <p className="text-xs md:text-sm text-slate-500 hidden sm:block">Education Management System</p>
              </div>
            </motion.div>

            <div className="flex items-center space-x-3 md:space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hidden sm:flex">
                <ApperIcon name="Users" className="w-3 h-3 mr-1" />
                {students.length} Students
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hidden md:flex">
                <ApperIcon name="BookOpen" className="w-3 h-3 mr-1" />
                {classes.length} Classes
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Stats Overview */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-education card-hover">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base md:text-lg">
                <span>Total Students</span>
                <ApperIcon name="Users" className="w-5 h-5 md:w-6 md:h-6" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold">{stats.totalStudents}</div>
              <p className="text-blue-100 text-sm">in selected class</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-education card-hover">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base md:text-lg">
                <span>Attendance Rate</span>
                <ApperIcon name="Calendar" className="w-5 h-5 md:w-6 md:h-6" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold">{stats.averageAttendance}%</div>
              <p className="text-green-100 text-sm">average attendance</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-education card-hover sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base md:text-lg">
                <span>Average Grade</span>
                <ApperIcon name="TrendingUp" className="w-5 h-5 md:w-6 md:h-6" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold">{stats.averageGrade}%</div>
              <p className="text-purple-100 text-sm">class performance</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Feature Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <Card className="bg-white/70 backdrop-blur-lg border border-slate-200/50 shadow-education">
            <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-slate-100/50">
              <CardTitle className="flex items-center space-x-3 text-lg md:text-xl">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                  <ApperIcon name="BarChart3" className="w-4 h-4 text-white" />
                </div>
                <span>Class Management Dashboard</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <MainFeature 
                students={students}
                classes={classes}
                attendance={attendance}
                grades={grades}
                selectedClass={selectedClass}
                onClassChange={setSelectedClass}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {[
            { name: 'Add Student', icon: 'UserPlus', color: 'from-blue-500 to-blue-600' },
            { name: 'Take Attendance', icon: 'CheckSquare', color: 'from-green-500 to-green-600' },
            { name: 'Enter Grades', icon: 'Award', color: 'from-purple-500 to-purple-600' },
            { name: 'Generate Report', icon: 'FileText', color: 'from-orange-500 to-orange-600' }
          ].map((action, index) => (
            <Card key={action.name} className={`bg-gradient-to-br ${action.color} text-white border-0 shadow-education card-hover cursor-pointer group`}>
              <CardContent className="p-4 text-center">
                <ApperIcon name={action.icon} className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm md:text-base font-medium">{action.name}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

export default Home