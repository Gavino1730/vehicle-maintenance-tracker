import { useState } from 'react'
import axios from 'axios'
import './AIInsights.css'

export default function AIInsights({ currentMileage, services, history }) {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getInsights = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post('/api/ai-insights', {
        currentMileage,
        services,
        history
      })
      setInsights(response.data.insights)
    } catch (err) {
      setError('Failed to get AI insights. Make sure your OpenAI API key is configured.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-insights">
      <div className="insights-header">
        <h2>AI Maintenance Insights</h2>
        <p>Get personalized recommendations for your 4Runner maintenance</p>
      </div>

      {!insights ? (
        <button
          className="btn-get-insights"
          onClick={getInsights}
          disabled={loading}
        >
          {loading ? 'Getting insights...' : 'Get AI Insights'}
        </button>
      ) : (
        <div className="insights-content">
          <div className="insights-text">
            {insights}
          </div>
          <button
            className="btn-refresh"
            onClick={getInsights}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Get New Insights'}
          </button>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}
