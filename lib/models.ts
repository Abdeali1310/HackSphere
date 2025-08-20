import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  id?: string
  email: string
  passwordHash: string
  name: string
  role: "ORGANIZER" | "PARTICIPANT" | "JUDGE"
  avatar?: string
  bio?: string
  skills?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Event {
  _id?: ObjectId
  id?: string
  title: string
  description: string
  theme: string
  startDate: Date
  endDate: Date
  status: "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "CANCELLED"
  maxTeamSize: number
  minTeamSize: number
  banner?: string
  website?: string
  organizerId: string
  createdAt: Date
  updatedAt: Date
}

export interface Track {
  _id?: ObjectId
  id?: string
  name: string
  description: string
  color: string
  eventId: string
}

export interface Prize {
  _id?: ObjectId
  id?: string
  title: string
  description: string
  amount: number
  position: number
  sponsor?: string
  eventId: string
}

export interface Milestone {
  _id?: ObjectId
  id?: string
  title: string
  description: string
  dueDate: Date
  isCompleted: boolean
  eventId: string
}

export interface Registration {
  _id?: ObjectId
  id?: string
  userId: string
  eventId: string
  createdAt: Date
}

export interface Team {
  _id?: ObjectId
  id?: string
  name: string
  description: string
  status: "FORMING" | "COMPLETE" | "SUBMITTED"
  inviteCode: string
  eventId: string
  trackId?: string
  createdAt: Date
  updatedAt: Date
}

export interface TeamMember {
  _id?: ObjectId
  id?: string
  userId: string
  teamId: string
  isLeader: boolean
  joinedAt: Date
}

export interface JudgeAssignment {
  _id?: ObjectId
  id?: string
  judgeId: string
  eventId: string
  createdAt: Date
}

export interface ScoringCriteria {
  _id?: ObjectId
  id?: string
  name: string
  description: string
  maxPoints: number
  weight: number
}

export interface Score {
  _id?: ObjectId
  id?: string
  judgeId: string
  teamId: string
  criteriaId: string
  points: number
  feedback?: string
}

export interface ProjectSubmission {
  _id?: ObjectId
  id?: string
  teamId: string
  eventId: string
  title: string
  description: string
  repositoryUrl?: string
  demoUrl?: string
  videoUrl?: string
  presentationUrl?: string
  technologies: string[]
  submittedAt: Date
  updatedAt: Date
}

export interface Message {
  _id?: ObjectId
  id?: string
  senderId: string
  recipientType: "TEAM" | "EVENT" | "DIRECT"
  recipientId: string
  content: string
  type: "TEXT" | "ANNOUNCEMENT" | "SYSTEM"
  createdAt: Date
  readBy: Array<{
    userId: string
    readAt: Date
  }>
}

export interface Notification {
  _id?: ObjectId
  id?: string
  userId: string
  type: "TEAM_INVITE" | "EVENT_UPDATE" | "SUBMISSION_SCORED" | "ANNOUNCEMENT" | "MILESTONE_DUE"
  title: string
  message: string
  data?: Record<string, any>
  isRead: boolean
  createdAt: Date
}

export interface Activity {
  _id?: ObjectId
  id?: string
  userId: string
  eventId: string
  type: "TEAM_JOINED" | "TEAM_CREATED" | "SUBMISSION_CREATED" | "SUBMISSION_UPDATED" | "EVENT_REGISTERED"
  description: string
  metadata?: Record<string, any>
  createdAt: Date
}

export interface Comment {
  _id?: ObjectId
  id?: string
  authorId: string
  targetType: "SUBMISSION" | "EVENT"
  targetId: string
  content: string
  parentId?: string
  createdAt: Date
  updatedAt: Date
}
