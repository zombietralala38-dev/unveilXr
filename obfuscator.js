// obfuscator.js — unveilX protected
const HEADER = `--[[ Protected by unveilX | https://discord.gg/DU35Mhyhq ]]`

// ─── Name generator ────────────────────────────────────────────────────────
const usedNames = new Set()
function genName(prefix = '_') {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let name
  do {
    name = prefix
    const len = 10 + Math.floor(Math.random() * 12)
    for (let i = 0; i < len; i++) name += chars[Math.floor(Math.random() * chars.length)]
    name += Math.floor(Math.random() * 99999999)
  } while (usedNames.has(name) || isLuaKeyword(name))
  usedNames.add(name)
  return name
}

const LUA_KEYWORDS = new Set([
  'and','break','do','else','elseif','end','false','for','function',
  'if','in','local','nil','not','or','repeat','return','then','true',
  'until','while','goto'
])
function isLuaKeyword(n) { return LUA_KEYWORDS.has(n) }

// ─── Base64 JS encoder ─────────────────────────────────────────────────────
function base64Encode(str) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = '', i = 0
  while (i < str.length) {
    const a = str.charCodeAt(i++)
    const b = i < str.length ? str.charCodeAt(i++) : 0
    const c = i < str.length ? str.charCodeAt(i++) : 0
    const bm = (a << 16) | (b << 8) | c
    result += chars[(bm >> 18) & 63]
    result += chars[(bm >> 12) & 63]
    result += (i - 2 < str.length) ? chars[(bm >> 6) & 63] : '='
    result += (i - 1 < str.length) ? chars[bm & 63] : '='
  }
  return result
}

// ─── Lua base64 decoder (fixed, no bit lib — uses pure math) ──────────────
function luaB64Decoder(fnName) {
  // Pure Lua, no bit.rshift/band needed — Roblox compatible
  return `local function ${fnName}(s)` +
    `local b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"` +
    `local t={}` +
    `for i=0,#b-1 do t[b:sub(i+1,i+1)]=i end` +
    `local r=""` +
    `local j=1` +
    `while j<=#s do` +
      `local c0=t[s:sub(j,j)]or 0` +
      `local c1=t[s:sub(j+1,j+1)]or 0` +
      `local c2=t[s:sub(j+2,j+2)]or 0` +
      `local c3=t[s:sub(j+3,j+3)]or 0` +
      `local n=((c0*64+c1)*64+c2)*64+c3` +
      `r=r..string.char(math.floor(n/65536)%256)` +
      `if s:sub(j+2,j+2)~="=" then r=r..string.char(math.floor(n/256)%256)end` +
      `if s:sub(j+3,j+3)~="=" then r=r..string.char(n%256)end` +
      `j=j+4` +
    `end` +
    `return r` +
  `end `
}

// ─── Opaque VM dispatch ─────────────────────────────────────────────────────
// Wraps innerCode in a dispatch table. The real slot is hidden among fakes.
// Uses a NUMERIC opaque predicate: (n * n - n * (n-1)) always == n
// So dispatch index is always == realIdx+1, but looks like math to a reverser.
function buildDispatchVM(innerCode) {
  const dispatchN  = genName('D')
  const loopFlag   = genName('L')
  const slotCount  = 5 + Math.floor(Math.random() * 4)   // 5-8 slots
  const realIdx    = Math.floor(Math.random() * slotCount) // 0-based

  // Junk slot bodies — all valid Lua, do nothing meaningful
  const junk = () => {
    const v = genName('j')
    const n = Math.floor(Math.random() * 9999)
    return `local ${v}=${n}+${n}-${n}`
  }

  let out = `local ${dispatchN}={} `

  for (let i = 0; i < slotCount; i++) {
    if (i === realIdx) {
      out += `${dispatchN}[${i + 1}]=function() ${innerCode} end `
    } else {
      out += `${dispatchN}[${i + 1}]=function() ${junk()} end `
    }
  }

  // Opaque predicate: n*(n-(n-1)) where n = realIdx+1 → always realIdx+1
  const n = realIdx + 1
  const pred = `(${n}*(${n}-(${n}-1)))` // == n always

  out += `local ${loopFlag}=true `
  out += `while ${loopFlag} do `
  out += `${dispatchN}[${pred}]() `
  out += `${loopFlag}=false `
  out += `end `

  return `do ${out} end`
}

// Nest N layers of dispatch VMs around innerCode
function nestVM(innerCode, depth) {
  let code = innerCode
  for (let i = 0; i < depth; i++) code = buildDispatchVM(code)
  return code
}

// ─── Anti-env logger checks (100 unique, recursive) ────────────────────────
function buildAntiEnvChecks() {
  const MSGS = [
    'I really like Rick and Morty',
    'I really enjoy Rick and Morty',
    'I truly love Rick and Morty',
    'I absolutely adore Rick and Morty',
    'Rick and Morty is simply amazing',
    'Rick and Morty completely rocks',
    'Rick and Morty is truly incredible',
    'I cannot stop watching Rick and Morty',
    'Rick and Morty genuinely changed my life',
    'I recommend Rick and Morty to absolutely everyone',
  ]

  let out = ''

  for (let i = 0; i < 100; i++) {
    const msg    = MSGS[i % MSGS.length]
    const enc    = base64Encode(msg + '#' + i)

    // Fixed names — each used exactly once per block
    const fnHash  = genName('fh')
    const fnEnv   = genName('fe')
    const vSeed   = genName('vs')
    const vHash   = genName('vh')
    const vKey    = genName('vk')
    const vIter   = genName('vi')
    const vResult = genName('vr')

    // Recursive hash over the base64-encoded message
    // hash(s, depth) → recurses up to 8 times, each with multiplier (i+2)
    // Result is always > 0, so `if vResult > 0` is always true = anti-debug trap
    const block =
      `do ` +
        `local ${vSeed}="${enc}" ` +
        `local function ${fnHash}(s,d) ` +
          `if d<=0 then ` +
            `local ${vHash}=0 ` +
            `for ${vIter}=1,#s do ` +
              `${vHash}=(${vHash}+string.byte(s,${vIter})*${i + 2})%2147483647 ` +
            `end ` +
            `return ${vHash} ` +
          `end ` +
          `return ${fnHash}(s,d-1)+1 ` +
        `end ` +
        `local ${vResult}=${fnHash}(${vSeed},${(i % 8) + 2}) ` +
        // Anti-env: if the key already exists in _G, something hooked us
        `local ${vKey}="${enc}_${i}_env" ` +
        `local function ${fnEnv}() ` +
          `if rawget(_G,${vKey})~=nil then ` +
            `for ${vIter}=1,9999 do end ` + // burn CPU silently
          `end ` +
          `rawset(_G,${vKey},${vResult}) ` +
        `end ` +
        `${fnEnv}() ` +
      `end `

    // Wrap each check in its own 2-layer VM so they can't be skipped easily
    out += nestVM(block, 2)
  }

  return out
}

// ─── Main payload execution via custom VM interpreter ──────────────────────
// Encodes sourceCode as base64, splits into N chunks, each chunk stored
// in a dispatch VM. On execution, chunks are decoded and concatenated.
// Final code is executed via a VM instruction table — no raw loadstring visible.
function buildPayloadVM(payload) {
  // Names for the VM interpreter
  const vmTable   = genName('VM')
  const instrTbl  = genName('IT')
  const regTbl    = genName('RT')
  const pcReg     = genName('PC')
  const runFn     = genName('RN')
  const b64Fn     = genName('BD')
  const concatVar = genName('CV')
  const chunkTbl  = genName('CK')
  const idxVar    = genName('IX')
  const loadFn    = genName('LF')
  const execFn    = genName('EF')

  // Split payload into 15 base64-encoded chunks
  const CHUNK_COUNT = 15
  const chunkSize = Math.ceil(payload.length / CHUNK_COUNT)
  const chunks = []
  for (let i = 0; i < CHUNK_COUNT; i++) {
    const slice = payload.slice(i * chunkSize, (i + 1) * chunkSize)
    if (slice.length > 0) chunks.push(base64Encode(slice))
  }

  // VM opcodes: each opcode index maps to a chunk assignment
  // OP 0x10 = assign chunk to register
  // OP 0x20 = concat all registers
  // OP 0x30 = load & execute
  // OP 0xFF = halt
  const opcodes = []
  for (let i = 0; i < chunks.length; i++) opcodes.push(0x10, i)
  opcodes.push(0x20)
  opcodes.push(0x30)
  opcodes.push(0xFF)

  // Each chunk stored in its own nested dispatch VM so they're not visible
  let chunkSetup = `local ${chunkTbl}={} `
  for (let i = 0; i < chunks.length; i++) {
    const inner = `${chunkTbl}[${i}]="${chunks[i]}"`
    chunkSetup += nestVM(inner, 3) + ' '
  }

  // VM interpreter — all written in Lua, no loadstring visible at top level
  const vmCode =
    `local ${regTbl}={} ` +
    `local ${pcReg}=1 ` +
    `local ${instrTbl}={${opcodes.join(',')}} ` +
    luaB64Decoder(b64Fn) +
    `local ${vmTable}={} ` +

    // OP handlers
    `${vmTable}[0x10]=function(idx) ` +
      `${regTbl}[idx]=${b64Fn}(${chunkTbl}[idx]) ` +
    `end ` +

    `${vmTable}[0x20]=function() ` +
      `${concatVar}="" ` +
      `for ${idxVar}=0,${chunks.length - 1} do ` +
        `${concatVar}=${concatVar}..(${regTbl}[${idxVar}]or"") ` +
      `end ` +
    `end ` +

    // OP 0x30: load the concatenated code as a function and execute it
    // loadstring is aliased through a table key so it's not a raw keyword call
    `local ${loadFn}=(function() local t={} t[1]=loadstring or load return t[1] end)() ` +
    `${vmTable}[0x30]=function() ` +
      `local ${execFn}=${loadFn}(${concatVar}) ` +
      `if ${execFn} then xpcall(${execFn},function()end) end ` +
    `end ` +

    `${vmTable}[0xFF]=function() ${pcReg}=#${instrTbl}+1 end ` +

    // Run loop
    `local ${runFn}=true ` +
    `while ${runFn} and ${pcReg}<=#${instrTbl} do ` +
      `local op=${instrTbl}[${pcReg}] ` +
      `${pcReg}=${pcReg}+1 ` +
      `if op==0x10 then ` +
        `local arg=${instrTbl}[${pcReg}] ` +
        `${pcReg}=${pcReg}+1 ` +
        `${vmTable}[0x10](arg) ` +
      `elseif op==0x20 then ${vmTable}[0x20]() ` +
      `elseif op==0x30 then ${vmTable}[0x30]() ` +
      `elseif op==0xFF then ${runFn}=false ` +
      `end ` +
    `end `

  // Wrap the whole VM in nested dispatch layers
  return chunkSetup + nestVM(vmCode, 4)
}

// ─── Public API ────────────────────────────────────────────────────────────
function obfuscate(sourceCode) {
  if (!sourceCode || typeof sourceCode !== 'string') return '--ERROR'

  usedNames.clear()

  // Support bare loadstring(game:HttpGet("url"))() pattern
  let payload = sourceCode
  const httpMatch = sourceCode.match(
    /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  )
  if (httpMatch) payload = `loadstring(game:HttpGet("${httpMatch[1]}")()`

  // Build output
  let out = HEADER + ' '
  out += 'do '
  out += buildAntiEnvChecks()
  out += buildPayloadVM(payload)
  out += ' end'

  // Minify
  return out.replace(/\s+/g, ' ').trim()
}

module.exports = { obfuscate }
