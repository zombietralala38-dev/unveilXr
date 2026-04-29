const HEADER = `--[[ Code Protected by VVMer 3.0 ]]`

const IL_POOL = [
  "IIIIIIII1", "vvvvvv1", "vvvvvvvv2", "vvvvvv3", "IIlIlIlI1",
  "lvlvlvlv2", "I1", "l1", "v1", "v2", "v3", "II", "ll", "vv", "I2"
]

const HANDLER_POOL = [
  "KQ", "HF", "W8", "SX", "Rj", "nT", "pL", "qZ", "mV", "xB", "yC", "wD"
]

function generateIlName() {
  return IL_POOL[Math.floor(Math.random() * IL_POOL.length)] + Math.floor(Math.random() * 99999)
}

function pickHandlers(count) {
  const used = new Set()
  const result = []
  while (result.length < count) {
    const base = HANDLER_POOL[Math.floor(Math.random() * HANDLER_POOL.length)]
    const name = base + Math.floor(Math.random() * 99)
    if (!used.has(name)) { used.add(name); result.push(name) }
  }
  return result
}

// === BIT32 OPERATIONS ===
function bit32XOR(a, b) { return (a ^ b) >>> 0 }
function bit32AND(a, b) { return (a & b) >>> 0 }
function bit32OR(a, b)  { return (a | b) >>> 0 }
function bit32LSHIFT(a, shift) { return (a << shift) >>> 0 }
function bit32RSHIFT(a, shift) { return (a >>> shift) >>> 0 }

function encryptChunk(chunk, key, iv, index) {
  let encrypted = []
  for (let i = 0; i < chunk.length; i++) {
    const byte = chunk.charCodeAt(i)
    const keyByte = (key >>> (i % 4) * 8) & 0xFF
    const ivByte  = (iv  >>> ((i + index) % 4) * 8) & 0xFF
    let e1 = bit32XOR(byte, keyByte)
    let e2 = bit32XOR(e1, ivByte)
    let e3 = bit32LSHIFT((e2 + 127) & 0xFF, 1)
    let e4 = bit32OR(e3, bit32RSHIFT(e2, 7))
    encrypted.push(e4 & 0xFF)
  }
  return encrypted
}

// === STRING DETECTION & MAPPINGS ===
const MAPEO = {
  "ScreenGui":   "Aggressive Renaming",
  "Frame":       "String to Math",
  "TextLabel":   "Table Indirection",
  "TextButton":  "Mixed Boolean Arithmetic",
  "Humanoid":    "Dynamic Junk",
  "Player":      "Fake Flow",
  "RunService":  "Virtual Machine",
  "TweenService":"Fake Flow",
  "Players":     "Fake Flow"
}

function detectAndApplyMappings(code) {
  let modified = code, headers = ""
  for (const [word, tech] of Object.entries(MAPEO)) {
    const regex = new RegExp(`\\b${word}\\b`, "g")
    if (regex.test(modified)) {
      let replacement = `"${word}"`
      if (tech.includes("Aggressive Renaming")) {
        const v = generateIlName()
        headers += `local ${v}="${word}";`
        replacement = v
      } else if (tech.includes("Mixed Boolean Arithmetic")) {
        replacement = `(true and "${word}")`
      }
      regex.lastIndex = 0
      modified = modified.replace(regex, () => `game[${replacement}]`)
    }
  }
  return headers + modified
}

// === MANGLING ===
function mangleStatements(code) {
  return code.replace(/\n/g, ' ').replace(/;/g, ' ')
}

// === RUNTIME STRING (XOR encoding) ===
function runtimeString(str) {
  const bytes = str.split('').map(c => {
    const xored = bit32XOR(c.charCodeAt(0), 0xAA)
    return `bit32.bxor(${xored},0xAA)`
  })
  return `string.char(${bytes.join(',')})`
}

// === CONTROL FLOW FLATTENING ===
function applyCFF(blocks) {
  const stateVar = generateIlName()
  let lua = `local ${stateVar}=1 while true do `
  for (let i = 0; i < blocks.length; i++) {
    if (i === 0) lua += `if ${stateVar}==1 then ${blocks[i]} ${stateVar}=2 `
    else lua += `elseif ${stateVar}==${i + 1} then ${blocks[i]} ${stateVar}=${i + 2} `
  }
  lua += `elseif ${stateVar}==${blocks.length + 1} then break end end `
  return lua
}

// === MÁQUINA VIRTUAL PRINCIPAL ===
function buildVM(payloadStr) {
  const STACK = generateIlName()
  const KEY   = generateIlName()
  const IV    = generateIlName()
  const POOL  = generateIlName()
  const ORDER = generateIlName()

  const masterKey = Math.floor(Math.random() * 0xFFFFFFFF)
  const initIV    = Math.floor(Math.random() * 0xFFFFFFFF)

  let vmCore = `local ${STACK}={} local ${KEY}=${masterKey} local ${IV}=${initIV} `

  const chunkSize = 15
  let realChunks = []
  for (let i = 0; i < payloadStr.length; i += chunkSize) {
    realChunks.push(payloadStr.slice(i, i + chunkSize))
  }

  let poolVars = [], realOrder = []
  let totalChunks = realChunks.length * 3
  let currentReal = 0

  for (let i = 0; i < totalChunks; i++) {
    const memName = generateIlName()
    poolVars.push(memName)

    if (currentReal < realChunks.length && (Math.random() > 0.45 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1)
      const chunk = realChunks[currentReal]
      const encrypted = encryptChunk(chunk, masterKey, initIV, currentReal)
      vmCore += `local ${memName}={${encrypted.join(',')}} `
      currentReal++
    } else {
      const fakeLen = Math.floor(Math.random() * 20) + 5
      const fakeBytes = Array.from({ length: fakeLen }, () => Math.floor(Math.random() * 256))
      vmCore += `local ${memName}={${fakeBytes.join(',')}} `
    }
  }

  vmCore += `local ${POOL}={${poolVars.join(',')}} `
  vmCore += `local ${ORDER}={${realOrder.join(',')}} `

  const byteVar = generateIlName()
  const idxVar  = generateIlName()

  vmCore += `for _,${idxVar} in ipairs(${ORDER}) do for _,${byteVar} in ipairs(${POOL}[${idxVar}]) do `
  vmCore += `table.insert(${STACK},string.char(bit32.band(bit32.bxor(${byteVar},${KEY}),0xFF))) end end `
  vmCore += `local _e=table.concat(${STACK}) ${STACK}=nil `

  const ASSERT     = `getfenv()[${runtimeString("assert")}]`
  const LOADSTRING = `getfenv()[${runtimeString("loadstring")}]`
  const GAME       = `getfenv()[${runtimeString("game")}]`
  const HTTPGET    = runtimeString("HttpGet")

  if (payloadStr.includes("http")) {
    vmCore += `${ASSERT}(${LOADSTRING}(${GAME}[${HTTPGET}](${GAME},_e)))() `
  } else {
    vmCore += `${ASSERT}(${LOADSTRING}(_e))() `
  }

  return vmCore
}

// === WRAPPER CON DISPATCH + CFF ===
function buildSingleWrapper(innerCode, handlerCount) {
  const handlers  = pickHandlers(handlerCount)
  const realIdx   = Math.floor(Math.random() * handlerCount)
  const DISPATCH  = generateIlName()

  let out = `local lM={} `

  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx) {
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${innerCode} end `
    } else {
      out += `local ${handlers[i]}=function(lM) local lM=lM; return nil end `
    }
  }

  out += `local ${DISPATCH}={`
  for (let i = 0; i < handlers.length; i++) {
    out += `[${i + 1}]=${handlers[i]},`
  }
  out += `} `

  const execBlocks = handlers.map((_, i) => `${DISPATCH}[${i + 1}](lM)`)
  out += applyCFF(execBlocks)
  return out
}

function build2xVM(payloadStr) {
  let vm = buildVM(payloadStr)
  const handlerCount = Math.floor(Math.random() * 2) + 4
  vm = buildSingleWrapper(vm, handlerCount)
  return vm
}

// === PROTECCIONES ANTI-DEBUG ===
function getProtections() {
  const antiDebuggers =
    `local _adT=os.clock() for _=1,150000 do end if os.clock()-_adT>5.0 then while true do end end ` +
    `if debug~=nil and debug.getinfo then local _i=debug.getinfo(1) if _i.what~="main" and _i.what~="Lua" then while true do end end end ` +
    `local _ok,_e=pcall(function() error("__v") end) if not string.find(tostring(_e),"__v") then while true do end end ` +
    `if getmetatable(_G)~=nil then while true do end end ` +
    `if type(print)~="function" then while true do end end `

  const rawTampers = [
    `if math.pi<3.14 or math.pi>3.15 then _err() end`,
    `if bit32 and bit32.bxor(10,5)~=15 then _err() end`,
    `if type(tostring)~="function" then _err() end`,
    `if not string.match("chk","^c.*k$") then _err() end`,
    `if type(coroutine.create)~="function" then _err() end`,
    `if type(table.concat)~="function" then _err() end`,
    `local _tm1=os.time() local _tm2=os.time() if _tm2<_tm1 then _err() end`,
    `if math.abs(-10)~=10 then _err() end`,
    `if gcinfo and gcinfo()<0 then _err() end`,
    `if type(next)~="function" then _err() end`,
    `if string.len("a")~=1 then _err() end`,
    `if type(table.insert)~="function" then _err() end`,
    `if string.byte("Z",1)~=90 then _err() end`,
    `if math.floor(-1/10)~=-1 then _err() end`,
    `if (true and 1 or 2)~=1 then _err() end`,
    `if type(1)~="number" then _err() end`,
    `if type(pcall)~="function" then _err() end`
  ]

  let guards = ""
  for (let t of rawTampers) {
    const fnName  = generateIlName()
    const errName = generateIlName()
    const injected = t.replace("_err()", `${errName}("!")`)
    guards += `local ${fnName}=function() local ${errName}=error ${injected} end ${fnName}() `
  }

  return antiDebuggers + guards
}

// === OBFUSCADOR PRINCIPAL ===
function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'

  const isLoadstringRegex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const match = sourceCode.match(isLoadstringRegex)

  let payload
  if (match) {
    payload = match[1]
  } else {
    payload = detectAndApplyMappings(mangleStatements(sourceCode))
  }

  const protections = getProtections()
  const finalVM     = build2xVM(payload)

  const result = `${HEADER} ${protections} ${finalVM}`
  return result.replace(/\s+/g, " ").trim()
}

module.exports = { obfuscate }
