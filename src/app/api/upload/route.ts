import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, WEBP allowed.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: 'Cloudinary environment variables are not configured on this server.' },
        { status: 500 }
      )
    }

    try {
      const cloudinaryUrl = await uploadToCloudinary(buffer, 'propx')
      return NextResponse.json({
        url: cloudinaryUrl,
        storage: 'cloudinary' as const,
      })
    } catch (cloudinaryError: any) {
      console.error('Cloudinary upload failed:', cloudinaryError?.message || cloudinaryError)
      return NextResponse.json(
        { error: `Cloudinary upload failed: ${cloudinaryError?.message || 'Unknown error'}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
