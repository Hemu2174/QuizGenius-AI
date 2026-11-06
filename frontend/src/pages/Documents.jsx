import { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Search,
  Upload,
  Plus,
  RefreshCw,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import UploadCard from '../components/UploadCard'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import GenerateQuizModal from '../components/GenerateQuizModal'
import QuizDetailModal from '../components/QuizDetailModal'
import { documentsService } from '../services/api'
import { formatBytes, formatDate } from '../utils/formatters'

export default function Documents() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [selectedDocDetails, setSelectedDocDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [errorBanner, setErrorBanner] = useState(null)
  const [generateDocId, setGenerateDocId] = useState(null)
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [createdQuiz, setCreatedQuiz] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    setErrorBanner(null)
    try {
      const data = await documentsService.listDocuments()
      setDocuments(Array.isArray(data) ? data : [])
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to fetch documents.'
      setErrorBanner(typeof msg === 'object' ? JSON.stringify(msg) : msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const handleDelete = async (docId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will remove the PDF and all extracted chunks.`)) {
      return
    }
    setActionLoadingId(docId)
    try {
      await documentsService.deleteDocument(docId)
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      if (selectedDocDetails?.id === docId) {
        setSelectedDocDetails(null)
      }
    } catch (err) {
      alert(err.response?.data?.detail || err.message || 'Failed to delete document.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRetry = async (docId) => {
    setActionLoadingId(docId)
    try {
      const res = await documentsService.retryProcessing(docId)
      if (res.document) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? res.document : d))
        )
      }
    } catch (err) {
      alert(err.response?.data?.detail || err.message || 'Retry processing failed.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleViewDetails = async (docId) => {
    if (selectedDocDetails?.id === docId) {
      setSelectedDocDetails(null)
      return
    }

    setDetailsLoading(true)
    try {
      const details = await documentsService.getDocument(docId)
      setSelectedDocDetails(details)
    } catch (err) {
      alert(err.response?.data?.detail || err.message || 'Failed to load document details.')
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleNewDocumentProcessed = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)])
  }

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      (doc.title && doc.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.original_filename && doc.original_filename.toLowerCase().includes(searchTerm.toLowerCase()))

    if (activeFilter === 'completed') return matchesSearch && doc.status === 'completed'
    if (activeFilter === 'failed') return matchesSearch && doc.status === 'failed'
    if (activeFilter === 'processing') return matchesSearch && doc.status === 'processing'
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Documents"
        description="Access and organize your uploaded textbooks, lecture notes, and extracted study chunks."
        badge={`${documents.length} Uploaded`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={loadDocuments}
              title="Refresh list"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowUploadModal(!showUploadModal)}
            >
              {showUploadModal ? 'Hide Upload Section' : 'Upload Document'}
            </Button>
          </div>
        }
      />

      {errorBanner && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold block mb-0.5">Database Notice:</strong>
            {errorBanner}
          </div>
        </div>
      )}

      {/* Upload Toggle Section */}
      {showUploadModal && (
        <div className="transition-all duration-200">
          <UploadCard onDocumentProcessed={handleNewDocumentProcessed} />
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents by title or filename..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <span className="text-xs text-slate-400 font-medium mr-1">Filter:</span>
          {['all', 'completed', 'processing', 'failed'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                activeFilter === filter
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-16">
          <LoadingSpinner size="lg" text="Loading study documents..." />
        </div>
      ) : filteredDocs.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon={FileText}
          title={searchTerm ? 'No matching documents found' : 'No documents uploaded yet'}
          description={
            searchTerm
              ? 'Try adjusting your search keywords or clearing your active filters.'
              : 'Upload your lecture notes or textbooks as PDFs. PyMuPDF will extract digital text page-by-page and synthesize study chunks for Phase 3 AI quiz generation.'
          }
          actionLabel={searchTerm ? 'Clear Search' : 'Upload First Document'}
          actionIcon={searchTerm ? RefreshCw : Upload}
          onAction={() => {
            if (searchTerm) {
              setSearchTerm('')
              setActiveFilter('all')
            } else {
              setShowUploadModal(true)
            }
          }}
          className="py-14"
        />
      ) : (
        /* Document Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => {
            const isDeleting = actionLoadingId === doc.id
            const isSelected = selectedDocDetails?.id === doc.id

            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-soft hover:shadow-soft-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top row: Status Badge + Actions */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {doc.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Ready ({doc.page_count}p, {doc.chunk_count} chunks)
                      </span>
                    )}
                    {doc.status === 'processing' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                        Extracting Text...
                      </span>
                    )}
                    {doc.status === 'failed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        Extraction Failed
                      </span>
                    )}
                    {doc.status === 'uploaded' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        Uploaded
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      {doc.status === 'failed' && (
                        <button
                          onClick={() => handleRetry(doc.id)}
                          disabled={isDeleting}
                          title="Retry text extraction"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(doc.id, doc.title)}
                        disabled={isDeleting}
                        title="Delete document"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title and Filename */}
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate" title={doc.title}>
                        {doc.title}
                      </h3>
                      <p className="text-xs text-slate-400 truncate mt-0.5" title={doc.original_filename}>
                        {doc.original_filename}
                      </p>
                    </div>
                  </div>

                  {/* Error detail if failed */}
                  {doc.status === 'failed' && doc.error_message && (
                    <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700 leading-relaxed">
                      {doc.error_message}
                    </div>
                  )}

                  {/* Metadata Chips */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>{formatBytes(doc.file_size)}</span>
                    <span>•</span>
                    <span>{formatDate(doc.created_at)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      {doc.chunk_count || 0} chunks
                    </span>
                  </div>
                </div>

                {/* Bottom action buttons */}
                <div className="mt-4 pt-2 space-y-2">
                  {doc.status === 'completed' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Sparkles}
                      className="w-full text-xs justify-center"
                      onClick={() => {
                        setGenerateDocId(doc.id)
                        setIsGenerateOpen(true)
                      }}
                    >
                      Generate Quiz from Document
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 justify-between"
                    onClick={() => handleViewDetails(doc.id)}
                  >
                    <span>{isSelected ? 'Hide Chunks & Preview' : 'Inspect Extracted Chunks'}</span>
                    {isSelected ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Expanded Details Section */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-slate-200 text-xs space-y-3">
                    {detailsLoading ? (
                      <LoadingSpinner size="sm" text="Loading chunks..." />
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-slate-500">
                          <span>
                            Total Pages: <strong>{selectedDocDetails.page_count}</strong>
                          </span>
                          {selectedDocDetails.download_url && (
                            <a
                              href={selectedDocDetails.download_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1"
                            >
                              <span>View Original PDF</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {selectedDocDetails.chunks && selectedDocDetails.chunks.length > 0 ? (
                          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                            {selectedDocDetails.chunks.slice(0, 3).map((chunk) => (
                              <div
                                key={chunk.id}
                                className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-700 leading-relaxed"
                              >
                                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-1">
                                  <span>Chunk #{chunk.chunk_index + 1}</span>
                                  {chunk.page_start && (
                                    <span>
                                      Page {chunk.page_start}
                                      {chunk.page_end && chunk.page_end !== chunk.page_start ? `–${chunk.page_end}` : ''}
                                    </span>
                                  )}
                                </div>
                                <p className="line-clamp-3">{chunk.content}</p>
                              </div>
                            ))}
                            {selectedDocDetails.chunks.length > 3 && (
                              <p className="text-[10px] text-slate-400 text-center italic">
                                + {selectedDocDetails.chunks.length - 3} more chunks stored for AI question generation
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-slate-400 text-[11px] italic">No chunks generated for this file.</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Generate Quiz Modal */}
      <GenerateQuizModal
        isOpen={isGenerateOpen}
        initialDocumentId={generateDocId}
        onClose={() => {
          setIsGenerateOpen(false)
          setGenerateDocId(null)
        }}
        onQuizGenerated={(newQuiz) => {
          setCreatedQuiz(newQuiz)
          setIsDetailOpen(true)
        }}
      />

      {/* Quiz Detail Preview Modal */}
      <QuizDetailModal
        quiz={createdQuiz}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  )
}
