import { useState, useEffect } from 'react'
import axios from 'axios'
import Dashboard from './pages/Dashboard'
import './App.css'

function App() {
  const [currentMileage, setCurrentMileage] = useState(0)
  const [services, setServices] = useState([])
  const [history, setHistory] = useState([])
  const [components, setComponents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [mileageRes, servicesRes, historyRes, componentsRes] = await Promise.all([
        axios.get('/api/mileage'),
        axios.get('/api/services'),
        axios.get('/api/history'),
        axios.get('/api/components')
      ])
      setCurrentMileage(mileageRes.data.mileage || 0)
      setServices(servicesRes.data || [])
      setHistory(historyRes.data || [])
      setComponents(componentsRes.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateMileage = async (newMileage) => {
    try {
      await axios.post('/api/mileage', { mileage: newMileage })
      setCurrentMileage(newMileage)
    } catch (error) {
      console.error('Failed to update mileage:', error)
    }
  }

  const addService = async (service) => {
    try {
      const res = await axios.post('/api/services', service)
      setServices([...services, res.data])
    } catch (error) {
      console.error('Failed to add service:', error)
    }
  }

  const logServiceCompletion = async (serviceId) => {
    try {
      const res = await axios.post(`/api/services/${serviceId}/complete`, {
        completedMileage: currentMileage
      })
      setHistory([...history, res.data])
      fetchData()
    } catch (error) {
      console.error('Failed to log service:', error)
    }
  }

  const refreshHistory = async () => {
    try {
      const res = await axios.get('/api/history')
      setHistory(res.data || [])
    } catch (error) {
      console.error('Failed to refresh history:', error)
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <Dashboard
      currentMileage={currentMileage}
      services={services}
      history={history}
      components={components}
      onUpdateMileage={updateMileage}
      onAddService={addService}
      onCompleteService={logServiceCompletion}
    />
  )
}

export default App
