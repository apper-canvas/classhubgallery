import studentsData from '../mockData/students.json'

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

let students = [...studentsData]

const studentService = {
  async getAll() {
    await delay(300)
    return [...students]
  },

  async getById(id) {
    await delay(200)
    const student = students.find(s => s.id === id)
    return student ? { ...student } : null
  },

  async create(studentData) {
    await delay(400)
    const newStudent = {
      ...studentData,
      id: Date.now().toString()
    }
    students.push(newStudent)
    return { ...newStudent }
  },

  async update(id, data) {
    await delay(350)
    const index = students.findIndex(s => s.id === id)
    if (index !== -1) {
      students[index] = { ...students[index], ...data }
      return { ...students[index] }
    }
    throw new Error('Student not found')
  },

  async delete(id) {
    await delay(300)
    const index = students.findIndex(s => s.id === id)
    if (index !== -1) {
      const deleted = students.splice(index, 1)[0]
      return { ...deleted }
    }
    throw new Error('Student not found')
  }
}

export default studentService