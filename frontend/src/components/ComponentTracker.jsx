import { useState } from 'react'
import axios from 'axios'
import './ComponentTracker.css'

const parseDateOnly = (dateString) => {
  if (!dateString) return null
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export default function ComponentTracker({ currentMileage, components: initialComponents }) {
  const [components, setComponents] = useState(initialComponents)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newComponent, setNewComponent] = useState({
    name: '',
    category: 'Suspension',
    installMileage: currentMileage,
    lifespan: 60000,
    notes: ''
  })
  const [editData, setEditData] = useState({})

  const categories = ['Suspension', 'Brakes', 'Tires', 'Engine', 'Transmission', 'Cooling', 'Electrical', 'Interior', 'Exterior', 'Other']

  const handleAddChange = (field, value) => {
    setNewComponent(prev => ({
      ...prev,
      [field]: field === 'installMileage' || field === 'lifespan' ? parseInt(value) || 0 : value
    }))
  }

  const handleAddComponent = async () => {
    if (!newComponent.name.trim()) {
      alert('Component name is required')
      return
    }

    try {
      const result = await axios.post('/api/components', newComponent)
      setComponents([...components, result.data])
      setNewComponent({
        name: '',
        category: 'Suspension',
        installMileage: currentMileage,
        lifespan: 60000,
        notes: ''
      })
      setShowAddForm(false)
    } catch (error) {
      console.error('Failed to add component:', error)
      alert('Failed to add component')
    }
  }

  const handleEdit = (component) => {
    setEditingId(component.id)
    setEditData({ ...component })
  }

  const handleEditChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: field === 'installMileage' || field === 'lifespan' ? parseInt(value) || 0 : value
    }))
  }

  const handleSaveEdit = async (id) => {
    try {
      const result = await axios.put(`/api/components/${id}`, editData)
      setComponents(components.map(c => c.id === id ? result.data : c))
      setEditingId(null)
      setEditData({})
    } catch (error) {
      console.error('Failed to update component:', error)
      alert('Failed to save changes')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this component?')) return

    try {
      await axios.delete(`/api/components/${id}`)
      setComponents(components.filter(c => c.id !== id))
    } catch (error) {
      console.error('Failed to delete component:', error)
      alert('Failed to delete component')
    }
  }

  const getTimeSinceInstalled = (installDate) => {
    if (!installDate) return 'Unknown'
    
    const installed = parseDateOnly(installDate)
    if (!installed) return 'Unknown'
    const now = new Date()
    const diffMs = now - installed
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    const years = Math.floor(diffDays / 365)
    const months = Math.floor((diffDays % 365) / 30)
    const days = diffDays % 30
    
    if (years > 0) {
      return months > 0 ? `${years}y ${months}mo` : `${years} year${years > 1 ? 's' : ''}`
    } else if (months > 0) {
      return days > 0 ? `${months}mo ${days}d` : `${months} month${months > 1 ? 's' : ''}`
    } else {
      return `${days} day${days !== 1 ? 's' : ''}`
    }
  }

  const getComponentStatus = (component) => {
    const milesUsed = currentMileage - component.installMileage
    const remainingMiles = component.lifespan - milesUsed
    const percentUsed = (milesUsed / component.lifespan) * 100

    return {
      milesUsed: Math.max(0, milesUsed),
      remainingMiles: Math.max(0, remainingMiles),
      percentUsed: Math.min(100, Math.max(0, percentUsed)),
      isDue: remainingMiles <= 0,
      isWarning: remainingMiles <= component.lifespan * 0.2
    }
  }

  return (
    <div className="component-tracker">
      <div className="tracker-header">
        <h2>Component Lifespan Tracker</h2>
        <button className="btn-add-component" onClick={() => setShowAddForm(!showAddForm)}>
          ➕ Add Component
        </button>
      </div>

      {showAddForm && (
        <div className="add-component-form">
          <h3>Track New Component</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Component Name *</label>
              <input
                type="text"
                value={newComponent.name}
                onChange={(e) => handleAddChange('name', e.target.value)}
                placeholder="e.g., Front Brake Pads, Suspension Bushings"
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select
                value={newComponent.category}
                onChange={(e) => handleAddChange('category', e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Install Mileage *</label>
              <input
                type="number"
                value={newComponent.installMileage}
                onChange={(e) => handleAddChange('installMileage', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Lifespan (miles) *</label>
              <input
                type="number"
                value={newComponent.lifespan}
                onChange={(e) => handleAddChange('lifespan', e.target.value)}
                placeholder="60000"
              />
            </div>

            <div className="form-group full-width">
              <label>Notes</label>
              <textarea
                value={newComponent.notes}
                onChange={(e) => handleAddChange('notes', e.target.value)}
                placeholder="Additional details..."
                rows="2"
              />
            </div>
          </div>

          <div className="form-actions">
            <button className="btn-save" onClick={handleAddComponent}>✅ Save</button>
            <button className="btn-cancel" onClick={() => setShowAddForm(false)}>❌ Cancel</button>
          </div>
        </div>
      )}

      <div className="components-grid">
        {components.map((component) => {
          const status = getComponentStatus(component)
          const isEditing = editingId === component.id

          return (
            <div
              key={component.id}
              className={`component-card ${status.isDue ? 'due' : status.isWarning ? 'warning' : 'good'}`}
            >
              {!isEditing ? (
                <>
                  <div className="component-header">
                    <div>
                      <h3>{component.name}</h3>
                      <span className="category-badge">{component.category}</span>
                    </div>
                    <div className="component-actions">
                      <button className="btn-edit" onClick={() => handleEdit(component)}>✏️</button>
                      <button className="btn-delete" onClick={() => handleDelete(component.id)}>🗑️</button>
                    </div>
                  </div>

                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${status.isDue ? 'due' : status.isWarning ? 'warning' : ''}`}
                      style={{ width: `${status.percentUsed}%` }}
                    ></div>
                  </div>

                  <div className="component-details">
                    <div className="detail">
                      <span className="label">Installed at:</span>
                      <span className="value">{component.installMileage.toLocaleString()} mi</span>
                    </div>
                    <div className="detail">
                      <span className="label">Time Installed:</span>
                      <span className="value">{getTimeSinceInstalled(component.installDate)}</span>
                    </div>
                    <div className="detail">
                      <span className="label">Used:</span>
                      <span className="value">{status.milesUsed.toLocaleString()} mi</span>
                    </div>
                    <div className="detail">
                      <span className="label">Remaining:</span>
                      <span className={`value ${status.isDue ? 'due' : ''}`}>
                        {status.remainingMiles.toLocaleString()} mi
                      </span>
                    </div>
                    <div className="detail">
                      <span className="label">Lifespan:</span>
                      <span className="value">{component.lifespan.toLocaleString()} mi</span>
                    </div>
                  </div>

                  {component.notes && (
                    <div className="component-notes">{component.notes}</div>
                  )}

                  {status.isDue && <div className="status-badge due">REPLACE NOW</div>}
                  {status.isWarning && !status.isDue && <div className="status-badge warning">WARNING</div>}
                </>
              ) : (
                <div className="edit-form">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => handleEditChange('name', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={editData.category}
                      onChange={(e) => handleEditChange('category', e.target.value)}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Install Mileage</label>
                    <input
                      type="number"
                      value={editData.installMileage}
                      onChange={(e) => handleEditChange('installMileage', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Lifespan (miles)</label>
                    <input
                      type="number"
                      value={editData.lifespan}
                      onChange={(e) => handleEditChange('lifespan', e.target.value)}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Notes</label>
                    <textarea
                      value={editData.notes || ''}
                      onChange={(e) => handleEditChange('notes', e.target.value)}
                      rows="2"
                    />
                  </div>

                  <div className="form-actions">
                    <button className="btn-save" onClick={() => handleSaveEdit(component.id)}>✅ Save</button>
                    <button className="btn-cancel" onClick={() => setEditingId(null)}>❌ Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {components.length === 0 && !showAddForm && (
        <div className="empty-state">
          <p>No components tracked yet. Add your first component to start tracking lifespan!</p>
        </div>
      )}
    </div>
  )
}
