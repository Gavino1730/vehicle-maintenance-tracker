import { useState } from 'react'
import axios from 'axios'
import './ServiceHistory.css'

const getTodayDateString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDateOnly = (dateString) => {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString()
}

export default function ServiceHistory({ history, services }) {
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [localHistory, setLocalHistory] = useState(history)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newRecord, setNewRecord] = useState({
    serviceId: '',
    serviceName: '',
    completedDate: getTodayDateString(),
    completedMileage: '',
    notes: ''
  })

  const handleEdit = (record) => {
    setEditingId(record.id)
    setEditData({ ...record })
  }

  const handleChange = (field, value) => {
    setEditData(prev => {
      const updated = {
        ...prev,
        [field]: field === 'completedMileage' ? parseInt(value) || 0 : value
      }
      // If serviceId changes, auto-fill serviceName
      if (field === 'serviceId' && value) {
        const selectedService = services.find(s => s.id === parseInt(value))
        if (selectedService) {
          updated.serviceName = selectedService.name
        }
      }
      return updated
    })
  }

  const handleSave = async (id) => {
    try {
      const updated = await axios.put(`/api/history/${id}`, editData)
      setLocalHistory(localHistory.map(item => 
        item.id === id ? updated.data : item
      ))
      setEditingId(null)
      setEditData({})
      window.location.reload()
    } catch (error) {
      console.error('Failed to update:', error)
      alert('Failed to save changes')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return
    }
    
    try {
      await axios.delete(`/api/history/${id}`)
      setLocalHistory(localHistory.filter(item => item.id !== id))
      setEditingId(null)
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('Failed to delete record')
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditData({})
  }

  const handleAddChange = (field, value) => {
    setNewRecord(prev => {
      const updated = {
        ...prev,
        [field]: field === 'completedMileage' ? value : value
      }
      // If serviceId changes, auto-fill serviceName
      if (field === 'serviceId' && value) {
        const selectedService = services.find(s => s.id === parseInt(value))
        if (selectedService) {
          updated.serviceName = selectedService.name
        }
      }
      return updated
    })
  }

  const handleAddPastService = async () => {
    if (!newRecord.serviceId || !newRecord.completedMileage) {
      alert('Please select service type and enter mileage')
      return
    }

    try {
      const result = await axios.post('/api/history', {
        serviceId: parseInt(newRecord.serviceId),
        serviceName: newRecord.serviceName,
        completedDate: newRecord.completedDate,
        completedMileage: parseInt(newRecord.completedMileage),
        notes: newRecord.notes
      })

      setLocalHistory([...localHistory, result.data])
      setNewRecord({
        serviceId: '',
        serviceName: '',
        completedDate: getTodayDateString(),
        completedMileage: '',
        notes: ''
      })
      setShowAddForm(false)
      window.location.reload()
    } catch (error) {
      console.error('Failed to add record:', error)
      alert('Failed to add maintenance record')
    }
  }

  if (localHistory.length === 0) {
    return (
      <div className="history-empty">
        <p>No service history yet. Complete a service to see it here!</p>
        <button 
          className="btn-add-past"
          onClick={() => setShowAddForm(true)}
        >
          ➕ Add Past Maintenance
        </button>
      </div>
    )
  }

  // Sort by date (newest first), then by mileage (highest first)
  const sortedHistory = [...localHistory].sort((a, b) => {
    const dateA = new Date(a.completedDate)
    const dateB = new Date(b.completedDate)
    if (dateB - dateA !== 0) {
      return dateB - dateA
    }
    return b.completedMileage - a.completedMileage
  })

  return (
    <div className="service-history">
      <div className="history-header">
        <h2>Service History</h2>
        <p>All completed maintenance services (click to edit)</p>
        <button 
          className="btn-add-past"
          onClick={() => setShowAddForm(true)}
        >
          ➕ Add Past Maintenance
        </button>
      </div>

      {showAddForm && (
        <div className="add-past-form">
          <h3>Add Past Maintenance</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Service Type *</label>
              <select
                value={newRecord.serviceId}
                onChange={(e) => handleAddChange('serviceId', e.target.value)}
              >
                <option value="">Select a service...</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                value={newRecord.completedDate}
                onChange={(e) => handleAddChange('completedDate', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Mileage *</label>
              <input
                type="number"
                value={newRecord.completedMileage}
                onChange={(e) => handleAddChange('completedMileage', e.target.value)}
                placeholder="e.g., 125000"
              />
            </div>

            <div className="form-group full-width">
              <label>Notes</label>
              <textarea
                value={newRecord.notes}
                onChange={(e) => handleAddChange('notes', e.target.value)}
                placeholder="Add any notes about this service..."
                rows="2"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              className="btn-save"
              onClick={handleAddPastService}
            >
              ✅ Save
            </button>
            <button
              className="btn-cancel-edit"
              onClick={() => setShowAddForm(false)}
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      )}

      <div className="history-list">
        {sortedHistory.map((record) => {
          const isEditing = editingId === record.id
          const date = isEditing 
            ? editData.completedDate 
            : formatDateOnly(record.completedDate)

          return (
            <div key={record.id} className="history-item">
              {!isEditing ? (
                <>
                  <div className="history-left">
                    <h3>{record.serviceName}</h3>
                    <div className="history-details">
                      <span className="detail-item">
                        <strong>Completed:</strong> {date}
                      </span>
                      <span className="detail-item">
                        <strong>Mileage:</strong> {record.completedMileage.toLocaleString()} mi
                      </span>
                    </div>
                    {record.notes && (
                      <p className="history-notes">{record.notes}</p>
                    )}
                  </div>
                  <div className="history-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(record)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(record.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="history-edit">
                    <div className="edit-group">
                      <label>Service Type</label>
                      <select
                        value={editData.serviceId || ''}
                        onChange={(e) => handleChange('serviceId', e.target.value)}
                      >
                        <option value="">Select a service...</option>
                        {services.map(service => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="edit-group">
                      <label>Date</label>
                      <input
                        type="date"
                        value={editData.completedDate.split('T')[0]}
                        onChange={(e) => handleChange('completedDate', e.target.value)}
                      />
                    </div>

                    <div className="edit-group">
                      <label>Mileage</label>
                      <input
                        type="number"
                        value={editData.completedMileage}
                        onChange={(e) => handleChange('completedMileage', e.target.value)}
                        placeholder="Mileage"
                      />
                    </div>

                    <div className="edit-group">
                      <label>Notes</label>
                      <textarea
                        value={editData.notes || ''}
                        onChange={(e) => handleChange('notes', e.target.value)}
                        placeholder="Add notes..."
                        rows="2"
                      />
                    </div>

                    <div className="edit-actions">
                      <button
                        className="btn-save"
                        onClick={() => handleSave(record.id)}
                      >
                        ✅ Save
                      </button>
                      <button
                        className="btn-cancel-edit"
                        onClick={handleCancel}
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
