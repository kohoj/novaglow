import type { Preset } from './types.js'

export const PRESETS: Record<string, Preset> = {
  classic: {
    name: 'classic',
    label: 'Classic',
    charset: 'full',
    color: '#000000',
    background: '#ffffff',
    contrast: 0.3,
    density: 8,
  },
  terminal: {
    name: 'terminal',
    label: 'Terminal',
    charset: 'full',
    color: '#33ff33',
    background: '#0a0a0a',
    contrast: 0.4,
    density: 6,
    invert: true,
  },
  minimal: {
    name: 'minimal',
    label: 'Minimal',
    charset: 'simple',
    color: '#888888',
    background: '#fafafa',
    contrast: 0.2,
    density: 14,
  },
  particle: {
    name: 'particle',
    label: 'Particle',
    charset: 'digits',
    color: '#333333',
    background: '#ffffff',
    contrast: 0.8,
    density: 8,
  },
}
