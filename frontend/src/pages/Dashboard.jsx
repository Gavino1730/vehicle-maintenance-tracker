import { useState } from 'react'
import ServiceList from '../components/ServiceList'
import ServiceForm from '../components/ServiceForm'
import ServiceHistory from '../components/ServiceHistory'
import ComponentTracker from '../components/ComponentTracker'
import './Dashboard.css'

export default function Dashboard({
  currentMileage,
  services,
  history,
  components,
  onUpdateMileage,
  onAddService,
  onCompleteService
}) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [editingMileage, setEditingMileage] = useState(false)
  const [newMileage, setNewMileage] = useState(currentMileage)

  const handleSaveMileage = () => {
    const mileageValue = parseInt(newMileage) || 0
    if (mileageValue >= 0) {
      onUpdateMileage(mileageValue)
      setEditingMileage(false)
    }
  }

  const handleCancelMileage = () => {
    setNewMileage(currentMileage)
    setEditingMileage(false)
  }

  // Calculate dashboard stats
  const overdueServices = services.filter(s => {
    const nextDue = s.lastCompletedMileage + s.interval
    return currentMileage >= nextDue
  }).length

  const dueSoonServices = services.filter(s => {
    const nextDue = s.lastCompletedMileage + s.interval
    const remaining = nextDue - currentMileage
    return remaining > 0 && remaining <= 500
  }).length

  const totalServices = services.length
  const recentHistory = history.slice(0, 5)

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>4Runner Maintenance Tracker</h1>
        <nav className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-tab ${activeTab === 'components' ? 'active' : ''}`}
            onClick={() => setActiveTab('components')}
          >
            Components
          </button>
          <button
            className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </nav>
      </header>

      <main className="dashboard-content">
        {activeTab === 'dashboard' && (
          <>
            <div className="stats-overview">
              <div className="stat-card stat-mileage">
                <div className="stat-icon">🚗</div>
                <div className="stat-content">
                  <h3>Current Mileage</h3>
                  {!editingMileage ? (
                    <>
                      <p className="stat-value">{currentMileage.toLocaleString()}</p>
                      <span className="stat-label">miles</span>
                      <button
                        className="btn-edit-mileage"
                        onClick={() => {
                          setNewMileage(currentMileage)
                          setEditingMileage(true)
                        }}
                        title="Edit mileage"
                      >
                        ✏️
                      </button>
                    </>
                  ) : (
                    <div className="mileage-edit-inline">
                      <input
                        type="number"
                        value={newMileage}
                        onChange={(e) => setNewMileage(e.target.value)}
                        className="mileage-input-inline"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveMileage()
                          if (e.key === 'Escape') handleCancelMileage()
                        }}
                      />
                      <div className="mileage-buttons-inline">
                        <button className="btn-save-inline" onClick={handleSaveMileage}>
                          ✓
                        </button>
                        <button className="btn-cancel-inline" onClick={handleCancelMileage}>
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="stat-card stat-overdue">
                <div className="stat-icon">⚠️</div>
                <div className="stat-content">
                  <h3>Overdue</h3>
                  <p className="stat-value">{overdueServices}</p>
                  <span className="stat-label">services</span>
                </div>
              </div>
              
              <div className="stat-card stat-due-soon">
                <div className="stat-icon">⏰</div>
                <div className="stat-content">
                  <h3>Due Soon</h3>
                  <p className="stat-value">{dueSoonServices}</p>
                  <span className="stat-label">services</span>
                </div>
              </div>
              
              <div className="stat-card stat-total">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <h3>Total Tracked</h3>
                  <p className="stat-value">{totalServices}</p>
                  <span className="stat-label">services</span>
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="card-section full-width">
                <div className="services-header">
                  <h2>Maintenance Schedule</h2>
                  <button
                    className="btn-primary"
                    onClick={() => setShowServiceForm(!showServiceForm)}
                  >
                    {showServiceForm ? 'Cancel' : '+ Add Service'}
                  </button>
                </div>

                {showServiceForm && (
                  <ServiceForm
                    onSubmit={(service) => {
                      onAddService(service)
                      setShowServiceForm(false)
                    }}
                  />
                )}

                <ServiceList
                  services={services}
                  currentMileage={currentMileage}
                  onCompleteService={onCompleteService}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'components' && (
          <ComponentTracker
            currentMileage={currentMileage}
            components={components}
          />
        )}

        {activeTab === 'history' && (
          <ServiceHistory history={history} services={services} />
        )}
      </main>
    </div>
  )
}
