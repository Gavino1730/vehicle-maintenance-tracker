import { useState, useEffect } from 'react'
import axios from 'axios'
import './CarProfile.css'

const formatDateOnly = (dateString) => {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString()
}

export default function CarProfile({ currentMileage }) {
  const [carInfo, setCarInfo] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({})

  useEffect(() => {
    loadCarInfo()
  }, [])

  const loadCarInfo = async () => {
    try {
      const result = await axios.get('/api/car-info')
      setCarInfo(result.data)
      setEditData(result.data)
    } catch (error) {
      console.error('Failed to load car info:', error)
    }
  }

  const handleChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    try {
      const result = await axios.put('/api/car-info', editData)
      setCarInfo(result.data)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save car info:', error)
      alert('Failed to save changes')
    }
  }

  const handleCancel = () => {
    setEditData(carInfo)
    setIsEditing(false)
  }

  const calculateOwnership = () => {
    if (!carInfo?.purchaseDate) return 'Unknown'
    const purchase = new Date(carInfo.purchaseDate)
    const now = new Date()
    const diffMs = now - purchase
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const years = Math.floor(diffDays / 365)
    const months = Math.floor((diffDays % 365) / 30)
    
    if (years > 0) {
      return months > 0 ? `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''}` : `${years} year${years > 1 ? 's' : ''}`
    } else if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''}`
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`
    }
  }

  const calculateMilesDriven = () => {
    if (!carInfo?.purchaseMileage) return currentMileage.toLocaleString()
    return (currentMileage - carInfo.purchaseMileage).toLocaleString()
  }

  const calculateAvgMilesPerYear = () => {
    if (!carInfo?.purchaseDate || !carInfo?.purchaseMileage) return 'N/A'
    const purchase = new Date(carInfo.purchaseDate)
    const now = new Date()
    const years = (now - purchase) / (1000 * 60 * 60 * 24 * 365)
    const milesDriven = currentMileage - carInfo.purchaseMileage
    return Math.round(milesDriven / years).toLocaleString()
  }

  if (!carInfo) return <div className="loading">Loading car information...</div>

  return (
    <div className="car-profile">
      <div className="profile-header">
        <h2>🚙 {carInfo.carName || 'My 4Runner'}</h2>
        <button 
          className={isEditing ? "btn-cancel" : "btn-edit-profile"}
          onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
        >
          {isEditing ? '❌ Cancel' : '✏️ Edit Profile'}
        </button>
      </div>

      {!isEditing ? (
        <>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>Current Mileage</h3>
                <p className="stat-number">{currentMileage.toLocaleString()}</p>
                <span className="stat-label">miles</span>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-icon">🛣️</div>
              <div className="stat-info">
                <h3>Miles Driven by Me</h3>
                <p className="stat-number">{calculateMilesDriven()}</p>
                <span className="stat-label">miles</span>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-icon">⏱️</div>
              <div className="stat-info">
                <h3>Ownership Time</h3>
                <p className="stat-time">{calculateOwnership()}</p>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-icon">📈</div>
              <div className="stat-info">
                <h3>Avg Miles/Year</h3>
                <p className="stat-number">{calculateAvgMilesPerYear()}</p>
                <span className="stat-label">miles/year</span>
              </div>
            </div>
          </div>

          <div className="info-sections">
            <div className="info-section">
              <h3>🚗 Vehicle Details</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Year:</span>
                  <span className="info-value">{carInfo.year || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Model:</span>
                  <span className="info-value">{carInfo.model || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Trim:</span>
                  <span className="info-value">{carInfo.trim || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Color:</span>
                  <span className="info-value">{carInfo.color || 'Not set'}</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>📋 Registration</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">License Plate:</span>
                  <span className="info-value license">{carInfo.licensePlate || 'Not set'}</span>
                </div>
                <div className="info-item full-width">
                  <span className="info-label">VIN:</span>
                  <span className="info-value vin">{carInfo.vin || 'Not set'}</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>🛒 Purchase Info</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Purchase Date:</span>
                  <span className="info-value">{carInfo.purchaseDate ? formatDateOnly(carInfo.purchaseDate) : 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Purchase Mileage:</span>
                  <span className="info-value">{carInfo.purchaseMileage ? carInfo.purchaseMileage.toLocaleString() + ' mi' : 'Not set'}</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>⚙️ Engine & Drivetrain</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Engine:</span>
                  <span className="info-value">{carInfo.engine || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Transmission:</span>
                  <span className="info-value">{carInfo.transmission || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Drivetrain:</span>
                  <span className="info-value">{carInfo.drivetrain || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Fuel Type:</span>
                  <span className="info-value">{carInfo.fuelType || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Tank Capacity:</span>
                  <span className="info-value">{carInfo.tankCapacity || 'Not set'}</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>🛢️ Fluids & Capacities</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Oil Capacity:</span>
                  <span className="info-value">{carInfo.oilCapacity || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Oil Type:</span>
                  <span className="info-value">{carInfo.oilType || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Coolant Capacity:</span>
                  <span className="info-value">{carInfo.coolantCapacity || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Coolant Type:</span>
                  <span className="info-value">{carInfo.coolantType || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Brake Fluid Type:</span>
                  <span className="info-value">{carInfo.brakeFluidType || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Trans Fluid Type:</span>
                  <span className="info-value">{carInfo.transmissionFluidType || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Trans Fluid Capacity:</span>
                  <span className="info-value">{carInfo.transmissionFluidCapacity || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Diff Fluid Type:</span>
                  <span className="info-value">{carInfo.differentialFluidType || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Diff Fluid Capacity:</span>
                  <span className="info-value">{carInfo.differentialFluidCapacity || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">T-Case Fluid Type:</span>
                  <span className="info-value">{carInfo.transferCaseFluidType || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">T-Case Fluid Capacity:</span>
                  <span className="info-value">{carInfo.transferCaseFluidCapacity || 'Not set'}</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>🔧 Tires & Wheels</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Tire Size:</span>
                  <span className="info-value">{carInfo.tireSize || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Wheel Size:</span>
                  <span className="info-value">{carInfo.wheelSize || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Front Tire Pressure:</span>
                  <span className="info-value">{carInfo.tirePressureFront || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Rear Tire Pressure:</span>
                  <span className="info-value">{carInfo.tirePressureRear || 'Not set'}</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>🔋 Parts & Specs</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Battery Specs:</span>
                  <span className="info-value">{carInfo.batterySpecs || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Spark Plug Type:</span>
                  <span className="info-value">{carInfo.sparkPlugType || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Spark Plug Gap:</span>
                  <span className="info-value">{carInfo.sparkPlugGap || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Air Filter Part #:</span>
                  <span className="info-value">{carInfo.airFilterPartNumber || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Oil Filter Part #:</span>
                  <span className="info-value">{carInfo.oilFilterPartNumber || 'Not set'}</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>📊 Weight & Capacity</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Towing Capacity:</span>
                  <span className="info-value">{carInfo.towingCapacity || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">GVWR:</span>
                  <span className="info-value">{carInfo.gvwr || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Curb Weight:</span>
                  <span className="info-value">{carInfo.curbWeight || 'Not set'}</span>
                </div>
              </div>
            </div>

            {carInfo.mods && (
              <div className="info-section">
                <h3>🔧 Modifications</h3>
                <p className="mods-text">{carInfo.mods}</p>
              </div>
            )}

            {carInfo.notes && (
              <div className="info-section">
                <h3>📝 Notes</h3>
                <p className="notes-text">{carInfo.notes}</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="edit-form">
          <div className="form-section">
            <h3>🚗 Vehicle Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Car Name</label>
                <input
                  type="text"
                  value={editData.carName || ''}
                  onChange={(e) => handleChange('carName', e.target.value)}
                  placeholder="My 4Runner"
                />
              </div>
              <div className="form-group">
                <label>Year</label>
                <input
                  type="number"
                  value={editData.year || ''}
                  onChange={(e) => handleChange('year', e.target.value)}
                  placeholder="2010"
                />
              </div>
              <div className="form-group">
                <label>Model</label>
                <input
                  type="text"
                  value={editData.model || ''}
                  onChange={(e) => handleChange('model', e.target.value)}
                  placeholder="4Runner"
                />
              </div>
              <div className="form-group">
                <label>Trim</label>
                <input
                  type="text"
                  value={editData.trim || ''}
                  onChange={(e) => handleChange('trim', e.target.value)}
                  placeholder="SR5, Trail, Limited, etc."
                />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input
                  type="text"
                  value={editData.color || ''}
                  onChange={(e) => handleChange('color', e.target.value)}
                  placeholder="Black, Silver, etc."
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>📋 Registration</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>License Plate</label>
                <input
                  type="text"
                  value={editData.licensePlate || ''}
                  onChange={(e) => handleChange('licensePlate', e.target.value)}
                  placeholder="ABC-1234"
                />
              </div>
              <div className="form-group full-width">
                <label>VIN</label>
                <input
                  type="text"
                  value={editData.vin || ''}
                  onChange={(e) => handleChange('vin', e.target.value)}
                  placeholder="17-character VIN"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>🛒 Purchase Info</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Purchase Date</label>
                <input
                  type="date"
                  value={editData.purchaseDate || ''}
                  onChange={(e) => handleChange('purchaseDate', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Purchase Mileage</label>
                <input
                  type="number"
                  value={editData.purchaseMileage || ''}
                  onChange={(e) => handleChange('purchaseMileage', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>⚙️ Engine & Drivetrain</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Engine</label>
                <input
                  type="text"
                  value={editData.engine || ''}
                  onChange={(e) => handleChange('engine', e.target.value)}
                  placeholder="4.0L V6"
                />
              </div>
              <div className="form-group">
                <label>Transmission</label>
                <input
                  type="text"
                  value={editData.transmission || ''}
                  onChange={(e) => handleChange('transmission', e.target.value)}
                  placeholder="5-Speed Auto"
                />
              </div>
              <div className="form-group">
                <label>Drivetrain</label>
                <input
                  type="text"
                  value={editData.drivetrain || ''}
                  onChange={(e) => handleChange('drivetrain', e.target.value)}
                  placeholder="4WD"
                />
              </div>
              <div className="form-group">
                <label>Fuel Type</label>
                <input
                  type="text"
                  value={editData.fuelType || ''}
                  onChange={(e) => handleChange('fuelType', e.target.value)}
                  placeholder="Regular Unleaded"
                />
              </div>
              <div className="form-group">
                <label>Tank Capacity</label>
                <input
                  type="text"
                  value={editData.tankCapacity || ''}
                  onChange={(e) => handleChange('tankCapacity', e.target.value)}
                  placeholder="23 gallons"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>🛢️ Fluids & Capacities</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Oil Capacity</label>
                <input
                  type="text"
                  value={editData.oilCapacity || ''}
                  onChange={(e) => handleChange('oilCapacity', e.target.value)}
                  placeholder="5.5 quarts"
                />
              </div>
              <div className="form-group">
                <label>Oil Type</label>
                <input
                  type="text"
                  value={editData.oilType || ''}
                  onChange={(e) => handleChange('oilType', e.target.value)}
                  placeholder="0W-20, 5W-30"
                />
              </div>
              <div className="form-group">
                <label>Coolant Capacity</label>
                <input
                  type="text"
                  value={editData.coolantCapacity || ''}
                  onChange={(e) => handleChange('coolantCapacity', e.target.value)}
                  placeholder="10 quarts"
                />
              </div>
              <div className="form-group">
                <label>Coolant Type</label>
                <input
                  type="text"
                  value={editData.coolantType || ''}
                  onChange={(e) => handleChange('coolantType', e.target.value)}
                  placeholder="Toyota Pink"
                />
              </div>
              <div className="form-group">
                <label>Brake Fluid Type</label>
                <input
                  type="text"
                  value={editData.brakeFluidType || ''}
                  onChange={(e) => handleChange('brakeFluidType', e.target.value)}
                  placeholder="DOT 3"
                />
              </div>
              <div className="form-group">
                <label>Transmission Fluid Type</label>
                <input
                  type="text"
                  value={editData.transmissionFluidType || ''}
                  onChange={(e) => handleChange('transmissionFluidType', e.target.value)}
                  placeholder="ATF WS"
                />
              </div>
              <div className="form-group">
                <label>Transmission Fluid Capacity</label>
                <input
                  type="text"
                  value={editData.transmissionFluidCapacity || ''}
                  onChange={(e) => handleChange('transmissionFluidCapacity', e.target.value)}
                  placeholder="12 quarts"
                />
              </div>
              <div className="form-group">
                <label>Differential Fluid Type</label>
                <input
                  type="text"
                  value={editData.differentialFluidType || ''}
                  onChange={(e) => handleChange('differentialFluidType', e.target.value)}
                  placeholder="75W-85 GL-5"
                />
              </div>
              <div className="form-group">
                <label>Differential Fluid Capacity</label>
                <input
                  type="text"
                  value={editData.differentialFluidCapacity || ''}
                  onChange={(e) => handleChange('differentialFluidCapacity', e.target.value)}
                  placeholder="2.9 quarts"
                />
              </div>
              <div className="form-group">
                <label>Transfer Case Fluid Type</label>
                <input
                  type="text"
                  value={editData.transferCaseFluidType || ''}
                  onChange={(e) => handleChange('transferCaseFluidType', e.target.value)}
                  placeholder="ATF IV"
                />
              </div>
              <div className="form-group">
                <label>Transfer Case Fluid Capacity</label>
                <input
                  type="text"
                  value={editData.transferCaseFluidCapacity || ''}
                  onChange={(e) => handleChange('transferCaseFluidCapacity', e.target.value)}
                  placeholder="1.3 quarts"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>🔧 Tires & Wheels</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Tire Size</label>
                <input
                  type="text"
                  value={editData.tireSize || ''}
                  onChange={(e) => handleChange('tireSize', e.target.value)}
                  placeholder="265/70R17"
                />
              </div>
              <div className="form-group">
                <label>Wheel Size</label>
                <input
                  type="text"
                  value={editData.wheelSize || ''}
                  onChange={(e) => handleChange('wheelSize', e.target.value)}
                  placeholder="17x7.5"
                />
              </div>
              <div className="form-group">
                <label>Front Tire Pressure</label>
                <input
                  type="text"
                  value={editData.tirePressureFront || ''}
                  onChange={(e) => handleChange('tirePressureFront', e.target.value)}
                  placeholder="32 PSI"
                />
              </div>
              <div className="form-group">
                <label>Rear Tire Pressure</label>
                <input
                  type="text"
                  value={editData.tirePressureRear || ''}
                  onChange={(e) => handleChange('tirePressureRear', e.target.value)}
                  placeholder="32 PSI"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>🔋 Parts & Specs</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Battery Specs</label>
                <input
                  type="text"
                  value={editData.batterySpecs || ''}
                  onChange={(e) => handleChange('batterySpecs', e.target.value)}
                  placeholder="Group 35, 12V"
                />
              </div>
              <div className="form-group">
                <label>Spark Plug Type</label>
                <input
                  type="text"
                  value={editData.sparkPlugType || ''}
                  onChange={(e) => handleChange('sparkPlugType', e.target.value)}
                  placeholder="NGK 90919-01253"
                />
              </div>
              <div className="form-group">
                <label>Spark Plug Gap</label>
                <input
                  type="text"
                  value={editData.sparkPlugGap || ''}
                  onChange={(e) => handleChange('sparkPlugGap', e.target.value)}
                  placeholder="0.043 in"
                />
              </div>
              <div className="form-group">
                <label>Air Filter Part #</label>
                <input
                  type="text"
                  value={editData.airFilterPartNumber || ''}
                  onChange={(e) => handleChange('airFilterPartNumber', e.target.value)}
                  placeholder="17801-0C010"
                />
              </div>
              <div className="form-group">
                <label>Oil Filter Part #</label>
                <input
                  type="text"
                  value={editData.oilFilterPartNumber || ''}
                  onChange={(e) => handleChange('oilFilterPartNumber', e.target.value)}
                  placeholder="04152-YZZA6"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>📊 Weight & Capacity</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Towing Capacity</label>
                <input
                  type="text"
                  value={editData.towingCapacity || ''}
                  onChange={(e) => handleChange('towingCapacity', e.target.value)}
                  placeholder="5000 lbs"
                />
              </div>
              <div className="form-group">
                <label>GVWR</label>
                <input
                  type="text"
                  value={editData.gvwr || ''}
                  onChange={(e) => handleChange('gvwr', e.target.value)}
                  placeholder="6000 lbs"
                />
              </div>
              <div className="form-group">
                <label>Curb Weight</label>
                <input
                  type="text"
                  value={editData.curbWeight || ''}
                  onChange={(e) => handleChange('curbWeight', e.target.value)}
                  placeholder="4400 lbs"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>🔧 Modifications</h3>
            <div className="form-group full-width">
              <textarea
                value={editData.mods || ''}
                onChange={(e) => handleChange('mods', e.target.value)}
                placeholder="List your mods here... (e.g., Lift kit, wheels, exhaust, etc.)"
                rows="6"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>📝 Notes</h3>
            <div className="form-group full-width">
              <textarea
                value={editData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional notes about your vehicle..."
                rows="4"
              />
            </div>
          </div>

          <div className="form-actions">
            <button className="btn-save" onClick={handleSave}>💾 Save Changes</button>
            <button className="btn-cancel" onClick={handleCancel}>❌ Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
