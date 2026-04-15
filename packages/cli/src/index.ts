#!/usr/bin/env node
import { program } from 'commander'
import { writeFile, stat, readdir } from 'node:fs/promises'
import { extname, join } from 'node:path'
import sharp from 'sharp'
import {
  render,
  precomputeShapeVectors,
  CHARSETS,
  PRESETS,
  renderToSvg,
  renderToHtml,
} from '@novaglow/core'
import type { ImageData, CharShape } from '@novaglow/core'
import { createCharRenderer } from './bitmap.js'
import { renderToImageBuffer } from './encode-image.js'

async function loadImage(filePath: string): Promise<ImageData> {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return {
    data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
    width: info.width,
    height: info.height,
  }
}

function getCharShapes(charsetName: string, customChars?: string): CharShape[] {
  const chars = customChars
    ? [...customChars]
    : CHARSETS[charsetName as keyof typeof CHARSETS] ?? CHARSETS.full

  const renderer = createCharRenderer(24, 2.0)
  return precomputeShapeVectors(chars, renderer.renderChar, renderer.cellW, renderer.cellH)
}

function detectFormat(outputPath: string): string {
  const ext = extname(outputPath).toLowerCase()
  const map: Record<string, string> = {
    '.svg': 'svg', '.html': 'html', '.htm': 'html',
    '.png': 'png', '.jpg': 'jpeg', '.jpeg': 'jpeg',
  }
  return map[ext] ?? 'png'
}

program
  .name('novaglow')
  .description('ASCII art renderer using shape-vector matching')
  .version('0.1.0')

program
  .command('render <input>')
  .description('Render image or directory to ASCII art')
  .option('-o, --output <path>', 'Output file path (format detected by extension)')
  .option('-c, --cols <number>', 'Output columns', '80')
  .option('--contrast <number>', 'Contrast enhancement 0.0–1.0', '0.3')
  .option('--invert', 'Invert lightness')
  .option('--color', 'Preserve source colors')
  .option('--preset <name>', 'Style preset', 'classic')
  .option('--chars <string>', 'Custom character set')
  .option('--fps <number>', 'Video output FPS', '10')
  .action(async (input: string, opts) => {
    const presetName = opts.preset
    const preset = PRESETS[presetName]
    const charsetName = preset?.charset ?? 'full'
    // Apply preset defaults, let CLI flags override
    const colsNum = opts.cols !== '80' || !preset ? parseInt(opts.cols, 10) : (preset.density ? Math.round(80 * (8 / preset.density)) : parseInt(opts.cols, 10))
    const contrastNum = opts.contrast !== '0.3' || !preset ? parseFloat(opts.contrast) : preset.contrast
    const invertFlag = opts.invert ?? preset?.invert ?? false
    const colorFlag = opts.color ?? false
    if (!Number.isFinite(colsNum) || colsNum < 1) {
      console.error('Error: --cols must be a positive integer')
      process.exit(1)
    }
    if (!Number.isFinite(contrastNum) || contrastNum < 0 || contrastNum > 1) {
      console.error('Error: --contrast must be a number between 0 and 1')
      process.exit(1)
    }

    console.log('Precomputing character shapes...')
    const charShapes = getCharShapes(charsetName, opts.chars)
    console.log(`Ready (${charShapes.length} characters)`)

    const VIDEO_EXTS = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv']
    const ext = extname(input).toLowerCase()

    if (VIDEO_EXTS.includes(ext)) {
      const { extractFrames, composeMp4, cleanupFrames } = await import('./video.js')
      const { mkdtemp } = await import('node:fs/promises')
      const { tmpdir } = await import('node:os')
      const { join } = await import('node:path')

      const fps = parseInt(opts.fps ?? '10', 10)
      const outputPath = opts.output ?? input.replace(/\.[^.]+$/, '-novaglow.mp4')

      console.log('Extracting frames...')
      const { framesDir, frameCount } = await extractFrames(input, fps)
      console.log(`${frameCount} frames extracted`)

      const renderedDir = await mkdtemp(join(tmpdir(), 'novaglow-rendered-'))

      for (let i = 1; i <= frameCount; i++) {
        const framePath = join(framesDir, `frame-${String(i).padStart(5, '0')}.png`)
        const image = await loadImage(framePath)
        const result = render(image, {
          cols: colsNum,
          contrast: contrastNum,
          invert: invertFlag,
          color: colorFlag,
          charShapes,
        })
        const buf = await renderToImageBuffer(result, {
          background: preset?.background ?? '#ffffff',
          defaultColor: preset?.color ?? '#000000',
        })
        const outFrame = join(renderedDir, `frame-${String(i).padStart(5, '0')}.png`)
        await writeFile(outFrame, buf)
        process.stdout.write(`\rRendering: ${i}/${frameCount}`)
      }
      console.log('')

      console.log('Composing MP4...')
      await composeMp4(renderedDir, outputPath, fps)
      await cleanupFrames(framesDir)
      await cleanupFrames(renderedDir)
      console.log(`Written to ${outputPath}`)
      return
    }

    const stats = await stat(input)
    if (stats.isDirectory()) {
      const files = await readdir(input)
      const imageFiles = files.filter((f) =>
        /\.(png|jpe?g|webp|tiff?|bmp)$/i.test(f),
      )
      const outDir = opts.output ?? input
      for (const file of imageFiles) {
        const outPath = join(outDir, file.replace(/\.[^.]+$/, '-novaglow.png'))
        await renderSingle(join(input, file), outPath, colsNum, contrastNum, invertFlag, colorFlag, preset, charShapes)
      }
    } else {
      await renderSingle(input, opts.output, colsNum, contrastNum, invertFlag, colorFlag, preset, charShapes)
    }
  })

async function renderSingle(
  inputPath: string,
  outputPath: string | undefined,
  cols: number,
  contrast: number,
  invert: boolean,
  color: boolean,
  preset: typeof PRESETS[string] | undefined,
  charShapes: CharShape[],
) {
  const image = await loadImage(inputPath)
  const result = render(image, {
    cols,
    contrast,
    invert,
    color,
    charShapes,
  })

  const format = outputPath ? detectFormat(outputPath) : 'png'
  const bg = preset?.background ?? '#ffffff'
  const fg = preset?.color ?? '#000000'

  let output: string | Buffer
  switch (format) {
    case 'svg':
      output = renderToSvg(result, { background: bg, defaultColor: fg })
      break
    case 'html':
      output = renderToHtml(result, { background: bg, defaultColor: fg })
      break
    case 'png':
    case 'jpeg':
      output = await renderToImageBuffer(result, {
        background: bg, defaultColor: fg,
        format: format as 'png' | 'jpeg',
      })
      break
    default:
      output = renderToSvg(result, { background: bg, defaultColor: fg })
  }

  if (outputPath) {
    await writeFile(outputPath, output)
    console.log(`Written to ${outputPath}`)
  } else {
    const defaultOut = inputPath.replace(/\.[^.]+$/, '-novaglow.png')
    await writeFile(defaultOut, output)
    console.log(`Written to ${defaultOut}`)
  }
}

program
  .command('presets')
  .description('List available presets')
  .action(() => {
    for (const [name, preset] of Object.entries(PRESETS)) {
      console.log(`  ${name.padEnd(12)} ${preset.label} — charset: ${preset.charset}, color: ${preset.color}`)
    }
  })

program.parse()
