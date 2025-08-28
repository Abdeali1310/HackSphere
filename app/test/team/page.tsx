'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Crown, 
  Copy, 
  UserMinus, 
  UserCheck, 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2,
  Upload,
  ExternalLink,
  Github,
  Play
} from 'lucide-react';

// Types
interface Team {
  id: string;
  name: string;
  description: string;
  status: 'FORMING' | 'COMPLETE' | 'SUBMITTED';
  trackId?: string;
  inviteCode: string;
  eventId: string;
  memberCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Member {
  id: string;
  userId: string;
  isLeader: boolean;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    skills?: string[];
  };
}

interface ProjectSubmission {
  id: string;
  teamId: string;
  eventId: string;
  title: string;
  description: string;
  repositoryUrl?: string;
  demoUrl?: string;
  videoUrl?: string;
  presentationUrl?: string;
  technologies: string[];
  submittedAt: string;
  updatedAt: string;
}

// Main App Component
export default function HackathonTeamApp() {
  const [currentView, setCurrentView] = useState<'list' | 'details' | 'create' | 'edit'>('list');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [currentUser] = useState({ id: 'user123', name: 'John Doe', email: 'john@example.com' });
  const [eventId] = useState('event123');
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  const [members, setMembers] = useState<Member[]>([]);
const [submission, setSubmission] = useState<ProjectSubmission | null>(null);
const [loadingMembers, setLoadingMembers] = useState(true);
const [loadingSubmission, setLoadingSubmission] = useState(true);


useEffect(() => {
    if (!selectedTeam) return;
  
    const fetchMembers = async () => {
      setLoadingMembers(true);
      try {
        const res = await fetch(`/api/teams/${selectedTeam.id}/members`);
        const data = await res.json();
        setMembers(data.members); // API should return { members: [...] }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMembers(false);
      }
    };
  
    const fetchSubmission = async () => {
      setLoadingSubmission(true);
      try {
        const res = await fetch(`/api/teams/${selectedTeam.id}/submission`);
        const data = await res.json();
        setSubmission(data.submission);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSubmission(false);
      }
    };
  
    fetchMembers();
    fetchSubmission();
  }, [selectedTeam]);
  
  

  if (loading) return <p>Loading teams...</p>;

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    setCurrentView('details');
  };

  const handleCreateTeam = () => {
    setCurrentView('create');
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setCurrentView('edit');
  };

  const handleBack = () => {
    setCurrentView('list');
    setSelectedTeam(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Hackathon Teams</h1>
          <p className="text-gray-600 mt-2">Manage your hackathon teams and collaborate with others</p>
        </div>

        {currentView === 'list' && (
          <TeamListView 
            teams={teams} 
            onTeamSelect={handleTeamSelect}
            onTeamEdit={handleEditTeam}
            onCreateTeam={handleCreateTeam}
          />
        )}

        {currentView === 'details' && selectedTeam && (
          <TeamDetailsView 
            team={selectedTeam}
            currentUserId={currentUser.id}
            onBack={handleBack}
            onEdit={() => handleEditTeam(selectedTeam)}
          />
        )}

        {currentView === 'create' && (
          <CreateTeamView 
            eventId={eventId}
            onBack={handleBack}
            onSuccess={(newTeam) => {
              setTeams(prev => [...prev, newTeam]);
              setSelectedTeam(newTeam);
              setCurrentView('details');
            }}
          />
        )}

        {currentView === 'edit' && selectedTeam && (
          <EditTeamView 
            team={selectedTeam}
            onBack={handleBack}
            onSuccess={(updatedTeam) => {
              setTeams(prev => prev.map(t => t.id === updatedTeam.id ? updatedTeam : t));
              setSelectedTeam(updatedTeam);
              setCurrentView('details');
            }}
          />
        )}
      </div>
    </div>
  );
}

// Team List Component
function TeamListView({ teams, onTeamSelect, onTeamEdit, onCreateTeam }: {
  teams: Team[];
  onTeamSelect: (team: Team) => void;
  onTeamEdit: (team: Team) => void;
  onCreateTeam: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const filteredTeams = teams.filter(team => 
    statusFilter === 'all' || team.status === statusFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FORMING': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETE': return 'bg-green-100 text-green-800';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) return;
    setIsJoining(true);
    // Simulate API call
    setTimeout(() => {
      alert(`Joined team with code: ${joinCode}`);
      setJoinCode('');
      setIsJoining(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              <SelectItem value="FORMING">Forming</SelectItem>
              <SelectItem value="COMPLETE">Complete</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Join Team</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join Team</DialogTitle>
                <DialogDescription>Enter the invite code to join an existing team</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="joinCode">Invite Code</Label>
                  <Input
                    id="joinCode"
                    placeholder="Enter invite code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleJoinTeam} disabled={isJoining}>
                  {isJoining ? 'Joining...' : 'Join Team'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button onClick={onCreateTeam}>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{team.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getStatusColor(team.status)}>{team.status}</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{team.memberCount || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={(e) => {e.stopPropagation(); onTeamEdit(team);}}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0" onClick={() => onTeamSelect(team)}>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{team.description}</p>
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Code: <span className="font-mono font-bold">{team.inviteCode}</span>
                </div>
                {team.status === 'FORMING' && (
                  <Badge variant="outline" className="text-xs">Looking for members</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Team Details Component
function TeamDetailsView({ team, currentUserId, onBack, onEdit }: {
  team: Team;
  currentUserId: string;
  onBack: () => void;
  onEdit: () => void;
}) {
  const [members, setMembers] = useState<Member[]>([
    {
      id: '1',
      userId: 'user123',
      isLeader: true,
      joinedAt: '2024-01-01',
      user: {
        id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        skills: ['React', 'Node.js', 'TypeScript']
      }
    },
    {
      id: '2',
      userId: 'user456',
      isLeader: false,
      joinedAt: '2024-01-02',
      user: {
        id: 'user456',
        name: 'Jane Smith',
        email: 'jane@example.com',
        skills: ['Python', 'ML', 'Data Science']
      }
    }
  ]);
  
  const [submission, setSubmission] = useState<ProjectSubmission | null>(null);

  const copyInviteCode = () => {
    navigator.clipboard.writeText(team.inviteCode);
    alert('Invite code copied to clipboard!');
  };

  const currentUserMember = members.find(m => m.userId === currentUserId);
  const isCurrentUserLeader = currentUserMember?.isLeader || false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{team.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`${team.status === 'FORMING' ? 'bg-yellow-100 text-yellow-800' : 
                  team.status === 'COMPLETE' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                  {team.status}
                </Badge>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{members.length} members</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {isCurrentUserLeader && <Button onClick={onEdit}>Edit Team</Button>}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="submission">Submission</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{team.description}</p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>Invite Code</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={team.inviteCode} readOnly className="font-mono" />
                    <Button variant="outline" size="icon" onClick={copyInviteCode}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Current team members and their roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {member.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{member.user.name}</h3>
                          {member.isLeader && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Crown className="h-3 w-3" />
                              Leader
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                        {member.user.skills && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {member.user.skills.slice(0, 3).map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {isCurrentUserLeader && member.userId !== currentUserId && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <UserCheck className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submission" className="space-y-6">
          <ProjectSubmissionView teamId={team.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Create Team Component
function CreateTeamView({ eventId, onBack, onSuccess }: {
  eventId: string;
  onBack: () => void;
  onSuccess: (team: Team) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trackId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    try {
      const res = await fetch(`/api/events/${eventId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          trackId: formData.trackId || null
        }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create team');
      }
  
      onSuccess(data.team); // Add the new team to state in parent component
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create New Team</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Details</CardTitle>
          <CardDescription>Fill in the information for your new team</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter team name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your team and project goals"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="track">Track (Optional)</Label>
              <Select value={formData.trackId} onValueChange={(value) => setFormData(prev => ({ ...prev, trackId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a track" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web">Web Development</SelectItem>
                  <SelectItem value="mobile">Mobile Development</SelectItem>
                  <SelectItem value="ai">AI/Machine Learning</SelectItem>
                  <SelectItem value="blockchain">Blockchain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Team'}
              </Button>
              <Button type="button" variant="outline" onClick={onBack}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Edit Team Component  
function EditTeamView({ team, onBack, onSuccess }: {
  team: Team;
  onBack: () => void;
  onSuccess: (team: Team) => void;
}) {
  const [formData, setFormData] = useState({
    name: team.name,
    description: team.description,
    trackId: team.trackId || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const updatedTeam: Team = {
        ...team,
        ...formData
      };
      
      onSuccess(updatedTeam);
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Team</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Details</CardTitle>
          <CardDescription>Update your team information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter team name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your team and project goals"
                rows={4}
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Team'}
              </Button>
              <Button type="button" variant="outline" onClick={onBack}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Project Submission Component
function ProjectSubmissionView({ teamId }: { teamId: string }) {
  const [submission, setSubmission] = useState<ProjectSubmission | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    repositoryUrl: '',
    demoUrl: '',
    videoUrl: '',
    presentationUrl: '',
    technologies: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const newSubmission: ProjectSubmission = {
        id: `sub${Date.now()}`,
        teamId,
        eventId: 'event123',
        ...formData,
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setSubmission(newSubmission);
      setIsSubmitting(false);
    }, 1000);
  };

  if (submission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Project Submission
          </CardTitle>
          <CardDescription>Your project has been submitted successfully</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">{submission.title}</h3>
            <p className="text-muted-foreground mt-1">{submission.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {submission.repositoryUrl && (
              <div className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                <a href={submission.repositoryUrl} target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 hover:underline">
                  Repository
                </a>
              </div>
            )}
            
            {submission.demoUrl && (
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                <a href={submission.demoUrl} target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 hover:underline">
                  Live Demo
                </a>
              </div>
            )}
          </div>

          {submission.technologies.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Technologies Used</h4>
              <div className="flex flex-wrap gap-2">
                {submission.technologies.map((tech) => (
                  <Badge key={tech} variant="secondary">{tech}</Badge>
                ))}
              </div>
            </div>
          )}
          
          <Alert>
            <AlertDescription>
              Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Your Project</CardTitle>
        <CardDescription>Share your team's project details and links</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter project title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Project Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your project, its features, and impact"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Project'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}