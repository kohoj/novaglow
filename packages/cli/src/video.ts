import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const execFileAsync = promisify(execFile)

export async function extractFrames(
  videoPath: string,
  fps: number,
): Promise<{ framesDir: string; frameCount: number }> {
  const framesDir = await mkdtemp(join(tmpdir(), 'novaglow-frames-'))
  const pattern = join(framesDir, 'frame-%05d.png')

  await execFileAsync('ffmpeg', [
    '-i', videoPath,
    '-vf', `fps=${fps}`,
    pattern,
  ], { maxBuffer: 50 * 1024 * 1024 })

  const files = await readdir(framesDir)
  const frameFiles = files.filter((f) => f.endsWith('.png')).sort()

  return { framesDir, frameCount: frameFiles.length }
}

export async function composeMp4(
  framesDir: string,
  outputPath: string,
  fps: number,
): Promise<void> {
  const pattern = join(framesDir, 'frame-%05d.png')

  await execFileAsync('ffmpeg', [
    '-y',
    '-framerate', String(fps),
    '-i', pattern,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', '18',
    outputPath,
  ], { maxBuffer: 50 * 1024 * 1024 })
}

export async function cleanupFrames(framesDir: string): Promise<void> {
  await rm(framesDir, { recursive: true, force: true })
}
