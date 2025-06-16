import assignmentsData from '../mockData/assignments.json'

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

let assignments = [...assignmentsData]

const assignmentService = {
  async getAll() {
    await delay(250)
    return [...assignments]
  },

  async getById(id) {
    await delay(200)
    const assignment = assignments.find(a => a.id === id)
    return assignment ? { ...assignment } : null
  },

  async create(assignmentData) {
    await delay(400)
    const newAssignment = {
      ...assignmentData,
      id: Date.now().toString()
    }
    assignments.push(newAssignment)
    return { ...newAssignment }
  },

  async update(id, data) {
    await delay(350)
    const index = assignments.findIndex(a => a.id === id)
    if (index !== -1) {
      assignments[index] = { ...assignments[index], ...data }
      return { ...assignments[index] }
    }
    throw new Error('Assignment not found')
  },

  async delete(id) {
    await delay(300)
    const index = assignments.findIndex(a => a.id === id)
    if (index !== -1) {
      const deleted = assignments.splice(index, 1)[0]
      return { ...deleted }
    }
    throw new Error('Assignment not found')
  }
}

export default assignmentService