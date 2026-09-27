import { useState } from 'react'
import axios from 'axios'
import './ServiceList.css'

const formatDateOnly = (dateString) => {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString()
}

export default function ServiceList({
  services,
  currentMileage,
  onCompleteService
}) {
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')

  if (services.length === 0) {
    return (
      <div className="no-services">
        <p>No services scheduled yet. Add one to get started!</p>
      </div>
    )
  }

  const getServiceStatus = (service) => {
    const nextDueMileage = service.lastCompletedMileage + service.interval
    const mileageRemaining = nextDueMileage - currentMileage

    if (mileageRemaining <= 0) {
      return { status: 'overdue', remaining: Math.abs(mileageRemaining) }
    } else if (mileageRemaining <= 500) {
      return { status: 'due-soon', remaining: mileageRemaining }
    }
    return { status: 'ok', remaining: mileageRemaining }
  }

  // Sort services by urgency: overdue first (worst first), then due-soon, then ok (soonest first)
  const sortedServices = [...services]
    .map(service => {
      const { status, remaining } = getServiceStatus(service)
      return { ...service, _status: status, _remaining: remaining }
    })
    .sort((a, b) => {
      // Overdue first, then due-soon, then ok
      const statusOrder = { overdue: 0, 'due-soon': 1, ok: 2 }
      if (statusOrder[a._status] !== statusOrder[b._status]) {
        return statusOrder[a._status] - statusOrder[b._status]
      }
      // Within same status: for overdue, worst first (most overdue = most negative)
      // For due-soon and ok: soonest first (lowest remaining miles)
      return a._remaining - b._remaining
    })

  const handleEdit = (service) => {
    setEditingId(service.id)
    setEditValue(service.lastCompletedMileage)
  }

  const handleSave = async (service) => {
    try {
      const res = await axios.put(`/api/services/${service.id}`, {
        ...service,
        lastCompletedMileage: parseInt(editValue, 10)
      })
      setEditingId(null)
      setEditValue('')
      window.location.reload() // quick refresh for now
    } catch (e) {
      alert('Failed to update service')
    }
  }

  return (
    <div className="service-list">
      {sortedServices.map((service) => {
        const status = service._status
        const remaining = service._remaining
        const nextDueMileage = service.lastCompletedMileage + service.interval

        // Progress bar logic
        const milesSinceLast = currentMileage - service.lastCompletedMileage
        const percent = Math.min(100, Math.max(0, (milesSinceLast / service.interval) * 100))
        let barColor = '#10b981' // green
        if (status === 'due-soon') barColor = '#f59e0b' // yellow
        if (status === 'overdue') barColor = '#ef4444' // red

        // Format last completed date
        let lastDoneText = 'Never'
        if (service.lastCompletedMileage > 0) {
          lastDoneText = `${service.lastCompletedMileage.toLocaleString()} miles`
          if (service.lastCompletedDate) {
            lastDoneText += ` (${formatDateOnly(service.lastCompletedDate)})`
          }
        }

        return (
          <div key={service.id} className={`service-card status-${status}`}>
            <div className="service-info">
              <h3>{service.name}</h3>
              <div className="service-details">
                <span className="detail">
                  <strong>Interval:</strong> {service.interval.toLocaleString()} miles
                </span>
                <span className="detail">
                  <strong>Last Done:</strong> {editingId === service.id ? (
                    <>
                      <input
                        type="number"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        style={{ width: 90, marginRight: 8 }}
                      />
                      <button className="btn-save" onClick={() => handleSave(service)}>Save</button>
                      <button className="btn-cancel-edit" onClick={() => setEditingId(null)}>Cancel</button>
                    </>
                  ) : (
                    lastDoneText
                  )}
                </span>
                <span className="detail">
                  <strong>Next Due:</strong> {nextDueMileage.toLocaleString()} miles
                </span>
                <div className="service-progress-bar">
                  <div
                    className="service-progress-fill"
                    style={{ width: `${percent}%`, background: barColor }}
                  ></div>
                  <span className="service-progress-label">
                    {percent < 100 ? `${(100 - percent).toFixed(0)}% left` : 'DUE'}
                  </span>
                </div>
              </div>
              {service.notes && (
                <p className="notes">{service.notes}</p>
              )}
            </div>

            <div className="service-status">
              <div className={`status-badge ${status}`}>
                {status === 'overdue' && `Overdue by ${remaining.toLocaleString()} mi`}
                {status === 'due-soon' && `Due in ${remaining.toLocaleString()} mi`}
                {status === 'ok' && `${remaining.toLocaleString()} mi left`}
              </div>
              <button
                className="btn-complete"
                onClick={() => onCompleteService(service.id)}
              >
                Mark Complete
              </button>
              <button
                className="btn-edit"
                onClick={() => handleEdit(service)}
              >
                Edit
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
