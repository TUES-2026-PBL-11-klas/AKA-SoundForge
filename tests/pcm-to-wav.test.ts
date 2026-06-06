import { describe, test, expect } from "vitest";
import { pcmToWav } from "@/lib/audio/pcm-to-wav";

describe("pcmToWav", () => {
  test("produces a valid 44-byte RIFF/WAVE header", () => {
    const pcm = Buffer.alloc(100); // dummy PCM
    const wav = pcmToWav(pcm, { sampleRate: 48000, channels: 2, bitDepth: 16 });

    expect(wav.length).toBe(44 + pcm.length);
    expect(wav.subarray(0, 4).toString()).toBe("RIFF");
    expect(wav.subarray(8, 12).toString()).toBe("WAVE");
    expect(wav.subarray(12, 16).toString()).toBe("fmt ");
    expect(wav.subarray(36, 40).toString()).toBe("data");
  });

  test("writes sample rate and channel count correctly", () => {
    const pcm = Buffer.alloc(0);
    const wav = pcmToWav(pcm, { sampleRate: 48000, channels: 2, bitDepth: 16 });

    expect(wav.readUInt16LE(22)).toBe(2); // channels
    expect(wav.readUInt32LE(24)).toBe(48000); // sample rate
    expect(wav.readUInt16LE(34)).toBe(16); // bit depth
    expect(wav.readUInt16LE(20)).toBe(1); // PCM format code
  });

  test("byte rate and block align match the formula", () => {
    const pcm = Buffer.alloc(0);
    const wav = pcmToWav(pcm, { sampleRate: 44100, channels: 1, bitDepth: 16 });

    // byteRate = sampleRate * channels * bitDepth / 8
    expect(wav.readUInt32LE(28)).toBe(44100 * 1 * 2);
    // blockAlign = channels * bitDepth / 8
    expect(wav.readUInt16LE(32)).toBe(2);
  });

  test("data chunk size equals the PCM length", () => {
    const pcm = Buffer.alloc(256);
    const wav = pcmToWav(pcm, { sampleRate: 48000, channels: 2, bitDepth: 16 });

    expect(wav.readUInt32LE(40)).toBe(256);
    // RIFF chunk size = 36 + data size
    expect(wav.readUInt32LE(4)).toBe(36 + 256);
  });

  test("PCM payload follows the 44-byte header byte-for-byte", () => {
    const pcm = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]);
    const wav = pcmToWav(pcm, { sampleRate: 48000, channels: 2, bitDepth: 16 });

    expect(wav.subarray(44).equals(pcm)).toBe(true);
  });
});
