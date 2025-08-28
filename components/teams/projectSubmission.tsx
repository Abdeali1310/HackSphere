"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, ExternalLink, Github, Play, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProjectSubmissionProps {
  teamId: string
}

export default function ProjectSubmission({ teamId }: ProjectSubmissionProps) {
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    repositoryUrl: '',
    demoUrl: '',
    videoUrl: '',
    presentationUrl: '',
    technologies: []
  })
  const [techInput, setTechInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSubmission()
  }, [teamId])

  const fetchSubmission = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}/submission`)
      const data = await response.json()
      
      if (response.ok && data.submission) {
        setSubmission(data.submission)
        setFormData({
          title: data.submission.title || '',
          description: data.submission.description || '',
          repositoryUrl: data.submission.repositoryUrl || '',
          demoUrl: data.submission.demoUrl || '',
          videoUrl: data.submission.videoUrl || '',
          presentationUrl: data.submission.presentationUrl || '',
          technologies: data.submission.technologies || []
        })
      }
    } catch (error) {
      console.error('Failed to fetch submission:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      toast({
        title: "Error",
        description: "Title and description are required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/submission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success!",
          description: submission ? "Project updated successfully" : "Project submitted successfully",
        })
        setSubmission(data.submission)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit project",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addTechnology = () => {
    if (techInput.trim() && !formData.technologies.includes(techInput.trim())) {
      setFormData(prev => ({
        ...prev,
        technologies: [...prev.technologies, techInput.trim()]
      }))
      setTechInput('')
    }
  }

  const removeTechnology = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter(t => t !== tech)
    }))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Project Submission
          {submission && <CheckCircle className="h-5 w-5 text-green-600" />}
        </CardTitle>
        <CardDescription>
          {submission ? 'Update your project details' : 'Submit your team\'s project'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {submission && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Project submitted on {new Date(submission.submittedAt).toLocaleDateString()}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter project title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Project Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your project, its features, and impact"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="repo">Repository URL</Label>
              <Input
                id="repo"
                type="url"
                value={formData.repositoryUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, repositoryUrl: e.target.value }))}
                placeholder="https://github.com/..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="demo">Demo URL</Label>
              <Input
                id="demo"
                type="url"
                value={formData.demoUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, demoUrl: e.target.value }))}
                placeholder="https://your-demo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video">Video URL</Label>
              <Input
                id="video"
                type="url"
                value={formData.videoUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                placeholder="https://youtube.com/..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="presentation">Presentation URL</Label>
              <Input
                id="presentation"
                type="url"
                value={formData.presentationUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, presentationUrl: e.target.value }))}
                placeholder="https://slides.com/..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Technologies Used</Label>
            <div className="flex gap-2">
              <Input
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                placeholder="Add technology"
                onKeyPress={(e) => e.key === 'Enter' && addTechnology()}
              />
              <Button type="button" onClick={addTechnology}>Add</Button>
            </div>
            {formData.technologies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.technologies.map((tech) => (
                  <Badge
                    key={tech}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeTechnology(tech)}
                  >
                    {tech} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : submission ? 'Update Project' : 'Submit Project'}
            </Button>
          </div>
        </div>

        {/* Display links if submission exists */}
        {submission && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Project Links</h4>
            <div className="grid grid-cols-2 gap-4">
              {submission.repositoryUrl && (
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  <a href={submission.repositoryUrl} target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:underline text-sm">
                    Repository
                  </a>
                </div>
              )}
              
              {submission.demoUrl && (
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  <a href={submission.demoUrl} target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:underline text-sm">
                    Live Demo
                  </a>
                </div>
              )}

              {submission.videoUrl && (
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  <a href={submission.videoUrl} target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:underline text-sm">
                    Video
                  </a>
                </div>
              )}

              {submission.presentationUrl && (
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  <a href={submission.presentationUrl} target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:underline text-sm">
                    Presentation
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}