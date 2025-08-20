"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Mail, Calendar, Users, UserCheck, Gavel } from "lucide-react"

interface User {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
  bio?: string
  skills?: string[]
  createdAt: string
}

interface UserProfileProps {
  user: User
  currentUserRole?: string
  onEdit?: () => void
  onRoleChange?: (userId: string, newRole: string) => void
}

export function UserProfile({ user, currentUserRole, onEdit, onRoleChange }: UserProfileProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ORGANIZER":
        return <UserCheck className="h-4 w-4" />
      case "PARTICIPANT":
        return <Users className="h-4 w-4" />
      case "JUDGE":
        return <Gavel className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ORGANIZER":
        return "bg-primary text-primary-foreground"
      case "PARTICIPANT":
        return "bg-secondary text-secondary-foreground"
      case "JUDGE":
        return "bg-accent text-accent-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback className="text-lg">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`${getRoleColor(user.role)} flex items-center gap-1`}>
                  {getRoleIcon(user.role)}
                  {user.role}
                </Badge>
              </div>
            </div>
          </div>
          {onEdit && (
            <Button onClick={onEdit} variant="outline">
              Edit Profile
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contact Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{user.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <div>
            <h3 className="font-semibold mb-2">About</h3>
            <p className="text-muted-foreground">{user.bio}</p>
          </div>
        )}

        {/* Skills */}
        {user.skills && user.skills.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Admin Actions */}
        {currentUserRole === "ORGANIZER" && onRoleChange && (
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-3">Admin Actions</h3>
            <div className="flex gap-2">
              {["ORGANIZER", "PARTICIPANT", "JUDGE"].map((role) => (
                <Button
                  key={role}
                  variant={user.role === role ? "default" : "outline"}
                  size="sm"
                  onClick={() => onRoleChange(user.id, role)}
                  disabled={user.role === role}
                >
                  {role}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
