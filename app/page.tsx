"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthForm } from "@/components/auth/auth-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/layout/navbar"
import { Trophy, Calendar, Users, Zap, Target, Award } from "lucide-react"

export default function HomePage() {
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleAuthSuccess = (userData: any, token: string) => {
    setUser(userData)
    setAuthMode(null)
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(userData))

    const dashboardPath = getDashboardPath(userData.role)
    router.push(dashboardPath)
  }

  const getDashboardPath = (role: string) => {
    switch (role) {
      case "ORGANIZER":
        return "/dashboard/organizer"
      case "JUDGE":
        return "/dashboard/judge"
      case "PARTICIPANT":
        return "/dashboard/participant"
      default:
        return "/dashboard"
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (authMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <AuthForm mode={authMode} onSuccess={handleAuthSuccess} />
          <div className="text-center mt-4">
            <Button variant="ghost" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
              {authMode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h1>
            <p className="text-muted-foreground">Ready to continue your hackathon journey?</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Dashboard
                </CardTitle>
                <CardDescription>View your personalized dashboard and statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <a href={getDashboardPath(user.role)}>Go to Dashboard</a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Events
                </CardTitle>
                <CardDescription>
                  {user.role === "ORGANIZER"
                    ? "Create and manage hackathon events"
                    : "Browse and join hackathon events"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <a href="/events">{user.role === "ORGANIZER" ? "Manage Events" : "Browse Events"}</a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {user.role === "PARTICIPANT" ? "Teams" : "Users"}
                </CardTitle>
                <CardDescription>
                  {user.role === "PARTICIPANT"
                    ? "Find and join teams for hackathons"
                    : "Browse and connect with platform users"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <a href={user.role === "PARTICIPANT" ? "/teams/team-list" : "/users"}>
                    {user.role === "PARTICIPANT" ? "Find Teams" : "Browse Users"}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Trophy className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Welcome to <span className="text-primary">HackSphere</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The ultimate platform for organizing and participating in hackathons. Connect with innovators, build amazing
            projects, and showcase your skills.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => setAuthMode("register")}>
              Get Started
            </Button>
            <Button variant="outline" size="lg" onClick={() => setAuthMode("login")}>
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need for Successful Hackathons</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-primary">For Organizers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create and manage events, track participants, assign judges, and oversee the entire hackathon
                  lifecycle with powerful analytics and tools.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-primary">For Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Join events, form teams, collaborate on projects, and submit your innovative solutions with integrated
                  communication tools.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-primary">For Judges</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Evaluate submissions, provide detailed feedback, and help identify the most promising projects with
                  structured scoring systems.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Hackathon Journey?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Join thousands of innovators, creators, and problem-solvers in the ultimate hackathon experience.
          </p>
          <Button size="lg" onClick={() => setAuthMode("register")}>
            Join HackSphere Today
          </Button>
        </div>
      </section>
    </div>
  )
}
