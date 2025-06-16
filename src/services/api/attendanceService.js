import attendanceData from '../mockData/attendance.json'

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

let attendance = [...attendanceData]

const attendanceService = {
  async getAll() {
    await delay(300)
    return [...attendance]
  },

  async getById(id) {
    await delay(200)
    const record = attendance.find(a => a.id === id)
    return record ? { ...record } : null
  },

  async create(attendanceData) {
    await delay(400)
    const newRecord = {
      ...attendanceData,
      id: Date.now().toString()
    }
    attendance.push(newRecord)
    return { ...newRecord }
  },

  async update(id, data) {
    await delay(350)
    const index = attendance.findIndex(a => a.id === id)
    if (index !== -1) {
      attendance[index] = { ...attendance[index], ...data }
      return { ...attendance[index] }
    }
    throw new Error('Attendance record not found')
  },

  async delete(id) {
    await delay(300)
    const index = attendance.findIndex(a => a.id === id)
    if (index !== -1) {
      const deleted = attendance.splice(index, 1)[0]
      return { ...deleted }
    }
    throw new Error('Attendance record not found')
  }
}

export default attendanceService