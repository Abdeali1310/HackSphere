import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Await params first
    const { id: userId } = await params;


    const db = await getDatabase();

    const teamMember = await db
      .collection("team_members")
      .findOne({ userId: userId.trim() });
    
    return NextResponse.json({ teamId: teamMember?.teamId || null });
  } catch (error) {
    console.error("Error fetching teamId:", error);
    return NextResponse.json({ teamId: null });
  }
}

// POST /api/users/[id]/team - Join or create team
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await request.json();
    const { teamId, eventId, teamName } = body;

    console.log("POST request - userId:", userId, "body:", body);

    const db = await getDatabase();

    // Check if user already has a team for this event
    const existingTeamMember = await db.collection("teamMembers").findOne({
      userId: userId, // Keep as string
    });

    if (existingTeamMember) {
      // Get team details to check event
      const existingTeam = await db.collection("teams").findOne({
        _id: new ObjectId(existingTeamMember.teamId),
      });

      if (existingTeam?.eventId?.toString() === eventId) {
        return NextResponse.json(
          { error: "User already has a team for this event" },
          { status: 400 }
        );
      }
    }

    let targetTeamId: string;

    if (teamId) {
      // Joining existing team
      if (!ObjectId.isValid(teamId)) {
        return NextResponse.json(
          { error: "Invalid team ID format" },
          { status: 400 }
        );
      }

      const team = await db.collection("teams").findOne({
        _id: new ObjectId(teamId),
        eventId: new ObjectId(eventId),
      });

      if (!team) {
        return NextResponse.json(
          { error: "Team not found for this event" },
          { status: 404 }
        );
      }

      // Check team size limit (assuming max 4 members)
      const teamMemberCount = await db
        .collection("teamMembers")
        .countDocuments({
          teamId: teamId, // Use string for count
        });

      if (teamMemberCount >= 4) {
        return NextResponse.json({ error: "Team is full" }, { status: 400 });
      }

      targetTeamId = teamId;
    } else if (teamName) {
      // Creating new team
      const newTeam = {
        name: teamName,
        eventId: new ObjectId(eventId),
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: new ObjectId(userId),
      };

      const teamResult = await db.collection("teams").insertOne(newTeam);
      targetTeamId = teamResult.insertedId.toString(); // Convert to string
    } else {
      return NextResponse.json(
        { error: "Either teamId or teamName is required" },
        { status: 400 }
      );
    }

    // Add user to team (store teamId and userId as strings)
    const teamMember = {
      userId: userId, // Keep as string
      teamId: targetTeamId, // Keep as string
      isLeader: !teamId, // If creating team, user becomes leader
      joinedAt: new Date(),
    };

    const memberResult = await db
      .collection("teamMembers")
      .insertOne(teamMember);

    return NextResponse.json({
      success: true,
      teamMember: {
        _id: memberResult.insertedId,
        ...teamMember,
      },
    });
  } catch (error) {
    console.error("Error joining/creating team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id]/team - Leave team
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    const db = await getDatabase();

    // Find and remove team member
    const deletedMember = await db.collection("teamMembers").findOneAndDelete({
      userId: userId, // Keep as string
    });

    if (!deletedMember) {
      return NextResponse.json(
        { error: "User not found in any team" },
        { status: 404 }
      );
    }

    // If user was leader, check if team should be deleted or leadership transferred
    if (deletedMember.isLeader) {
      const remainingMembers = await db
        .collection("teamMembers")
        .find({ teamId: deletedMember.teamId }) // Use string teamId
        .toArray();

      if (remainingMembers.length === 0) {
        // Delete empty team
        await db.collection("teams").deleteOne({
          _id: new ObjectId(deletedMember.teamId),
        });
      } else {
        // Transfer leadership to first remaining member
        await db
          .collection("teamMembers")
          .updateOne(
            { _id: remainingMembers[0]._id },
            { $set: { isLeader: true } }
          );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
