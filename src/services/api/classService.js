import classesData from '../mockData/classes.json'

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

let classes = [...classesData]

const classService = {
  async getAll() {
    await delay(250)
    return [...classes]
  },

  async getById(id) {
    await delay(200)
    const classItem = classes.find(c => c.id === id)
    return classItem ? { ...classItem } : null
  },

  async create(classData) {
    await delay(400)
    const newClass = {
      ...classData,
      id: Date.now().toString()
    }
    classes.push(newClass)
    return { ...newClass }
  },

  async update(id, data) {
    await delay(350)
    const index = classes.findIndex(c => c.id === id)
    if (index !== -1) {
      classes[index] = { ...classes[index], ...data }
      return { ...classes[index] }
    }
    throw new Error('Class not found')
  },

  async delete(id) {
    await delay(300)
    const index = classes.findIndex(c => c.id === id)
    if (index !== -1) {
      const deleted = classes.splice(index, 1)[0]
      return { ...deleted }
    }
    throw new Error('Class not found')
  }
}

export default classService