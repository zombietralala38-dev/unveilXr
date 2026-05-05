// obfuscator_final.js — 25KB / 45KB | 70% VM+protecciones, 30% junk real | múltiples VMs anidadas

const HEADER = '--[[unveilX MultiVM v2]]'

const usedNames = new Set()
const LUA_KEYWORDS = new Set([
  'and','break','do','else','elseif','end','false','for','function','if','in',
  'local','nil','not','or','repeat','return','then','true','until','while','goto'
])

function genName(prefix = '_') {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let name
  do {
    name = prefix + chars[Math.floor(Math.random() * chars.length)]
    for (let i = 0; i < 7; i++) name += chars[Math.floor(Math.random() * chars.length)]
  } while (usedNames.has(name) || LUA_KEYWORDS.has(name))
  usedNames.add(name)
  return name
}

// ---------- Generador de basura REAL (sin math, sin ;;;) ----------
function generateJunk(sizeBytes) {
  let junk = ''
  const templates = [
    `local ${genName('s')}="${Math.random().toString(36).slice(2,8)}" `,
    `local ${genName('t')}={} for _=1,${Math.floor(Math.random()*3)+1} do ${genName('t')}[_]=_ end `,
    `local function ${genName('fn')}() return end `,
    `if false then local ${genName('c')}=1 end `,
    `for ${genName('i')}=1,1 do local _=${genName('x')} end `,
    `pcall(function() end) `
  ]
  while (Buffer.byteLength(junk, 'utf8') < sizeBytes) {
    junk += templates[Math.floor(Math.random() * templates.length)]()
  }
  return junk.substring(0, sizeBytes)
}

// ---------- Conversión string → array Lua de bytes ----------
function stringToByteArrayLiteral(str) {
  const bytes = []
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i))
  }
  return `{${bytes.join(',')}}`
}

// ---------- Construir código interno hiper‑ofuscado ----------
function buildProtectedInner(payload) {
  // Mensaje "I really like Rick and Morty" en bytes
  const msgBytes = []
  const msg = "I really like Rick and Morty"
  for (let i = 0; i < msg.length; i++) msgBytes.push(msg.charCodeAt(i))

  const msgArr = genName('msgArr')
  const msgVar = genName('msg')
  let code = `local ${msgArr}=${stringToByteArrayLiteral(msg)} local ${msgVar}="" for i=1,#${msgArr} do ${msgVar}=${msgVar}..string.char(${msgArr}[i]) end `

  // Anti-debug (7 segundos) – construimos os.clock/tick sin texto claro
  const oscBytes = [111,115,46,99,108,111,99,107] // os.clock
  const tickBytes = [116,105,99,107] // tick
  const oscStrArr = genName('oscArr')
  const tickStrArr = genName('tickArr')
  const getTimeFn = genName('gt')
  code += `local ${oscStrArr}=${stringToByteArrayLiteral(String.fromCharCode(...oscBytes))} local ${tickStrArr}=${stringToByteArrayLiteral(String.fromCharCode(...tickBytes))} `
  code += `local ${getTimeFn}=nil pcall(function() local f=loadstring or load ${getTimeFn}=f("return "..${oscStrArr})() end) if not ${getTimeFn} then pcall(function() local f=loadstring or load ${getTimeFn}=f("return "..${tickStrArr})() end) end `
  code += `for ${genName('a')}=1,7 do local st=${getTimeFn}() repeat until ${getTimeFn}()-st>=1 end `

  // Anti-env logger (20) – ocultamos getfenv/_ENV y los nombres Logger, debug, sandbox
  const getfenvBytes = [103,101,116,102,101,110,118] // getfenv
  const envBytes = [95,69,78,86] // _ENV
  const loggerBytes = [76,111,103,103,101,114] // Logger
  const debugBytes = [100,101,98,117,103] // debug
  const sandboxBytes = [115,97,110,100,98,111,120] // sandbox
  for (let i = 0; i < 20; i++) {
    const getfenvVar = genName('gf')
    const envVar = genName('ev')
    const detect = genName('dt')
    code += `local ${getfenvVar}=pcall(function() return _G[string.char(${getfenvBytes.join(',')})] end) `
    code += `local ${envVar}=pcall(function() local e if ${getfenvVar} then e=_G[string.char(${getfenvBytes.join(',')})]() else e=_G[string.char(${envBytes.join(',')})] end return e end) `
    code += `if ${envVar} then `
    code += `local log=_G[string.char(${loggerBytes.join(',')})] local dbg=_G[string.char(${debugBytes.join(',')})] local sb=_G[string.char(${sandboxBytes.join(',')})] `
    code += `if ${envVar}[log] or ${envVar}[dbg] or ${envVar}[sb] then print(${msgVar})while true do end end `
    code += `end `
  }

  // Anti-tamper (7) – comprueba longitud de tostring(función) para funciones clave
  const funcNames = [
    { name: 'print', bytes: [112,114,105,110,116], len: 28 },
    { name: 'math.floor', bytes: [109,97,116,104,46,102,108,111,111,114], len: 22 },
    { name: 'string.sub', bytes: [115,116,114,105,110,103,46,115,117,98], len: 22 },
    { name: 'table.insert', bytes: [116,97,98,108,101,46,105,110,115,101,114,116], len: 25 }
  ]
  for (let i = 0; i < 7; i++) {
    const target = funcNames[i % funcNames.length]
    const fnVar = genName('fn')
    const lenVar = genName('len')
    code += `local ${fnVar}=_G[string.char(${target.bytes.join(',')})] if ${fnVar} then `
    code += `local ${lenVar}=#tostring(${fnVar}) if ${lenVar}~=${target.len} then print(${msgVar})while true do end end `
    code += `end `
  }

  // Ejecutar payload original (también oculto en array de bytes)
  const payloadBytes = []
  for (let i = 0; i < payload.length; i++) payloadBytes.push(payload.charCodeAt(i))
  const payloadArr = genName('payArr')
  const payloadStr = genName('payStr')
  code += `local ${payloadArr}=${stringToByteArrayLiteral(payload)} local ${payloadStr}="" for i=1,#${payloadArr} do ${payloadStr}=${payloadStr}..string.char(${payloadArr}[i]) end `
  code += `local f=loadstring or load if f then xpcall(f(${payloadStr}),function()end) end`

  return code
}

// ---------- Envolver en una capa de VM (decodifica bytearray y ejecuta) ----------
function wrapInVM(innerCode) {
  const bytes = []
  for (let i = 0; i < innerCode.length; i++) bytes.push(innerCode.charCodeAt(i))
  const arrName = genName('arr')
  const resultVar = genName('res')
  const iVar = genName('i')
  const fnVar = genName('fn')
  return `local ${arrName}={${bytes.join(',')}} local ${resultVar}="" for ${iVar}=1,#${arrName} do ${resultVar}=${resultVar}..string.char(${arrName}[${iVar}]) end local ${fnVar}=loadstring or load if ${fnVar} then ${fnVar}(${resultVar})() end`
}

// ---------- Ofuscador principal ----------
function obfuscate(sourceCode, options = {}) {
  if (!sourceCode || typeof sourceCode !== 'string') return '--[[ERROR]]'

  usedNames.clear()

  let payload = sourceCode
  const httpMatch = sourceCode.match(
    /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  )
  if (httpMatch) {
    payload = `loadstring(game:HttpGet("${httpMatch[1]}"))()`
  }

  // Si es hub, se pide 45 KB y 7 capas; si no, 25 KB y 5 capas
  const isHub = options.targetSizeKB === 45
  const targetKB = isHub ? 45 : 25
  const totalBytes = targetKB * 1024
  const layers = isHub ? 7 : 5

  // Generar el código interno (protecciones + payload oculto)
  let inner = buildProtectedInner(payload)

  // Envolver en múltiples capas de VM
  for (let i = 0; i < layers; i++) {
    inner = wrapInVM(inner)
  }

  // Calcular cuánto ocupa el código protegido (sin junk)
  const strongPart = inner
  const strongSize = Buffer.byteLength(strongPart, 'utf8')

  // Calcular basura necesaria para llegar al peso exacto
  let junkSize = totalBytes - strongSize
  if (junkSize < 0) {
    // Si ya excede, recortamos para que quepa exactamente (poco probable)
    inner = inner.substring(0, totalBytes)
    junkSize = 0
  }

  const junk = generateJunk(junkSize)

  // Armar resultado final
  let finalOutput = HEADER + '\n' +
    'do ' +
    junk +
    inner +
    ' end'

  // Minificar: una sola línea
  finalOutput = finalOutput.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()

  // Ajuste fino de tamaño por si hay desviación de 1-2 bytes
  const finalSize = Buffer.byteLength(finalOutput, 'utf8')
  if (finalSize < totalBytes) {
    let pad = ''
    while (Buffer.byteLength(finalOutput + pad, 'utf8') < totalBytes) {
      pad += ' '
    }
    finalOutput += pad
  } else if (finalSize > totalBytes) {
    finalOutput = finalOutput.substring(0, totalBytes)
  }

  return finalOutput
}

module.exports = { obfuscate }
