import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import type { ProjectSubmission } from "@/lib/models";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");
    const eventId = searchParams.get("eventId");

    if (!teamId || !eventId) {
      return NextResponse.json(
        { error: "Missing teamId or eventId" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const submissions = db.collection<ProjectSubmission>("project_submissions");

    const submission = await submissions.findOne({ teamId, eventId });

    return NextResponse.json({
      submitted: !!submission,
      submission: submission || null,
    });
  } catch (error) {
    console.error("Error checking submission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
