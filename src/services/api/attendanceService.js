import { toast } from 'react-toastify';

const attendanceService = {
  async getAll() {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      const params = {
        Fields: ['Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 'ModifiedOn', 'ModifiedBy', 'date', 'status', 'notes', 'student_id', 'class_id']
      };

      const response = await apperClient.fetchRecords('attendance', params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      console.error("Error fetching attendance:", error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      const params = {
        fields: ['Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 'ModifiedOn', 'ModifiedBy', 'date', 'status', 'notes', 'student_id', 'class_id']
      };

      const response = await apperClient.getRecordById('attendance', id, params);
      
      if (!response.success) {
        console.error(response.message);
        return null;
      }

      return response.data;
    } catch (error) {
      console.error(`Error fetching attendance with ID ${id}:`, error);
      return null;
    }
  },

  async create(attendanceData) {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      const records = Array.isArray(attendanceData) ? attendanceData : [attendanceData];
      
      const params = {
        records: records.map(data => ({
          Name: data.name || data.Name || `Attendance ${data.date}`,
          date: data.date,
          status: data.status,
          notes: data.notes || '',
          student_id: parseInt(data.studentId || data.student_id),
          class_id: parseInt(data.classId || data.class_id),
          Tags: data.tags || data.Tags || '',
          Owner: data.owner || data.Owner
        }))
      };

      const response = await apperClient.createRecord('attendance', params);

      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return Array.isArray(attendanceData) ? [] : null;
      }

      if (response.results) {
        const failedRecords = response.results.filter(result => !result.success);
        
        if (failedRecords.length > 0) {
          console.error(`Failed to create ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
          
          failedRecords.forEach(record => {
            record.errors?.forEach(error => {
              toast.error(`${error.fieldLabel}: ${error.message}`);
            });
            if (record.message) toast.error(record.message);
          });
        }

        const successfulRecords = response.results.filter(result => result.success).map(result => result.data);
        return Array.isArray(attendanceData) ? successfulRecords : successfulRecords[0];
      }
    } catch (error) {
      console.error("Error creating attendance:", error);
      throw error;
    }
  },

  async update(id, data) {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      const params = {
        records: [{
          Id: parseInt(id),
          Name: data.name || data.Name,
          date: data.date,
          status: data.status,
          notes: data.notes,
          student_id: parseInt(data.studentId || data.student_id),
          class_id: parseInt(data.classId || data.class_id),
          Tags: data.tags || data.Tags,
          Owner: data.owner || data.Owner
        }]
      };

      const response = await apperClient.updateRecord('attendance', params);

      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return null;
      }

      if (response.results) {
        const failedRecords = response.results.filter(result => !result.success);
        
        if (failedRecords.length > 0) {
          console.error(`Failed to update ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
          
          failedRecords.forEach(record => {
            record.errors?.forEach(error => {
              toast.error(`${error.fieldLabel}: ${error.message}`);
            });
            if (record.message) toast.error(record.message);
          });
          return null;
        }

        return response.results[0].data;
      }
    } catch (error) {
      console.error("Error updating attendance:", error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      const params = {
        RecordIds: [parseInt(id)]
      };

      const response = await apperClient.deleteRecord('attendance', params);

      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return false;
      }

      if (response.results) {
        const failedDeletions = response.results.filter(result => !result.success);
        
        if (failedDeletions.length > 0) {
          console.error(`Failed to delete ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
          
          failedDeletions.forEach(record => {
            if (record.message) toast.error(record.message);
          });
          return false;
        }

        return true;
      }
    } catch (error) {
      console.error("Error deleting attendance:", error);
      throw error;
    }
  }
};

export default attendanceService;