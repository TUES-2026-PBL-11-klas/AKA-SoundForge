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

  const { data: existing } = await supabase
    .from("likes")
    .select("track_id")
    .eq("track_id", trackId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("likes")
      .delete()
      .eq("track_id", trackId)
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("likes")
      .insert({ track_id: trackId, user_id: user.id });
  }

  // Count from the source table so the returned value is always correct,
  // regardless of whether the denormalized trigger is in place.
  const { count } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("track_id", trackId);

  const like_count = count ?? 0;

  // Keep the denormalized column in sync.
  await supabase
    .from("tracks")
    .update({ like_count })
    .eq("id", trackId);

  return NextResponse.json({ liked: !existing, like_count });
}
