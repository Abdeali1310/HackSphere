"use client"

import { useState, useEffect } from "react"
import { UserList } from "@/components/users/user-list"
import { UserProfile } from "@/components/users/user-profile"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"

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

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/users/profile")
      const data = await response.json()

      if (response.ok) {
        setCurrentUser(data.user)
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      const data = await response.json()

      if (response.ok) {
        setSelectedUser(data.user)
        toast({
          title: "Role updated",
          description: `User role has been changed to ${newRole}`,
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update role",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {selectedUser ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setSelectedUser(null)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
              </Button>
              <div>
                <h1 className="text-3xl font-bold">User Profile</h1>
                <p className="text-muted-foreground">View and manage user information</p>
              </div>
            </div>
            <UserProfile user={selectedUser} currentUserRole={currentUser?.role} onRoleChange={handleRoleChange} />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-muted-foreground">Browse and manage platform users</p>
            </div>
            <UserList currentUserRole={currentUser?.role} onUserSelect={setSelectedUser} />
          </div>
        )}
      </div>
    </div>
  )
}
