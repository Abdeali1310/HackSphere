"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { X, Plus } from "lucide-react"

interface ProjectSubmission {
  id?: string
  title: string
  description: string
  repositoryUrl?: string
  demoUrl?: string
  videoUrl?: string
  presentationUrl?: string
  technologies: string[]
}

interface SubmissionFormProps {
  teamId: string
  submission?: ProjectSubmission
  onSuccess?: (submission: ProjectSubmission) => void
  onCancel?: () => void
}

export function SubmissionForm({ teamId, submission, onSuccess, onCancel }: SubmissionFormProps) {
  const [formData, setFormData] = useState({
    title: submission?.title || "",
    description: submission?.description || "",
    repositoryUrl: submission?.repositoryUrl || "",
    demoUrl: submission?.demoUrl || "",
    videoUrl: submission?.videoUrl || "",
    presentationUrl: submission?.presentationUrl || "",
    technologies: submission?.technologies || [],
  })
  const [newTechnology, setNewTechnology] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/teams/${teamId}/submission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit project")
      }

      toast({
        title: submission?.id ? "Project updated!" : "Project submitted!",
        description: submission?.id
          ? "Your project has been updated successfully."
          : "Your project has been submitted successfully.",
      })

      onSuccess?.(data.submission)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addTechnology = () => {
    if (newTechnology.trim() && !formData.technologies.includes(newTechnology.trim())) {
      setFormData((prev) => ({
        ...prev,
        technologies: [...prev.technologies, newTechnology.trim()],
      }))
      setNewTechnology("")
    }
  }

  const removeTechnology = (techToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((tech) => tech !== techToRemove),
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{submission?.id ? "Update Project Submission" : "Submit Your Project"}</CardTitle>
        <CardDescription>
          {submission?.id
            ? "Update your project details and submission links"
            : "Provide details about your project and submission links"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              placeholder="Enter your project title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Project Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your project, what it does, and how you built it..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={6}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="repositoryUrl">Repository URL</Label>
              <Input
                id="repositoryUrl"
                type="url"
                placeholder="https://github.com/username/project"
                value={formData.repositoryUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, repositoryUrl: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="demoUrl">Demo URL</Label>
              <Input
                id="demoUrl"
                type="url"
                placeholder="https://your-project-demo.com"
                value={formData.demoUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, demoUrl: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video Demo URL</Label>
              <Input
                id="videoUrl"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={formData.videoUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, videoUrl: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="presentationUrl">Presentation URL</Label>
              <Input
                id="presentationUrl"
                type="url"
                placeholder="https://slides.google.com/..."
                value={formData.presentationUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, presentationUrl: e.target.value }))}
              />
            </div>
          </div>

          {/* Technologies Section */}
          <div>
            <Label>Technologies Used</Label>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Add a technology..."
                value={newTechnology}
                onChange={(e) => setNewTechnology(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTechnology())}
              />
              <Button type="button" onClick={addTechnology} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.technologies.map((tech) => (
                <Badge key={tech} variant="secondary" className="flex items-center gap-1">
                  {tech}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeTechnology(tech)} />
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Submitting..." : submission?.id ? "Update Submission" : "Submit Project"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
