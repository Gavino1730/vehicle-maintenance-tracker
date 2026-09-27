import './ServiceForm.css'

export default function ServiceForm({ onSubmit }) {
  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const service = {
      name: formData.get('name'),
      interval: parseInt(formData.get('interval')),
      lastCompletedMileage: parseInt(formData.get('lastMileage')) || 0,
      notes: formData.get('notes')
    }
    onSubmit(service)
    e.target.reset()
  }

  return (
    <form className="service-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Service Name</label>
        <input
          type="text"
          name="name"
          placeholder="e.g., Oil Change, Tire Rotation"
          required
        />
      </div>

      <div className="form-group">
        <label>Service Interval (miles)</label>
        <input
          type="number"
          name="interval"
          placeholder="e.g., 5000"
          required
          min="100"
        />
      </div>

      <div className="form-group">
        <label>Last Completed Mileage</label>
        <input
          type="number"
          name="lastMileage"
          placeholder="0"
          min="0"
        />
      </div>

      <div className="form-group">
        <label>Notes</label>
        <textarea
          name="notes"
          placeholder="Add any notes about this service..."
          rows="3"
        />
      </div>

      <button type="submit" className="btn-submit">
        Add Service
      </button>
    </form>
  )
}
