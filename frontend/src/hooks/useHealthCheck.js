import { useState, useEffect, useCallback } from 'react'
import { healthService } from '../services/api'

export function useHealthCheck(pollIntervalMs = 30000) {
  const [status, setStatus] = useState('checking') // 'checking' | 'connected' | 'offline'
  const [healthData, setHealthData] = useState(null)
  const [error, setError] = useState(null)
  const [lastChecked, setLastChecked] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const checkStatus = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const data = await healthService.checkHealth()
      if (data && data.status === 'online') {
        setStatus('connected')
        setHealthData(data)
        setError(null)
      } else {
        setStatus('offline')
        setError('Unexpected response from server')
      }
    } catch (err) {
      setStatus('offline')
      setHealthData(null)
      setError(err.message || 'Cannot reach FastAPI backend server')
    } finally {
      setLastChecked(new Date())
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    checkStatus()
    if (pollIntervalMs > 0) {
      const interval = setInterval(checkStatus, pollIntervalMs)
      return () => clearInterval(interval)
    }
  }, [checkStatus, pollIntervalMs])

  return {
    status,
    healthData,
    error,
    lastChecked,
    isRefreshing,
    refresh: checkStatus,
  }
}

