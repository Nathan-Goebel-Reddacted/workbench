import { useState } from 'react'
import { failureMessage } from '../api/errors'
import { uploadFile } from '../api/uploads'

export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File): Promise<string | null> => {
    setUploading(true)
    setError(null)
    try {
      return await uploadFile(file)
    } catch (err) {
      setError(failureMessage(err, 'Upload failed.', 'Network error.'))
      return null
    } finally {
      setUploading(false)
    }
  }

  return { uploading, error, upload, reject: setError }
}
