"use client"

import { useState, useRef } from "react"
import { UploadCloud, X, Loader2, ImagePlus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageUploadClientProps {
    images: string[]
    onChange: (images: string[]) => void
    maxImages?: number
}

export function ImageUploadClient({ images, onChange, maxImages = 5 }: ImageUploadClientProps) {
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        if (images.length + files.length > maxImages) {
            setError(`You can only upload up to ${maxImages} images.`)
            return
        }

        setUploading(true)
        setError("")

        const newUrls: string[] = []

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                if (file.size > 5 * 1024 * 1024) {
                    throw new Error(`File ${file.name} is too large. Max 5MB.`)
                }

                const formData = new FormData()
                formData.append("file", file)

                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                })

                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error || "Upload failed")
                }

                const data = await res.json()
                newUrls.push(data.url)
            }

            onChange([...images, ...newUrls])
        } catch (err: any) {
            console.error("Upload error:", err)
            setError(err.message || "An error occurred during upload")
        } finally {
            setUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    const removeImage = (index: number) => {
        const newImages = [...images]
        newImages.splice(index, 1)
        onChange(newImages)
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
                {images.map((url, i) => (
                    <div key={i} className="relative group w-24 h-24 rounded-lg overflow-hidden border bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-1 right-1 bg-red-500/90 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}

                {images.length < maxImages && (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-24 h-24 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <ImagePlus className="w-6 h-6 mb-1" />
                                <span className="text-[10px] font-medium">Add Photo</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                multiple
                onChange={handleUpload}
            />

            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            
            <p className="text-[10px] text-slate-500">
                {images.length} / {maxImages} images uploaded. JPG, PNG, WEBP up to 5MB.
            </p>
        </div>
    )
}
