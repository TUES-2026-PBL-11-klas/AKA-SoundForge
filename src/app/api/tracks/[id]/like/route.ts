import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: trackId } = await params;

  // check if already liked
  const { data: existing } = await supabase
    .from("likes")
    .select("track_id")
    .eq("track_id", trackId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // unlike
    await supabase
      .from("likes")
      .delete()
      .eq("track_id", trackId)
      .eq("user_id", user.id);
  } else {
    // like
    await supabase.from("likes").insert({ track_id: trackId, user_id: user.id });
  }

  const { data: track } = await supabase
    .from("tracks")
    .select("like_count")
    .eq("id", trackId)
    .single();

  return NextResponse.json({
    liked: !existing,
    like_count: track?.like_count ?? 0,
  });
}
