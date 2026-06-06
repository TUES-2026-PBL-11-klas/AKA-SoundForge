import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type CommentRow = {
  id: string;
  body: string;
  created_at: string;
  is_mine: boolean;
  user: {
    username: string;
    avatar_url: string | null;
  };
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: trackId } = await params;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("comments")
    .select(
      `id, body, created_at, user_id,
       user:profiles!comments_user_id_fkey(username, avatar_url)`
    )
    .eq("track_id", trackId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const comments: CommentRow[] = (data ?? []).map((c) => ({
    id: c.id,
    body: c.body,
    created_at: c.created_at,
    is_mine: c.user_id === user?.id,
    user: Array.isArray(c.user) ? c.user[0] : c.user,
  }));

  return NextResponse.json(comments);
}

export async function POST(
  req: NextRequest,
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
  let body: string;

  try {
    const json = await req.json();
    body = (json.body ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || body.length > 500) {
    return NextResponse.json(
      { error: "Comment must be 1–500 characters" },
      { status: 400 }
    );
  }

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({ track_id: trackId, user_id: user.id, body })
    .select(
      `id, body, created_at,
       user:profiles!comments_user_id_fkey(username, avatar_url)`
    )
    .single();

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

  const result: CommentRow = {
    id: comment.id,
    body: comment.body,
    created_at: comment.created_at,
    is_mine: true,
    user: Array.isArray(comment.user) ? comment.user[0] : comment.user,
  };

  return NextResponse.json(result, { status: 201 });
}
