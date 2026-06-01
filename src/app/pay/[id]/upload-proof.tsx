'use client'

import { useState } from 'react'
import { uploadPaymentProof } from '@/lib/actions/payment-proof'

interface UploadProofProps {
    paymentId: string
    onUploaded?: () => void
}

export function UploadProof({ paymentId, onUploaded }: UploadProofProps) {
    const [file, setFile] = useState<File | null>(null)
    const [utrNumber, setUtrNumber] = useState('')
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0]
        if (selected) {
            // Validate file size (max 5MB)
            if (selected.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB')
                return
            }

            // Validate file type
            if (!selected.type.startsWith('image/')) {
                setError('Please upload an image file')
                return
            }

            setFile(selected)
            setError(null)

            // Create preview
            const reader = new FileReader()
            reader.onload = (ev) => {
                setPreview(ev.target?.result as string)
            }
            reader.readAsDataURL(selected)
        }
    }

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a screenshot')
            return
        }

        setUploading(true)
        setError(null)

        try {
            // Upload to /api/upload first
            const formData = new FormData()
            formData.append('file', file)

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            if (!uploadRes.ok) {
                // Fallback: use data URL if upload API doesn't exist
                const reader = new FileReader()
                const dataUrl = await new Promise<string>((resolve) => {
                    reader.onload = (e) => resolve(e.target?.result as string)
                    reader.readAsDataURL(file)
                })

                const result = await uploadPaymentProof(paymentId, {
                    screenshotUrl: dataUrl,
                    uploadedBy: 'tenant',
                    upiTransactionId: utrNumber || undefined,
                })

                if (result.error) {
                    setError(result.error)
                } else {
                    setSuccess(true)
                    onUploaded?.()
                }
            } else {
                const uploadData = await uploadRes.json()
                const screenshotUrl = uploadData.url || uploadData.path

                const result = await uploadPaymentProof(paymentId, {
                    screenshotUrl,
                    uploadedBy: 'tenant',
                    upiTransactionId: utrNumber || undefined,
                })

                if (result.error) {
                    setError(result.error)
                } else {
                    setSuccess(true)
                    onUploaded?.()
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to upload. Please try again.')
        } finally {
            setUploading(false)
        }
    }

    if (success) {
        return (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-emerald-400 font-medium">Payment proof submitted!</p>
                <p className="text-emerald-400/70 text-sm mt-1">
                    Owner will verify your payment shortly.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <p className="text-gray-300 text-sm font-medium">Upload Payment Screenshot</p>

            {/* File Input */}
            <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-gray-700 rounded-xl p-4 text-center hover:border-gray-600 transition-colors">
                    {preview ? (
                        <div className="space-y-2">
                            <img
                                src={preview}
                                alt="Payment screenshot"
                                className="max-h-40 mx-auto rounded-lg"
                            />
                            <p className="text-gray-400 text-xs">Tap to change</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="text-3xl">📸</div>
                            <p className="text-gray-400 text-sm">Tap to upload screenshot</p>
                            <p className="text-gray-500 text-xs">JPG, PNG • Max 5MB</p>
                        </div>
                    )}
                </div>
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </label>

            {/* UTR Number */}
            <div>
                <label className="block text-gray-400 text-xs mb-1">
                    UPI Transaction ID / UTR Number (optional)
                </label>
                <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="e.g. 412345678901"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
            </div>

            {/* Error */}
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Upload Button */}
            <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
                {uploading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Uploading...
                    </>
                ) : (
                    <>📤 Submit Payment Proof</>
                )}
            </button>
        </div>
    )
}
