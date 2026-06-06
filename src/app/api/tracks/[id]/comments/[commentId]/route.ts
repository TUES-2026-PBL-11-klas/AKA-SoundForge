import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: trackId, commentId } = await params;

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Keep comment_count accurate regardless of trigger state.
  const { count } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("track_id", trackId);
  await supabase
    .from("tracks")
    .update({ comment_count: count ?? 0 })
    .eq("id", trackId);

  return new NextResponse(null, { status: 204 });
}
