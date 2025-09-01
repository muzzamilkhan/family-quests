"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Crown, Sword } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProfileAvatarProps {
  user: {
    name: string
    image?: string
    role: "parent" | "child"
    points?: number
  }
  size?: "sm" | "md" | "lg"
  showRole?: boolean
  showPoints?: boolean
  className?: string
}

export function ProfileAvatar({
  user,
  size = "md",
  showRole = false,
  showPoints = false,
  className,
}: ProfileAvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }

  const getRoleIcon = () => {
    if (user.role === "parent") {
      return <Crown className="w-3 h-3 text-treasure" />
    }
    return <Sword className="w-3 h-3 text-quest" />
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative">
        <Avatar className={cn(sizeClasses[size], "border-2 border-border")}>
          <AvatarImage src={user.image || "/placeholder.svg"} alt={user.name} />
          <AvatarFallback className="bg-secondary font-heading font-semibold">{getInitials(user.name)}</AvatarFallback>
        </Avatar>

        {showRole && (
          <div className="absolute -bottom-1 -right-1 bg-background border border-border rounded-full p-1">
            {getRoleIcon()}
          </div>
        )}
      </div>

      <div className="text-center">
        <div className="font-heading font-medium text-sm text-balance">{user.name}</div>

        {showPoints && user.points !== undefined && (
          <Badge variant="secondary" className="text-xs mt-1">
            {user.points} pts
          </Badge>
        )}
      </div>
    </div>
  )
}
