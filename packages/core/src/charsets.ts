const full = Array.from({ length: 95 }, (_, i) => String.fromCharCode(0x20 + i))
const simple = [' ', '.', ':', '-', '=', '+', '*', '#', '%', '@']
const blocks = [' ', '░', '▒', '▓', '█', '▄', '▀', '▌', '▐']
const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

export const CHARSETS = { full, simple, blocks, digits } as const
