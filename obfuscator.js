// obfuscator_heavy.js — VM Custom + Anti-Debug/Tamper/Env + Junk hasta 25/40KB

const HEADER = `--[[unveilX Protected Heavy]]`

const usedNames = new Set()
const LUA_KEYWORDS = new Set(['and','break','do','else','elseif','end','false','for','function','if','in','local','nil','not','or','repeat','return','then','true','until','while','goto'])

function genName(prefix='_') {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let name
  do {
    name = prefix + chars[Math.floor(Math.random() * chars.length)]
    for (let i = 0; i < 6; i++) {
      name += chars[Math.floor(Math.random() * chars.length)]
    }
  } while (usedNames.has(name) || LUA_KEYWORDS.has(name))
  usedNames.add(name)
  return name
}

// Base64 encoder
function base64Encode(str) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = '', i = 0
  while (i < str.length) {
    const a = str.charCodeAt(i++)
    const b = i < str.length ? str.charCodeAt(i++) : 0
    const c = i < str.length ? str.charCodeAt(i++) : 0
    const bitmap = (a << 16) | (b << 8) | c
    result += chars[(bitmap >> 18) & 63]
    result += chars[(bitmap >> 12) & 63]
    result += (i - 2 < str.length) ? chars[(bitmap >> 6) & 63] : '='
    result += (i - 1 < str.length) ? chars[bitmap & 63] : '='
  }
  return result
}

// Base64 decoder Lua
function createBase64Decoder() {
  const fnName = genName('b64d')
  return fnName, `local function ${fnName}(s)
local b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
local t={}
for i=0,63 do t[b:sub(i+1,i+1)]=i end
local r=""
local j=1
while j<=#s do
local c0=t[s:sub(j,j)]or 0
local c1=t[s:sub(j+1,j+1)]or 0
local c2=t[s:sub(j+2,j+2)]or 0
local c3=t[s:sub(j+3,j+3)]or 0
local n=((c0*64+c1)*64+c2)*64+c3
r=r..string.char(math.floor(n/65536)%256)
if s:sub(j+2,j+2)~="=" then r=r..string.char(math.floor(n/256)%256)end
if s:sub(j+3,j+3)~="=" then r=r..string.char(n%256)end
j=j+4
end
return r
end
return ${fnName}`
}

// Genera una cantidad masiva de código basura (junk) hasta alcanzar 'size' bytes
function generateJunk(size) {
  let junk = ''
  const templates = [
    () => {
      const a = genName('j'), b = genName('j')
      return `local ${a}=${Math.random()*1000|0} local ${b}=${a}*${Math.random()*100|0} ${a}=${a}+${b} `
    },
    () => {
      const a = genName('j')
      return `local ${a}={{},{}} for i=1,${Math.random()*10|0} do table.insert(${a}[1],i) end `
    },
    () => {
      const a = genName('j')
      return `if not pcall(function() local ${a}=debug and debug.getinfo end) then end `
    },
    () => {
      const a = genName('j'), b = genName('j')
      return `local ${a},${b}=${Math.random()*10|0},${Math.random()*10|0} if ${a}<${b} then ${a}=${b} end `
    }
  ]
  while (junk.length < size) {
    const idx = Math.floor(Math.random() * templates.length)
    junk += templates[idx]()
  }
  return junk.substring(0, size)
}

// Anti env logger (20 repeticiones, con mensaje)
function buildAntiEnvLogger(count) {
  let code = ''
  for (let i = 0; i < count; i++) {
    const envVar = genName('env')
    code += `
if pcall(function()
  local ${envVar}=getfenv and getfenv() or _ENV
  if ${envVar}.Logger or ${envVar}.debug or ${envVar}.sandbox then
    print("I really like Rick and Morty")
    while true do end
  end
end) then end
`
  }
  return code
}

// Anti tamper (7 repeticiones, con mensaje)
function buildAntiTamper(count) {
  const hashTargets = ['print', 'math.floor', 'string.sub', 'table.insert']
  let code = ''
  for (let i = 0; i < count; i++) {
    const target = hashTargets[i % hashTargets.length]
    const hashVar = genName('h')
    const funcVar = genName('fn')
    const expectedHash = Math.floor(Math.random() * 100000)
    code += `
local ${funcVar}=${target}
local ${hashVar}=0
if ${funcVar} then
  for j=1,#tostring(${funcVar}) do ${hashVar}=(${hashVar}+j)%${expectedHash} end
else
  ${hashVar}=${expectedHash+1}
end
if ${hashVar}~=${expectedHash} then
  print("I really like Rick and Morty")
  while true do end
end
`
  }
  return code
}

// Anti debugger (7 iteraciones de ~1s cada una)
function buildAntiDebug(count) {
  let code = ''
  for (let i = 0; i < count; i++) {
    const startVar = genName('st')
    code += `
local ${startVar}=pcall(function()return os.clock()end)and os.clock()or tick()
repeat until (pcall(function()return os.clock()end)and os.clock()or tick())-${startVar}>=1
`
  }
  return code
}

// Payload VM (decodifica y ejecuta)
function buildPayloadVM(payload) {
  const encoded = base64Encode(payload)
  const decFn = genName('dec')
  const payVar = genName('pay')
  const execFn = genName('exec')
  const result = genName('res')

  const decoderCode = `local function ${decFn}(s)
local b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
local t={}
for i=0,63 do t[b:sub(i+1,i+1)]=i end
local r=""
local j=1
while j<=#s do
local c0=t[s:sub(j,j)]or 0
local c1=t[s:sub(j+1,j+1)]or 0
local c2=t[s:sub(j+2,j+2)]or 0
local c3=t[s:sub(j+3,j+3)]or 0
local n=((c0*64+c1)*64+c2)*64+c3
r=r..string.char(math.floor(n/65536)%256)
if s:sub(j+2,j+2)~="=" then r=r..string.char(math.floor(n/256)%256)end
if s:sub(j+3,j+3)~="=" then r=r..string.char(n%256)end
j=j+4
end
return r
end`

  return `${decoderCode}
local ${payVar}="${encoded}"
local ${result}=${decFn}(${payVar})
local ${execFn}=loadstring or load
if ${execFn} then
xpcall(${execFn}(${result}),function()end)
end`
}

/**
 * @param {string} sourceCode
 * @param {object} options - { targetSizeKB: 25 }
 */
function obfuscate(sourceCode, options = {}) {
  if (!sourceCode || typeof sourceCode !== 'string') {
    return '--[[ERROR: Invalid source code]]'
  }

  usedNames.clear()

  let payload = sourceCode
  const httpMatch = sourceCode.match(
    /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  )
  if (httpMatch) {
    payload = `loadstring(game:HttpGet("${httpMatch[1]}"))()`
  }

  const targetKB = options.targetSizeKB || 25
  const targetBytes = targetKB * 1024

  // Construir partes fijas
  const header = HEADER
  const envelopeStart = 'do '
  const envelopeEnd = ' end'

  const protections = buildAntiEnvLogger(20) +
                      buildAntiTamper(7) +
                      buildAntiDebug(7)

  const payloadVM = buildPayloadVM(payload)

  // Calcular el tamaño de todo menos la basura extra
  const fixedPart = header + envelopeStart + protections + payloadVM + envelopeEnd
  const fixedSize = Buffer.byteLength(fixedPart, 'utf8') // asumimos entorno Node, sino usar .length

  // Generar basura para rellenar hasta el target
  let junkSize = targetBytes - fixedSize
  if (junkSize < 0) junkSize = 0
  const junkCode = generateJunk(junkSize)

  // Armar resultado final e insertar basura antes del payload
  let finalOutput = header + '\n' +
    envelopeStart +
    junkCode +
    protections +
    payloadVM +
    envelopeEnd

  // Minificar
  finalOutput = finalOutput.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()

  // Redondear al tamaño deseado (por si nos pasamos)
  if (Buffer.byteLength(finalOutput, 'utf8') > targetBytes) {
    finalOutput = finalOutput.substring(0, targetBytes)
  }

  return finalOutput
}

module.exports = { obfuscate }
