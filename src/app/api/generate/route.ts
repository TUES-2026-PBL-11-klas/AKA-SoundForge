import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { pcmToWav } from "@/lib/audio/pcm-to-wav";

export const runtime = "nodejs";
export const maxDuration = 90;

const ALLOWED_DURATIONS = new Set([20, 30, 45, 60]);
const DEFAULT_DURATION = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: {
    prompt?: string;
    genre?: string;
    mood?: string;
    hasVocals?: boolean;
    durationSeconds?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const prompt = body.prompt?.trim() ?? "";
  if (!prompt || prompt.length > 500) {
    return NextResponse.json({ error: "prompt must be 1-500 chars" }, { status: 400 });
  }

  const genre = body.genre?.trim() || null;
  const mood = body.mood?.trim() || null;
  const hasVocals = !!body.hasVocals;
  const durationSeconds = ALLOWED_DURATIONS.has(body.durationSeconds ?? -1)
    ? body.durationSeconds!
    : DEFAULT_DURATION;

  const fullPrompt = [
    prompt,
    genre,
    mood,
    hasVocals ? "with vocals" : "instrumental",
  ]
    .filter(Boolean)
    .join(", ");

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "missing GEMINI_API_KEY" }, { status: 500 });
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    apiVersion: "v1alpha",
  });

  const chunks: Buffer[] = [];
  let resolveDone: () => void = () => {};
  let rejectDone: (err: Error) => void = () => {};
  const done = new Promise<void>((resolve, reject) => {
    resolveDone = resolve;
    rejectDone = reject;
  });

  let session;
  try {
    session = await ai.live.music.connect({
      model: "models/lyria-realtime-exp",
      callbacks: {
        onmessage: (msg) => {
          const audioChunks = msg.serverContent?.audioChunks ?? [];
          for (const c of audioChunks) {
            if (c.data) chunks.push(Buffer.from(c.data, "base64"));
          }
        },
        onerror: (e) => {
          rejectDone(new Error(`lyria error: ${String(e)}`));
        },
        onclose: () => resolveDone(),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `connect failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }

  try {
    await session.setWeightedPrompts({
      weightedPrompts: [{ text: fullPrompt, weight: 1 }],
    });
    await session.play();
  } catch (err) {
    session.close();
    return NextResponse.json(
      { error: `play failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }

  setTimeout(() => session.close(), durationSeconds * 1000);

  try {
    await done;
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }

  if (chunks.length === 0) {
    return NextResponse.json(
      { error: "no audio chunks received from model" },
      { status: 502 }
    );
  }

  const pcm = Buffer.concat(chunks);
  const wav = pcmToWav(pcm, { sampleRate: 48000, channels: 2, bitDepth: 16 });

  const fileName = `${user.id}/${crypto.randomUUID()}.wav`;
  const { error: upErr } = await supabase.storage
    .from("tracks")
    .upload(fileName, wav, { contentType: "audio/wav" });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from("tracks").getPublicUrl(fileName);

  const { data: track, error: insErr } = await supabase
    .from("tracks")
    .insert({
      creator_id: user.id,
      prompt,
      genre,
      mood,
      has_vocals: hasVocals,
      duration_seconds: durationSeconds,
      audio_url: pub.publicUrl,
    })
    .select("id")
    .single();
  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ id: track.id });
}
