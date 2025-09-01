"use client"

import { useState, useRef } from "react"
import { Plus, X } from "lucide-react"
import { ImageCropDialog } from "~/components/image-crop-dialog"
import { toast } from "sonner"

interface ImageUploadProps {
  currentImage?: string
  onImageChange: (base64Data: string | undefined) => void
  disabled?: boolean
  accept?: string
  maxSizeMB?: number
  placeholder?: string
  className?: string
}

export function ImageUpload({
  currentImage,
  onImageChange,
  disabled = false,
  accept = "image/*",
  maxSizeMB = 5,
  placeholder = "Add image",
  className
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null)
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false)
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file")
      return
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Image must be smaller than ${maxSizeMB}MB`)
      return
    }

    // Convert file to data URL for cropping
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setSelectedImageForCrop(result)
      setIsCropDialogOpen(true)
    }
    reader.readAsDataURL(file)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    // Convert blob to base64
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      const base64Data = base64.split(',')[1] // Remove data:image/...;base64, prefix
      
      // Set preview
      setPreviewUrl(base64)
      
      // Pass base64 data to parent
      onImageChange(base64Data)
    }
    reader.readAsDataURL(croppedBlob)
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    onImageChange(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {previewUrl ? (
        <div className="relative">
          <div className="w-full h-32 bg-muted rounded-lg overflow-hidden border border-border">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Replace button */}
          <button
            onClick={handleClick}
            disabled={disabled}
            className="absolute -bottom-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 border-2 border-background shadow-sm"
          >
            <Plus className="w-3 h-3" />
          </button>
          {/* Remove button */}
          <button
            onClick={handleRemoveImage}
            disabled={disabled}
            className="absolute -bottom-2 -left-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors disabled:opacity-50 border-2 border-background shadow-sm"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className={`relative w-full h-32 bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center transition-colors ${
            !disabled ? 'hover:bg-muted/80 cursor-pointer' : 'cursor-not-allowed opacity-50'
          }`}
        >
          <Plus className="w-8 h-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        </div>
      )}

      {/* Image Crop Dialog */}
      {selectedImageForCrop && (
        <ImageCropDialog
          open={isCropDialogOpen}
          onOpenChange={setIsCropDialogOpen}
          imageSrc={selectedImageForCrop}
          onCropComplete={handleCropComplete}
          title="Crop Image"
        />
      )}
    </div>
  )
}