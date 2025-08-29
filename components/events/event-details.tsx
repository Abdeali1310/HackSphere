"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Users,
  ExternalLink,
  Trophy,
  CheckCircle,
  Circle,
  UserPlus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: string;
  title: string;
  description: string;
  theme: string;
  startDate: string;
  endDate: string;
  status: string;
  maxTeamSize: number;
  minTeamSize: number;
  banner?: string;
  website?: string;
  organizerId: string;
}

interface Track {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface Prize {
  id: string;
  title: string;
  description: string;
  amount: number;
  position: number;
  sponsor?: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  isCompleted: boolean;
}

interface EventDetailsProps {
  event: Event;
  currentUserRole?: string;
  currentUserId?: string;
  onEdit?: () => void;
  onBack?: () => void;
}

export function EventDetails({
  event,
  currentUserRole,
  currentUserId,
  onEdit,
  onBack,
}: EventDetailsProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const { toast } = useToast();
  const [hasSubmitted, setHasSubmitted] = useState<boolean | null>(null);
  const teamId = localStorage.getItem("teamId") || null;
  useEffect(() => {
    const fetchSubmissionStatus = async () => {
      if (!teamId) return;
      try {
        const res = await fetch(
          `/api/events/${event.id}/submissions/status?teamId=${teamId}&eventId=${event.id}`
        );
        const data = await res.json();

        setHasSubmitted(data.submitted);
      } catch (err) {
        console.error("Error checking submission:", err);
        setHasSubmitted(false);
      }
    };

    fetchSubmissionStatus();
  }, [teamId, event.id]);

  useEffect(() => {
    fetchEventDetails();
    if (currentUserId) {
      checkRegistrationStatus();
    }
  }, [event.id, currentUserId]);

  const fetchEventDetails = async () => {
    try {
      const [tracksRes, prizesRes, milestonesRes] = await Promise.all([
        fetch(`/api/events/${event.id}/tracks`),
        fetch(`/api/events/${event.id}/prizes`),
        fetch(`/api/events/${event.id}/milestones`),
      ]);

      const [tracksData, prizesData, milestonesData] = await Promise.all([
        tracksRes.json(),
        prizesRes.json(),
        milestonesRes.json(),
      ]);

      setTracks(tracksData.tracks || []);
      setPrizes(prizesData.prizes || []);
      setMilestones(milestonesData.milestones || []);
    } catch (error) {
      console.error("Failed to fetch event details:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`/api/events/${event.id}/registration-status`);
      if (!res.ok) throw new Error("Failed to check status");
      const data = await res.json();
      setIsRegistered(data.registered);
    } catch (error) {
      console.error(error);
      setIsRegistered(false);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const response = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Registered!",
          description: "You have successfully registered for this event.",
        });
        setIsRegistered(true);
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to register",
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!confirm("Are you sure you want to unregister from this event?"))
      return;

    try {
      const response = await fetch(`/api/events/${event.id}/register`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Unregistered",
          description: "You have been unregistered from this event.",
        });
        setIsRegistered(false);
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to unregister",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "PUBLISHED":
        return "bg-blue-100 text-blue-800";
      case "ONGOING":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canRegister =
    event.status === "PUBLISHED" || event.status === "ONGOING";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            {onBack && (
              <Button variant="ghost" onClick={onBack}>
                ← Back
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold">{event.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(event.status)}>
                  {event.status}
                </Badge>
                <Badge variant="outline">{event.theme}</Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {currentUserRole === "PARTICIPANT" && (
            <>
              {!isRegistered ? (
                <Button onClick={handleRegister} disabled={registering}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {registering ? "Registering..." : "Register"}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="destructive" disabled>
                    Registered
                  </Button>
                  <Button asChild>
                    <a href={`/events/${event.id}/teams`}>
                      <Users className="h-4 w-4 mr-2" />
                      View Teams
                    </a>
                  </Button>

                  {event.status === "ONGOING" &&
                    (!hasSubmitted ? (
                      <Button asChild>
                        <a href={`/events/${event.id}/submissions`}>
                          Submit Project
                        </a>
                      </Button>
                    ) : (
                      <Button className=" bg-gray-400 disabled">
                        Already submitted!
                      </Button>
                    ))}
                  {hasSubmitted ? "" : 
                    <Button variant="outline" onClick={handleUnregister}>
                    Unregister
                  </Button>
                  }
                  
                </div>
              )}
            </>
          )}

          {currentUserRole === "ORGANIZER" &&
            event.organizerId === currentUserId &&
            onEdit && <Button onClick={onEdit}>Edit Event</Button>}
        </div>
      </div>

      {/* Banner */}
      {event.banner && (
        <div className="w-full h-64 rounded-lg overflow-hidden">
          <img
            src={event.banner || "/placeholder.svg"}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Event Info */}
      <Card>
        <CardHeader>
          <CardTitle>Event Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{event.description}</p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Start Date</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(event.startDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">End Date</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(event.endDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Team Size</p>
                <p className="text-sm text-muted-foreground">
                  {event.minTeamSize} - {event.maxTeamSize} members
                </p>
              </div>
            </div>

            {event.website && (
              <div className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Website</p>
                  <a
                    href={event.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Visit Event Website
                  </a>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for additional details */}
      <Tabs defaultValue="tracks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tracks">Tracks</TabsTrigger>
          <TabsTrigger value="prizes">Prizes</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="tracks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competition Tracks</CardTitle>
              <CardDescription>
                Different categories participants can compete in
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 bg-muted rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : tracks.length > 0 ? (
                <div className="space-y-4">
                  {tracks.map((track) => (
                    <div key={track.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: track.color }}
                        />
                        <div>
                          <h3 className="font-semibold">{track.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {track.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No tracks defined for this event.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prizes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prizes & Awards</CardTitle>
              <CardDescription>
                Rewards for top performing teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-20 bg-muted rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : prizes.length > 0 ? (
                <div className="space-y-4">
                  {prizes.map((prize) => (
                    <div key={prize.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Trophy className="h-5 w-5 text-yellow-500 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{prize.title}</h3>
                            <Badge variant="outline">#{prize.position}</Badge>
                            <span className="font-bold text-primary">
                              ${prize.amount}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {prize.description}
                          </p>
                          {prize.sponsor && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Sponsored by {prize.sponsor}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No prizes defined for this event.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Milestones</CardTitle>
              <CardDescription>Important dates and deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 bg-muted rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : milestones.length > 0 ? (
                <div className="space-y-4">
                  {milestones.map((milestone) => (
                    <div key={milestone.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        {milestone.isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground mt-1" />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold">{milestone.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {milestone.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Due: {formatDate(milestone.dueDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No milestones defined for this event.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
