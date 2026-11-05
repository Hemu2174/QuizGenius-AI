import axios from 'axios'
import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s for PDF extraction operations
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach current Supabase user JWT to all outgoing API requests
apiClient.interceptors.request.use(async (config) => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
  } catch (error) {
    // Proceed without token if session retrieval fails
    console.warn('Could not attach Supabase session token to API request:', error)
  }
  return config
})

// Centralized API endpoints
export const healthService = {
  /**
   * Performs an actual live health check against the FastAPI backend.
   * Target endpoint: GET /api/health
   */
  async checkHealth() {
    const response = await apiClient.get('/api/health')
    return response.data
  },

  /**
   * Root API ping
   */
  async getRoot() {
    const response = await apiClient.get('/')
    return response.data
  },
}

export const authService = {
  /**
   * Retrieves profile information for the verified Supabase user from the backend.
   * Target endpoint: GET /api/auth/me
   */
  async getMe() {
    const response = await apiClient.get('/api/auth/me')
    return response.data
  },

  /**
   * Retrieves backend authentication status.
   */
  async getStatus() {
    const response = await apiClient.get('/api/auth/status')
    return response.data
  },
}

export const documentsService = {
  /**
   * Lists all study documents belonging to the authenticated user.
   * Target endpoint: GET /api/documents
   */
  async listDocuments() {
    const response = await apiClient.get('/api/documents')
    return response.data
  },

  /**
   * Processes an uploaded PDF: extracts text page-by-page and generates chunks.
   * Target endpoint: POST /api/documents/process
   */
  async processDocument(payload) {
    const response = await apiClient.post('/api/documents/process', payload)
    return response.data
  },

  /**
   * Retrieves detailed document metadata, extracted text, and chunk previews.
   * Target endpoint: GET /api/documents/{id}
   */
  async getDocument(documentId) {
    const response = await apiClient.get(`/api/documents/${documentId}`)
    return response.data
  },

  /**
   * Deletes a document, its database chunks, and its storage file.
   * Target endpoint: DELETE /api/documents/{id}
   */
  async deleteDocument(documentId) {
    const response = await apiClient.delete(`/api/documents/${documentId}`)
    return response.data
  },

  /**
   * Retries processing on a failed document.
   * Target endpoint: POST /api/documents/{id}/retry
   */
  async retryProcessing(documentId) {
    const response = await apiClient.post(`/api/documents/${documentId}/retry`)
    return response.data
  },
}

export const quizzesService = {
  async listQuizzes() {
    const response = await apiClient.get('/api/quizzes')
    return response.data
  },
}

export const analyticsService = {
  async getOverview() {
    const response = await apiClient.get('/api/analytics/overview')
    return response.data
  },
}

export default apiClient
