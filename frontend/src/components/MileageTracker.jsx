import { useState } from 'react'
import './MileageTracker.css'

export default function MileageTracker({ currentMileage, onUpdateMileage }) {
  const [newMileage, setNewMileage] = useState(currentMileage)
  const [editing, setEditing] = useState(false)

  const handleSave = () => {
    if (newMileage >= currentMileage) {
      onUpdateMileage(newMileage)
      setEditing(false)
    }
  }

  return (
    <div className="mileage-tracker">
      <h2>Current Mileage</h2>
      <div className="mileage-display">
        <div className="mileage-number">{currentMileage.toLocaleString()}</div>
        <div className="mileage-label">miles</div>
      </div>

      {!editing ? (
        <button
          className="btn-secondary"
          onClick={() => {
            setNewMileage(currentMileage)
            setEditing(true)
          }}
        >
          Update Mileage
        </button>
      ) : (
        <div className="mileage-input-group">
          <input
            type="number"
            value={newMileage}
            onChange={(e) => setNewMileage(parseInt(e.target.value) || 0)}
            placeholder="Enter mileage"
            autoFocus
          />
          <button
            className="btn-primary"
            onClick={handleSave}
          >
            Save
          </button>
          <button
            className="btn-cancel"
            onClick={() => setEditing(false)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
