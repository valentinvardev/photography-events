import fs from "fs";
import os from "os";
import path from "path";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- ffmpeg packages are runtime-only, not bundled by webpack
import ffmpeg from "fluent-ffmpeg";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ffmpegStatic from "ffmpeg-static";
import { db } from "~/server/db";
import { getAdminClient } from "~/lib/supabase/admin";
import { getS3ObjectBytes, putS3Object, deleteS3Objects, isS3Key } from "~/lib/s3";
import { WATERMARK_KEY } from "~/lib/watermark";

if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic);

// ── Storage helpers ───────────────────────────────────────────────────────────

async function downloadToTempFile(storageKey: string, ext: string): Promise<string | null> {
  let bytes: Uint8Array | null = null;

  if (isS3Key(storageKey)) {
    try { bytes = await getS3ObjectBytes(storageKey); }
    catch (err) { console.error("[VideoWatermark] S3 download failed:", err); return null; }
  } else {
    const supabase = getAdminClient();
    if (!supabase) return null;
    const { data, error } = await supabase.storage.from("photos").download(storageKey);
    if (error ?? !data) { console.error("[VideoWatermark] Supabase download failed:", error); return null; }
    bytes = new Uint8Array(await data.arrayBuffer());
  }

  const tmpPath = path.join(os.tmpdir(), `ms-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  fs.writeFileSync(tmpPath, bytes);
  return tmpPath;
}

async function getWatermarkTempPath(): Promise<string | null> {
  const supabase = getAdminClient();
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from("photos").download(WATERMARK_KEY);
  if (error ?? !data) return null;
  const tmpPath = path.join(os.tmpdir(), `ms-wm-${Date.now()}.png`);
  fs.writeFileSync(tmpPath, Buffer.from(await data.arrayBuffer()));
  return tmpPath;
}

function runFfmpeg(cmd: ffmpeg.FfmpegCommand): Promise<void> {
  return new Promise((resolve, reject) =>
    cmd
      .on("end", () => resolve())
      .on("error", (err: Error, _stdout: string, stderr: string) => {
        console.error("[VideoWatermark] ffmpeg error:", err.message);
        console.error("[VideoWatermark] stderr:", stderr);
        reject(err);
      })
      .run()
  );
}

// ── Core function ─────────────────────────────────────────────────────────────

export async function runVideoWatermark(photoId: string): Promise<{ previewKey: string | null }> {
  const photo = await db.photo.findUnique({ where: { id: photoId } });
  if (!photo) return { previewKey: null };

  const ext = path.extname(photo.filename).toLowerCase() || ".mp4";
  const tmpIn = await downloadToTempFile(photo.storageKey, ext);
  if (!tmpIn) return { previewKey: null };

  const tmpOut = path.join(os.tmpdir(), `ms-preview-${photoId}.mp4`);
  const wmPath = await getWatermarkTempPath();

  try {
    let cmd = ffmpeg(tmpIn);

    if (wmPath) {
      cmd = cmd
        .input(wmPath)
        .complexFilter([
          "[0:v]scale='min(1280,iw)':-2[scaled]",
          "[1:v]scale=iw*0.30:-1,format=rgba,colorchannelmixer=aa=0.45[wm]",
          "[scaled][wm]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2:format=auto[out]",
        ], "out")
        .outputOptions(["-map", "0:a?"]);
    } else {
      // No watermark image — just transcode to H.264 so the browser can play it
      cmd = cmd.videoFilter("scale='min(1280,iw)':-2");
    }

    cmd.outputOptions([
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "28",
      "-c:a", "aac",
      "-b:a", "96k",
      "-movflags", "+faststart",
    ]).output(tmpOut);

    await runFfmpeg(cmd);

    // Remove previous preview if any
    if (photo.previewKey) {
      if (isS3Key(photo.previewKey)) await deleteS3Objects([photo.previewKey]).catch(() => null);
      else {
        const supabase = getAdminClient();
        if (supabase) await supabase.storage.from("photos").remove([photo.previewKey]).catch(() => null);
      }
    }

    const previewKey = `previews/${photo.id}.mp4`;
    await putS3Object(previewKey, fs.readFileSync(tmpOut), "video/mp4");
    await db.photo.update({ where: { id: photoId }, data: { previewKey } });

    console.log(`[VideoWatermark] photoId=${photoId} done`);
    return { previewKey };
  } catch (err) {
    console.error(`[VideoWatermark] Error for photoId=${photoId}:`, err);
    return { previewKey: null };
  } finally {
    for (const f of [tmpIn, tmpOut, wmPath]) {
      if (f) try { fs.unlinkSync(f); } catch { /* ignore */ }
    }
  }
}

// ── Helpers for consumers (re-exported from video-utils to avoid bundling ffmpeg) ──
export { VIDEO_EXTENSIONS, VIDEO_MIME_TYPES, isVideoFilename, isVideoMimeType } from "~/lib/video-utils";
