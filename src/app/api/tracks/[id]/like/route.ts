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

  // read current count BEFORE mutating so we can compute the new value ourselves
  // (avoids relying on trigger timing or a second count query)
  const [{ data: existing }, { data: track }] = await Promise.all([
    supabase
      .from("likes")
      .select("track_id")
      .eq("track_id", trackId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("tracks")
      .select("like_count")
      .eq("id", trackId)
      .single(),
  ]);

  const currentCount = track?.like_count ?? 0;

  if (existing) {
    await supabase
      .from("likes")
      .delete()
      .eq("track_id", trackId)
      .eq("user_id", user.id);

    return NextResponse.json({
      liked: false,
      like_count: Math.max(0, currentCount - 1),
    });
  } else {
    await supabase
      .from("likes")
      .insert({ track_id: trackId, user_id: user.id });

    return NextResponse.json({
      liked: true,
      like_count: currentCount + 1,
    });
  }
}
