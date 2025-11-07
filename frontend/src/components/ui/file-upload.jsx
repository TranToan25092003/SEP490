import React, { useState, useRef, useCallback } from "react"
import {
  X,
  RotateCcw,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  Music,
  Video,
  ImageIcon,
  Grid3x3,
  List,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect } from "react"
import { Trash } from "lucide-react"

/**
 * @typedef {Object} FileUploadComponentProps
 * @template T
 * @property {string[] | 'any'} acceptedMimeTypes - MIME types to accept or 'any' for all files
 * @property {number} [maxSizePerFileKB=10240] - Maximum file size in kilobytes
 * @property {number} [maxFilesCount=10] - Maximum number of files allowed
 * @property {(data: T[]) => void} onFilesChange - Callback when uploaded files change
 * @property {(data: T[]) => void} onToBeRemovedChange - Callback when files are marked for deletion
 * @property {(data: T) => import("react").ReactNode} renderInitial - Callback to render initial uploaded files
 * @property {T[]} [initial] - Initial uploaded files state
 * @property {(file: File, updateProgress: (progress: number) => void, abortController: AbortController) => Promise<T>} onFileAdded - Callback when a file is added, should return upload result
 */

/**
 * @typedef {Object} UploadedFile
 * @template T
 * @property {string} id - Unique file identifier
 * @property {File} file - The File object
 * @property {number} progress - Upload progress (0-100)
 * @property {'pending' | 'uploading' | 'completed' | 'error' | 'cancelled'} status - Current upload status
 * @property {string} [error] - Error message if upload failed
 * @property {T} [data] - Upload result data
 * @property {AbortController} abortController - Abort controller for cancellation
 */

const translations = {
  clickToUpload: "Nhấp để tải lên hoặc kéo và thả",
  maxFileInfo: "Tối đa {maxSize}KB mỗi tệp, tối đa {maxFiles} tệp",
  maximumReached: "Đã đạt tối đa tệp",
  maximumReachedInfo: "Bạn đã đạt tối đa {maxFiles} tệp",
  uploads: "Tải lên",
  supportedFormats: "Định dạng được hỗ trợ",
  previousFiles: "Những tệp đã tải lên trước đó",
  pending: "Đang chờ",
  uploading: "Đang tải lên",
  completed: "Hoàn thành",
  error: "Lỗi",
  cancelled: "Đã hủy",
  retryAll: "Thử lại tất cả",
  noFailedUploads: "Không có tải lên nào thất bại",
  invalidFileType: "Nội dung tải lên không hợp lệ",
  fileSizeTooLarge: "Kích thước tệp quá lớn",
  maxFilesReached: "Đã đạt tối đa số lượng tệp",
  acceptedFormats: "Định dạng được chấp nhận",
  genericError: "Lỗi",
  fileSize: "Kích thước tệp",
  filesAllowed: "tệp được phép",
  dismiss: "Đóng",
}

/**
 * Get the appropriate icon for a MIME type
 * @param {string} mimeType - The MIME type
 * @returns {React.ReactElement} The icon component
 */
function getFileTypeIcon(mimeType) {
  if (mimeType.startsWith("image/")) return <ImageIcon className="w-4 h-4" />
  if (mimeType.startsWith("audio/")) return <Music className="w-4 h-4" />
  if (mimeType.startsWith("video/")) return <Video className="w-4 h-4" />
  if (mimeType.includes("pdf")) return <FileText className="w-4 h-4" />
  if (mimeType.includes("word") || mimeType.includes("document")) return <FileText className="w-4 h-4" />
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return <FileText className="w-4 h-4" />
  return <FileText className="w-4 h-4" />
}

/**
 * Get a human-readable label for a MIME type
 * @param {string} mimeType - The MIME type
 * @returns {string} Human-readable label
 */
function getMimeTypeLabel(mimeType) {
  if (mimeType === "any") return "Tất cả tệp"
  if (mimeType.endsWith("/*")) {
    const type = mimeType.split("/")[0]
    let suffix = type.charAt(0).toUpperCase() + type.slice(1)
    if (type === "image") {
      suffix = " ảnh"
    }
    return "Tệp " + suffix
  }
  const labels = {
    "application/pdf": "PDF",
    "image/jpeg": "JPEG",
    "image/png": "PNG",
    "image/gif": "GIF",
    "image/webp": "WebP",
    "audio/mpeg": "MP3",
    "audio/wav": "WAV",
    "video/mp4": "MP4",
    "video/webm": "WebM",
    "application/msword": "Word",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
    "application/vnd.ms-excel": "Excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
  }
  return labels[mimeType] || mimeType
}

/**
 * FileUpload Component - A comprehensive multi-file upload component with progress tracking
 * @template T
 * @param {FileUploadComponentProps<T>} props - Component props
 * @returns {React.ReactElement} The file upload component
 */
export function FileUpload({
  acceptedMimeTypes,
  maxSizePerFileKB = 10240,
  maxFilesCount = 10,
  onFilesChange,
  onToBeRemovedChange,
  onFileAdded,
  renderInitial,
  init = [],
}) {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [initialState, setInitialState] = useState(init.map((state) => {
    return {
      data: state,
      toBeDeleted: false,
    }
  }));
  const [validationError, setValidationError] = useState(null)
  const [layout, setLayout] = useState("list")
  const [isExpanded, setIsExpanded] = useState(true)
  const fileInputRef = useRef(null)
  const dragOverRef = useRef(false)

  const t = translations

  useEffect(() => {
    setInitialState(init.map((state) => ({
      data: state,
      toBeDeleted: false,
    })));
  }, [init]);

  /**
   * Validate a file against MIME type and size constraints
   * @param {File} file - The file to validate
   * @returns {{valid: boolean, code?: 'type' | 'size', message?: string}}
   */
  const validateFile = useCallback(
    (file) => {
      // Check MIME type
      if (acceptedMimeTypes !== "any") {
        const isAccepted = acceptedMimeTypes.some((mimeType) => {
          if (mimeType.endsWith("/*")) {
            const [type] = mimeType.split("/")
            return file.type.startsWith(type)
          }
          return file.type === mimeType
        })

        if (!isAccepted) {
          return {
            valid: false,
            code: "type",
            message: `${file.name}`,
          }
        }
      }

      // Check file size
      const fileSizeKB = file.size / 1024
      if (fileSizeKB > maxSizePerFileKB) {
        return {
          valid: false,
          code: "size",
          message: `${file.name} (${Math.round(fileSizeKB)}KB)`,
        }
      }

      return { valid: true }
    },
    [acceptedMimeTypes, maxSizePerFileKB],
  )

  /**
   * Handle file upload using the onFileAdded callback
   * @param {File} file - The file to upload
   * @param {string} fileId - Unique identifier for this file
   * @returns {Promise<void>}
   */
  const handleFileUpload = useCallback(
    async (file, fileId) => {
      const abortController = new AbortController()

      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: "uploading", abortController } : f)),
      )

      try {
        const data = await onFileAdded(
          file,
          (progress) => {
            setUploadedFiles((prev) =>
              prev.map((f) => (f.id === fileId ? { ...f, progress: Math.min(progress, 100) } : f)),
            )
          },
          abortController,
        )

        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, status: "completed", progress: 100, data } : f)),
        )
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Upload failed"

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: "error",
                  error: errorMessage,
                }
              : f,
          ),
        )
      }
    },
    [onFileAdded],
  )

  /**
   * Handle files selected via input or drag-drop
   * @param {FileList | null} files - The selected files
   */
  const handleFilesSelected = useCallback(
    (files) => {
      if (!files) return

      const newFiles = []
      const errorsByType = { type: [], size: [], count: false }

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const validation = validateFile(file)

        if (!validation.valid) {
          if (validation.code === "type") {
            errorsByType.type.push(validation.message)
          } else if (validation.code === "size") {
            errorsByType.size.push(validation.message)
          }
          continue
        }

        const totalFiles = uploadedFiles.length + newFiles.length
        if (totalFiles >= maxFilesCount) {
          errorsByType.count = true
          break
        }

        const fileId = `${Date.now()}-${Math.random()}`
        const uploadedFile = {
          id: fileId,
          file,
          progress: 0,
          status: "pending",
          abortController: new AbortController(),
        }

        newFiles.push(uploadedFile)
      }

      if (errorsByType.type.length > 0 || errorsByType.size.length > 0 || errorsByType.count) {
        setValidationError(errorsByType)
        setTimeout(() => setValidationError(null), 5000)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        return
      }

      setUploadedFiles((prev) => [...prev, ...newFiles])

      // Start uploading new files
      newFiles.forEach((uploadedFile) => {
        handleFileUpload(uploadedFile.file, uploadedFile.id)
      })

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [uploadedFiles.length, maxFilesCount, validateFile, handleFileUpload],
  )

  /**
   * Remove a file from the list
   * @param {string} fileId - The file ID to remove
   */
  const handleRemoveFile = useCallback((fileId) => {
    setUploadedFiles((prev) => {
      const updated = prev.filter((f) => f.id !== fileId)
      return updated
    })
  }, [])

  /**
   * Cancel an ongoing upload
   * @param {string} fileId - The file ID to cancel
   */
  const handleCancelUpload = useCallback(
    (fileId) => {
      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: "cancelled", abortController: new AbortController() } : f)),
      )

      // Abort the upload
      const file = uploadedFiles.find((f) => f.id === fileId)
      if (file) {
        file.abortController.abort()
      }
    },
    [uploadedFiles],
  )

  /**
   * Retry uploading a failed file
   * @param {string} fileId - The file ID to retry
   */
  const handleRetry = useCallback(
    (fileId) => {
      const file = uploadedFiles.find((f) => f.id === fileId)
      if (file) {
        handleFileUpload(file.file, fileId)
      }
    },
    [uploadedFiles, handleFileUpload],
  )

  /**
   * Retry all failed uploads
   */
  const handleRetryAll = useCallback(() => {
    const failedFiles = uploadedFiles.filter((f) => f.status === "error")
    failedFiles.forEach((file) => {
      handleFileUpload(file.file, file.id)
    })
  }, [uploadedFiles, handleFileUpload])

  // Update parent component when files change
  React.useEffect(() => {
    const completedFiles = uploadedFiles.filter((f) => f.status === "completed" && f.data).map((f) => f.data)
    const updatedInitial = initialState.filter((f) => !f.toBeDeleted).map((f) => f.data)
    typeof onFilesChange === "function" && onFilesChange([...completedFiles, ...updatedInitial])
    typeof onToBeRemovedChange === "function" && onToBeRemovedChange(initialState.filter((f) => f.toBeDeleted).map((f) => f.data))
  }, [uploadedFiles, onFilesChange, initialState, onToBeRemovedChange])

  const acceptString = acceptedMimeTypes === "any" ? "" : acceptedMimeTypes.join(",")
  const canAddMore = uploadedFiles.length < maxFilesCount
  const failedUploads = uploadedFiles.filter((f) => f.status === "error")

  return (
    <div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        .shake-animation {
          animation: shake 0.6s ease-in-out;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .error-overlay {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>

      {initialState.length > 0 && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {t.previousFiles}
          </p>
          <div className="flex flex-wrap gap-2">
            {initialState.map((fileWrapper, index) => (
              <div key={index} className={cn("p-1 relative")}>
                {fileWrapper.toBeDeleted ? (
                  <RotateCcw
                    className="size-6 p-1 z-10 absolute top-0 left-full transform -translate-x-2/3 -translate-y-1/4 bg-white rounded-full border cursor-pointer"
                    onClick={() => {
                      const updated = [...initialState];
                      updated[index].toBeDeleted = false;
                      setInitialState(updated);
                    }}
                  />
                ) : (
                  <Trash
                    className="size-6 p-1 absolute z-10 top-0 left-full transform -translate-x-2/3 -translate-y-1/4 bg-white rounded-full border cursor-pointer"
                    onClick={() => {
                      const updated = [...initialState];
                      updated[index].toBeDeleted = true;
                      setInitialState(updated);
                    }}
                  />
                )}
                <div
                  className={cn(
                    "relative",
                    fileWrapper.toBeDeleted && "opacity-50"
                  )}
                >
                  {typeof renderInitial === "function" ? (
                    renderInitial(fileWrapper.data)
                  ) : (
                    <span>{String(fileWrapper.data)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-all duration-300",
          validationError && "shake-animation",
          canAddMore
            ? "border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/50 hover:bg-muted/75 cursor-pointer"
            : "border-muted-foreground/10 bg-muted/25 cursor-not-allowed opacity-50"
        )}
        onDragOver={(e) => {
          if (!canAddMore) return;
          e.preventDefault();
          dragOverRef.current = true;
        }}
        onDragLeave={() => {
          dragOverRef.current = false;
        }}
        onDrop={(e) => {
          if (!canAddMore) return;
          e.preventDefault();
          dragOverRef.current = false;
          handleFilesSelected(e.dataTransfer.files);
        }}
        onClick={() => canAddMore && fileInputRef.current?.click()}
      >
        {validationError && (
          <div className="absolute inset-0 bg-red-500/20 rounded-lg pointer-events-none flex items-center justify-center error-overlay">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 w-4/5 mx-2">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-900 mb-3">
                    {t.genericError}
                  </h3>
                  <div className="space-y-2 text-sm text-red-800">
                    {validationError.type.length > 0 && (
                      <div>
                        <p className="font-medium flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4" />
                          {t.invalidFileType}
                        </p>
                        <ul className="space-y-1">
                          {validationError.type.map((fileName, i) => (
                            <li key={i}>{fileName}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {validationError.size.length > 0 && (
                      <div>
                        <p className="font-medium flex items-center gap-2 mb-2">
                          {t.fileSizeTooLarge}
                        </p>
                        <ul className="space-y-1">
                          {validationError.size.map((fileInfo, i) => (
                            <li key={i}>{fileInfo}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {validationError.count && (
                      <div className="flex items-center gap-2">
                        <span>
                          {t.maxFilesReached}: {maxFilesCount} {t.filesAllowed}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptString}
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
          disabled={!canAddMore}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <Upload className="w-8 h-8 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium text-foreground">
              {canAddMore ? t.clickToUpload : t.maximumReached}
            </p>
            <p className="text-sm text-muted-foreground">
              {canAddMore
                ? t.maxFileInfo
                    .replace("{maxSize}", maxSizePerFileKB.toString())
                    .replace("{maxFiles}", maxFilesCount.toString())
                : t.maximumReachedInfo.replace(
                    "{maxFiles}",
                    maxFilesCount.toString()
                  )}
            </p>
          </div>
        </div>
      </div>

      {acceptedMimeTypes !== "any" && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {t.supportedFormats}
          </p>
          <div className="flex flex-wrap gap-2">
            {acceptedMimeTypes.map((mimeType) => (
              <div
                key={mimeType}
                className="flex items-center gap-1.5 px-2 py-1 bg-background rounded border border-border text-xs"
              >
                {getFileTypeIcon(mimeType)}
                <span>{getMimeTypeLabel(mimeType)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <h3 className="text-sm font-medium text-foreground">
                {t.uploads} ({uploadedFiles.length}/{maxFilesCount})
              </h3>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-muted rounded-md transition-colors"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLayout("list")}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    layout === "list"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setLayout("grid")}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    layout === "grid"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                  title="Grid view"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
              </div>
              {failedUploads.length > 0 && (
                <button
                  type="button"
                  onClick={handleRetryAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t.retryAll}
                </button>
              )}
            </div>
          </div>

          {isExpanded && (
            <div
              className={
                layout === "grid"
                  ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
                  : "space-y-2"
              }
            >
              {uploadedFiles.map((uploadedFile) => (
                <FileUploadItem
                  key={uploadedFile.id}
                  file={uploadedFile}
                  onRemove={() => handleRemoveFile(uploadedFile.id)}
                  onCancel={() => handleCancelUpload(uploadedFile.id)}
                  onRetry={() => handleRetry(uploadedFile.id)}
                  layout={layout}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * @typedef {Object} FileUploadItemProps
 * @template T
 * @property {UploadedFile<T>} file - The file object to display
 * @property {() => void} onRemove - Callback when file is removed
 * @property {() => void} onCancel - Callback when upload is cancelled
 * @property {() => void} onRetry - Callback when upload is retried
 * @property {'list' | 'grid'} layout - Layout type to display file in
 */

/**
 * Individual file upload item component
 * @template T
 * @param {FileUploadItemProps<T>} props - Component props
 * @returns {React.ReactElement}
 */
function FileUploadItem({ file, onRemove, onCancel, onRetry, layout = "list" }) {
  const [imagePreview, setImagePreview] = React.useState(null)
  const t = translations

  React.useEffect(() => {
    if (file.file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result)
      }
      reader.readAsDataURL(file.file)
    }
  }, [file.file])

  /**
   * Get the appropriate status icon
   * @returns {React.ReactElement}
   */
  const getStatusIcon = () => {
    switch (file.status) {
      case "uploading":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "error":
      case "cancelled":
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Upload className="w-5 h-5 text-muted-foreground" />
    }
  }

  /**
   * Get the status text to display
   * @returns {string}
   */
  const getStatusText = () => {
    switch (file.status) {
      case "pending":
        return t.pending
      case "uploading":
        return `${t.uploading}... ${file.progress.toFixed(2)}%`
      case "completed":
        return t.completed
      case "error":
        return `${t.error}: ${file.error}`
      case "cancelled":
        return t.cancelled
      default:
        return ""
    }
  }

  if (layout === "grid") {
    return (
      <div className="flex flex-col bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors">
        {imagePreview ? (
          <div className="relative w-full aspect-square bg-muted overflow-hidden">
            <img src={imagePreview || "/placeholder.svg"} alt={file.file.name} className="w-full h-full object-cover" />
            {file.status === "uploading" && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="16" fill="none" stroke="white" strokeWidth="2" className="opacity-30" />
                  <circle
                    cx="24"
                    cy="24"
                    r="16"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeDasharray={`${2 * Math.PI * 16}`}
                    strokeDashoffset={`${2 * Math.PI * 16 * (1 - file.progress / 100)}`}
                    className="transition-all duration-300"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full aspect-square bg-muted flex items-center justify-center">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-muted-foreground/30"
              />
              {file.status === "uploading" && (
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - file.progress / 100)}`}
                  className="text-primary transition-all duration-300"
                  strokeLinecap="round"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">{getStatusIcon()}</div>
          </div>
        )}
        <div className="p-3 flex flex-col flex-1">
          <p className="text-xs font-medium text-foreground truncate mb-1">{file.file.name}</p>
          <p className="text-xs text-muted-foreground mb-3 flex-1">{(file.file.size / 1024).toFixed(2)}KB</p>
          <p className="text-xs text-muted-foreground mb-3">{getStatusText()}</p>
          <div className="flex items-center justify-center gap-2">
            {file.status === "uploading" && (
              <button
                type="button"
                onClick={onCancel}
                className="p-1.5 hover:bg-muted rounded-md transition-colors"
                title="Cancel upload"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}

            {file.status === "error" && (
              <button
                type="button"
                onClick={onRetry}
                className="p-1.5 hover:bg-muted rounded-md transition-colors"
                title="Retry upload"
              >
                <RotateCcw className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}

            {(file.status === "completed" || file.status === "error" || file.status === "cancelled") && (
              <button
                type="button"
                onClick={onRemove}
                className="p-1.5 hover:bg-muted rounded-md transition-colors"
                title="Remove file"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
      {imagePreview ? (
        <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-muted">
          <img src={imagePreview || "/placeholder.svg"} alt={file.file.name} className="w-full h-full object-cover" />
          {file.status === "uploading" && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="16" fill="none" stroke="white" strokeWidth="2" className="opacity-30" />
                <circle
                  cx="24"
                  cy="24"
                  r="16"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 16}`}
                  strokeDashoffset={`${2 * Math.PI * 16 * (1 - file.progress / 100)}`}
                  className="transition-all duration-300"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-12 h-12 flex-shrink-0">
          <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted" />
            {file.status === "uploading" && (
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - file.progress / 100)}`}
                className="text-primary transition-all duration-300"
                strokeLinecap="round"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">{getStatusIcon()}</div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{file.file.name}</p>
        <p className="text-xs text-muted-foreground">
          {(file.file.size / 1024).toFixed(2)}KB • {getStatusText()}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {file.status === "uploading" && (
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
            title="Cancel upload"
          >
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}

        {file.status === "error" && (
          <button onClick={onRetry} className="p-1.5 hover:bg-muted rounded-md transition-colors" title="Retry upload">
            <RotateCcw className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}

        {(file.status === "completed" || file.status === "error" || file.status === "cancelled") && (
          <button onClick={onRemove} className="p-1.5 hover:bg-muted rounded-md transition-colors" title="Remove file">
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
    </div>
  )
}
