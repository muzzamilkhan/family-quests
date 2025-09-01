"use client"

import { useState, useRef } from "react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { ProfileAvatar } from "~/components/profile-avatar"
import { ImageCropDialog } from "~/components/image-crop-dialog"
import { Edit, Plus, Save, X } from "lucide-react"
import { api } from "~/lib/trpc-provider"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

interface EditableProfileProps {
  user: {
    id: string
    name: string | null
    image: string | null
    role: "PARENT" | "CHILD"
    points?: number
  }
  canEdit: boolean
  onUpdate?: () => void
}

export function EditableProfile({ user, canEdit, onUpdate }: EditableProfileProps) {
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [editingName, setEditingName] = useState(user.name || "")
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false)
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const utils = api.useUtils()

  const updateNameMutation = api.user.updateUserName.useMutation({
    onSuccess: () => {
      toast.success("Name updated successfully!")
      setIsEditing(false)
      onUpdate?.()
      void utils.family.getMyFamily.invalidate()
      void utils.family.getChildren.invalidate()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const uploadImageMutation = api.user.uploadProfileImage.useMutation({
    onSuccess: () => {
      toast.success("Profile picture updated successfully!")
      setIsUploadingImage(false)
      onUpdate?.()
      void utils.family.getMyFamily.invalidate()
      void utils.family.getChildren.invalidate()
    },
    onError: (error) => {
      toast.error(error.message)
      setIsUploadingImage(false)
    },
  })

  const handleSaveName = async () => {
    if (!editingName.trim()) {
      toast.error("Name cannot be empty")
      return
    }
    
    await updateNameMutation.mutateAsync({
      userId: user.id,
      name: editingName.trim(),
    })
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB")
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
    setIsUploadingImage(true)

    try {
      // Convert blob to base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        const base64Data = base64.split(',')[1] // Remove data:image/...;base64, prefix
        
        await uploadImageMutation.mutateAsync({
          userId: user.id,
          filename: `profile-${user.id}-${Date.now()}.jpg`,
          contentType: 'image/jpeg',
          file: base64Data,
        })
      }
      reader.readAsDataURL(croppedBlob)
    } catch (error) {
      toast.error("Failed to upload image")
      setIsUploadingImage(false)
    }
  }

  const handleNameClick = () => {
    if (canEdit) {
      setEditingName(user.name || "")
      setIsEditing(true)
    }
  }

  const handleImageClick = () => {
    if (canEdit) {
      fileInputRef.current?.click()
    }
  }

  return (
    <>
      <div className="flex items-center space-x-4">
        {/* Profile Picture with + Button */}
        <div className="relative">
          <ProfileAvatar
            src={user.image ?? undefined}
            name={user.name || "User"}
            size="lg"
          />
          {canEdit && (
            <button
              onClick={handleImageClick}
              disabled={isUploadingImage}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 border-2 border-background shadow-sm"
            >
              {isUploadingImage ? (
                <div className="w-3 h-3 border border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-3 h-3" />
              )}
            </button>
          )}
        </div>

        {/* Name */}
        <div className="flex-1">
          <div 
            className={`flex items-center space-x-2 ${canEdit ? 'cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1' : ''}`}
            onClick={handleNameClick}
          >
            <h3 className="font-semibold text-lg">{user.name || "Unnamed User"}</h3>
            {canEdit && <Edit className="w-4 h-4 text-muted-foreground" />}
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="flex items-center space-x-1">
              {user.role === "PARENT" ? (
                <>
                  <span>Quest Master</span>
                </>
              ) : (
                <>
                  <span>{user.points || 0} points</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Name Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              placeholder="Enter name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveName()
                } else if (e.key === 'Escape') {
                  setIsEditing(false)
                }
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSaveName}
                disabled={updateNameMutation.isPending || !editingName.trim()}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateNameMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Crop Dialog */}
      {selectedImageForCrop && (
        <ImageCropDialog
          open={isCropDialogOpen}
          onOpenChange={setIsCropDialogOpen}
          imageSrc={selectedImageForCrop}
          onCropComplete={handleCropComplete}
          title="Crop Profile Picture"
        />
      )}
    </>
  )
}