import { useState, useRef } from 'react'
import {
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  Info,
  Sparkles,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import Button from './Button'
import { formatBytes } from '../utils/formatters'
import { supabase } from '../services/supabase'
import { documentsService } from '../services/api'
import { useAuth } from '../context/AuthContext'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export default function UploadCard({ onDocumentProcessed, className = '' }) {
  const { user } = useAuth()
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState(null)
  const [successInfo, setSuccessInfo] = useState(null)
  const [uploadState, setUploadState] = useState('idle') // 'idle' | 'uploading' | 'processing' | 'success' | 'failed'
  const [progressPercent, setProgressPercent] = useState(0)
  const fileInputRef = useRef(null)

  const validateAndSetFile = (file) => {
    setError(null)
    setSuccessInfo(null)
    setUploadState('idle')
    setProgressPercent(0)

    if (!file) return

    // Validate PDF type
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf')

    if (!isPdf) {
      setError('Invalid file type. Please select a valid PDF document.')
      return
    }

    // Validate size (10 MB maximum)
    if (file.size > MAX_FILE_SIZE) {
      setError(
        `File exceeds maximum limit of 10 MB (Selected: ${formatBytes(
          file.size
        )}). Please select a smaller PDF.`
      )
      return
    }

    setSelectedFile(file)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setError(null)
    setSuccessInfo(null)
    setUploadState('idle')
    setProgressPercent(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerBrowse = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleUploadAndProcess = async () => {
    if (!selectedFile || !user) return

    setError(null)
    setSuccessInfo(null)
    setUploadState('uploading')
    setProgressPercent(20)

    try {
      // Step 1: Upload to private Supabase Storage bucket 'study-documents'
      const cleanFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const storagePath = `${user.id}/${Date.now()}-${cleanFileName}`

      setProgressPercent(45)

      const { data: storageData, error: storageError } = await supabase.storage
        .from('study-documents')
        .upload(storagePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (storageError) {
        throw new Error(
          `Storage upload failed: ${storageError.message || 'Check storage permissions'}`
        )
      }

      setProgressPercent(70)
      setUploadState('processing')

      // Step 2: Request backend to extract text with PyMuPDF and generate chunks
      const processPayload = {
        title: selectedFile.name.replace(/\.pdf$/i, ''),
        original_filename: selectedFile.name,
        storage_path: storagePath,
        file_size: selectedFile.size,
        mime_type: selectedFile.type || 'application/pdf',
      }

      const processedDoc = await documentsService.processDocument(processPayload)

      setProgressPercent(100)
      setUploadState('success')
      setSuccessInfo({
        pageCount: processedDoc.page_count,
        chunkCount: processedDoc.chunk_count,
        title: processedDoc.title,
      })

      if (onDocumentProcessed) {
        onDocumentProcessed(processedDoc)
      }
    } catch (err) {
      setUploadState('failed')
      let msg = err.response?.data?.detail || err.message || 'Document processing failed.'
      if (typeof msg === 'object') {
        msg = JSON.stringify(msg)
      }
      setError(msg)
    }
  }

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-6 shadow-soft transition-all duration-200 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-600" />
            Upload Study Document
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload your lecture notes or textbooks as PDFs (max 10 MB) for PyMuPDF text extraction.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          PyMuPDF & Supabase Active
        </span>
      </div>

      {/* Drag & Drop Zone */}
      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={triggerBrowse}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-200 flex flex-col items-center justify-center ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <UploadCloud className="w-7 h-7" />
          </div>

          <p className="text-sm font-medium text-slate-800">
            Drag and drop your PDF here, or{' '}
            <span className="text-indigo-600 hover:text-indigo-700 font-semibold underline underline-offset-2">
              browse files
            </span>
          </p>
          <p className="text-xs text-slate-400 mt-1.5">
            Accepts PDF documents up to 10 MB.
          </p>
        </div>
      ) : (
        /* Selected File Preview & Progress */
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-medium text-slate-900 truncate">
                  {selectedFile.name}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span>{formatBytes(selectedFile.size)}</span>
                  <span>•</span>
                  <span>PDF Document</span>
                  {uploadState === 'success' && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center text-emerald-600 font-medium gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Extracted
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {uploadState !== 'uploading' && uploadState !== 'processing' && (
              <button
                onClick={handleRemoveFile}
                title="Remove document"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Progress / Status indicator */}
          {(uploadState === 'uploading' || uploadState === 'processing') && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  {uploadState === 'uploading'
                    ? 'Uploading to private Supabase storage...'
                    : 'Extracting text and chunking with PyMuPDF...'}
                </span>
                <span className="font-medium text-indigo-600">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Success summary */}
          {uploadState === 'success' && successInfo && (
            <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Successfully processed <strong>{successInfo.pageCount} pages</strong> into{' '}
                  <strong>{successInfo.chunkCount} study chunks</strong>!
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveFile}
                className="text-xs bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100"
              >
                Upload Another
              </Button>
            </div>
          )}

          {/* Action Footer */}
          {uploadState !== 'success' && (
            <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                Private encrypted storage in Supabase bucket.
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={triggerBrowse}
                  disabled={uploadState === 'uploading' || uploadState === 'processing'}
                >
                  Change File
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Sparkles}
                  isLoading={uploadState === 'uploading' || uploadState === 'processing'}
                  onClick={handleUploadAndProcess}
                >
                  {uploadState === 'failed' ? 'Retry Process' : 'Upload & Extract'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mt-3 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="leading-relaxed">
            <strong className="font-semibold block mb-0.5">Extraction Notice:</strong>
            {error}
          </div>
        </div>
      )}
    </div>
  )
}
