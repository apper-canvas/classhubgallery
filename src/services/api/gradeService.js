import gradesData from '../mockData/grades.json'

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

let grades = [...gradesData]

const gradeService = {
  async getAll() {
    await delay(300)
    return [...grades]
  },

  async getById(id) {
    await delay(200)
    const grade = grades.find(g => g.id === id)
    return grade ? { ...grade } : null
  },

  async create(gradeData) {
    await delay(400)
    const newGrade = {
      ...gradeData,
      id: Date.now().toString()
    }
    grades.push(newGrade)
    return { ...newGrade }
  },

  async update(id, data) {
    await delay(350)
    const index = grades.findIndex(g => g.id === id)
    if (index !== -1) {
      grades[index] = { ...grades[index], ...data }
      return { ...grades[index] }
    }
    throw new Error('Grade not found')
  },

  async delete(id) {
    await delay(300)
    const index = grades.findIndex(g => g.id === id)
    if (index !== -1) {
      const deleted = grades.splice(index, 1)[0]
      return { ...deleted }
    }
    throw new Error('Grade not found')
  }
}

export default gradeService