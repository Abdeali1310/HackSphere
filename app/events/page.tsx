"use client"

import { useState, useEffect } from "react"
import { EventList } from "@/components/events/event-list"
import { EventForm } from "@/components/events/event-form"
import { EventDetails } from "@/components/events/event-details"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus } from "lucide-react"

interface User {
  id: string
  role: string
  name: string
}

interface Event {
  id: string
  title: string
  description: string
  theme: string
  startDate: string
  endDate: string
  status: string
  maxTeamSize: number
  minTeamSize: number
  banner?: string
  website?: string
  organizerId: string
}

export default function EventsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)

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

  const handleEventSuccess = () => {
    setShowCreateForm(false)
    setEditingEvent(null)
    // Refresh the event list by resetting selected event
    setSelectedEvent(null)
  }

  const handleEventEdit = (event: Event) => {
    setEditingEvent(event)
    setSelectedEvent(null)
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
        {showCreateForm || editingEvent ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">{editingEvent ? "Edit Event" : "Create New Event"}</h1>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingEvent(null)
                }}
              >
                Cancel
              </Button>
            </div>
            <EventForm
              event={editingEvent || undefined}
              onSuccess={handleEventSuccess}
              onCancel={() => {
                setShowCreateForm(false)
                setEditingEvent(null)
              }}
            />
          </div>
        ) : selectedEvent ? (
          <EventDetails
            event={selectedEvent}
            currentUserRole={currentUser?.role}
            currentUserId={currentUser?.id}
            onEdit={() => handleEventEdit(selectedEvent)}
            onBack={() => setSelectedEvent(null)}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Events</h1>
                <p className="text-muted-foreground">
                  {currentUser?.role === "ORGANIZER"
                    ? "Manage your hackathon events"
                    : "Browse and participate in hackathon events"}
                </p>
              </div>
              {currentUser?.role === "ORGANIZER" && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              )}
            </div>
            <EventList
              currentUserId={currentUser?.id}
              currentUserRole={currentUser?.role}
              onEventSelect={setSelectedEvent}
              onEventEdit={handleEventEdit}
            />
          </div>
        )}
      </div>
    </div>
  )
}
