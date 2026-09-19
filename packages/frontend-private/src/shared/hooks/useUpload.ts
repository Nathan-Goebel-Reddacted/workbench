import { useState } from 'react'
import { HttpError } from '../api/http'
import { uploadFile } from '../api/uploads'

function uploadError(err: unknown): string {
  if (!(err instanceof HttpError)) return 'Network error.'
  return err.detail ?? 'Upload failed.'
}

export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File): Promise<string | null> => {
    setUploading(true)
    setError(null)
    try {
      return await uploadFile(file)
    } catch (err) {
      setError(uploadError(err))
      return null
    } finally {
      setUploading(false)
    }
  }

  return { uploading, error, upload, reject: setError }
}
