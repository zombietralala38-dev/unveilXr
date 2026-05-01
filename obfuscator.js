const HEADER = `--[[ this code its protected by unveilX | https://discord.gg/DU35Mhyhq]]`

const usedNames = new Set()
function genName(prefix = '') {
  let name
  do {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'
    name = prefix
    const len = 5 + Math.floor(Math.random() * 8)
    for (let i = 0; i < len; i++) name += chars[Math.floor(Math.random() * chars.length)]
    name += Math.floor(Math.random() * 99999)
  } while (usedNames.has(name))
  usedNames.add(name)
  return name
}

function lightMath(n) {
  if (Math.random() < 0.85) return n.toString()
  const a = Math.floor(Math.random() * 21) + 4
  const b = Math.floor(Math.random() * 7) + 2
  return `((${n}+${a}-${a})*${b}/${b})`
}

function runtimeString(s) {
  return `string.char(${s.split('').map(c => lightMath(c.charCodeAt(0))).join(',')})`
}

// === ANTI-ENV SILENT VERIFICACIÓN ===
function getAntiEnvCheck() {
  return `
    local _anti_pass = true
    local function fail(msg) _anti_pass = false return nil end
    local ok
    local Players = game:GetService('Players')
    local lp = Players.LocalPlayer
    if typeof(lp) ~= 'Instance' then fail(101) end
    if type(lp.Kick) ~= 'function' then fail(102) end
    ok = pcall(function() lp:Kick('m') end); if not ok then fail(103) end
    ok = pcall(lp.Kick, lp, 'm2'); if not ok then fail(104) end
    ok = pcall(function() lp:Kick() end); if not ok then fail(105) end
    local part = Instance.new('Part')
    local sig = part:GetPropertyChangedSignal('Name')
    if typeof(sig) ~= 'RBXScriptSignal' then fail(201) end
    if type(sig.Connect) ~= 'function' then fail(202) end
    local con = sig:Connect(function() end)
    if typeof(con) ~= 'RBXScriptConnection' then fail(203) end
    if con.Connected ~= true then fail(204) end
    if type(con.Disconnect) ~= 'function' then fail(205) end
    con:Disconnect()
    if con.Connected ~= false then fail(206) end
    local rs = game:GetService('RunService')
    local hb = rs.Heartbeat
    if typeof(hb) ~= 'RBXScriptSignal' then fail(501) end
    local con5 = hb:Connect(function() end)
    if typeof(con5) ~= 'RBXScriptConnection' then fail(502) end
    con5:Disconnect()
    if con5.Connected ~= false then fail(503) end
    if typeof(game) ~= 'Instance' then fail(801) end
    if typeof(workspace) ~= 'Instance' then fail(802) end
    if typeof(part) ~= 'Instance' then fail(803) end
    if typeof(true) ~= 'boolean' then fail(804) end
    if typeof(false) ~= 'boolean' then fail(805) end
    if typeof('a') ~= 'string' then fail(806) end
    if typeof(1) ~= 'number' then fail(807) end
    if typeof(nil) ~= 'nil' then fail(808) end
    if typeof({}) ~= 'table' then fail(809) end
    return _anti_pass
  `
}

// === MANEJADOR DE LOADSTRING ===
function handleLoadstring(urlPayload) {
  const antiEnv = getAntiEnvCheck()
  
  return `
    (function()
      local _antiEnvCheck = function()
        ${antiEnv}
      end
      local _antiOk = pcall(_antiEnvCheck)
      if not _antiOk then return end
      
      local _game = getfenv()[${runtimeString("game")}]
      local _httpGet = _game[${runtimeString("HttpGet")}]
      local _assert = getfenv()[${runtimeString("assert")}]
      local _loadstring = getfenv()[${runtimeString("loadstring")}]
      
      local _payload = _httpGet(_game, ${runtimeString(urlPayload)})
      _assert(_loadstring(_payload))()
    end)()
  `
}

// === MANEJADOR DE CÓDIGO GRANDE (COMPRIMIDO) ===
function compressCode(code) {
  return code
    .replace(/--\[\[[\s\S]*?\]\]/g, '')
    .replace(/--[^\n]*\n/g, '\n')
    .replace(/\n\s*\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitIntoChunks(payload, chunkSize = 2048) {
  const chunks = []
  for (let i = 0; i < payload.length; i += chunkSize) {
    chunks.push(payload.slice(i, i + chunkSize))
  }
  return chunks
}

function buildChunkedVM(chunks) {
  const CHUNKS = genName('_chunks')
  const PAYLOAD = genName('_payload')
  const INDEX = genName('_idx')
  
  let vmCode = `local ${CHUNKS}={`
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const escapedChunk = chunk
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
    
    vmCode += `${runtimeString(escapedChunk)},`
  }
  
  vmCode += `} local ${PAYLOAD}='' for _=1,#${CHUNKS} do ${PAYLOAD}=${PAYLOAD}..${CHUNKS}[_] end `
  vmCode += `getfenv()[${runtimeString("assert")}](getfenv()[${runtimeString("loadstring")}](${PAYLOAD}))() `
  
  return vmCode
}

function buildTrueVM(payloadStr) {
  const STACK = genName()
  const chunkSize = 15
  const realChunks = []
  for (let i = 0; i < payloadStr.length; i += chunkSize)
    realChunks.push(payloadStr.slice(i, i + chunkSize))

  const seed = Math.floor(Math.random() * 200) + 50
  const saltVal = Math.floor(Math.random() * 250) + 1
  const KEY = genName()
  const SALT = genName()
  const memNames = []
  let realOrder = []
  let globalIndex = 0
  const totalChunks = realChunks.length * 2
  let currentReal = 0

  let vmCore = `local ${STACK}={} local ${KEY}=${lightMath(seed)} local ${SALT}=${lightMath(saltVal)} `

  for (let i = 0; i < totalChunks; i++) {
    const memName = genName()
    memNames.push(memName)
    if (currentReal < realChunks.length && (Math.random() > 0.5 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1)
      const chunk = realChunks[currentReal]
      let encBytes = []
      for (let j = 0; j < chunk.length; j++) {
        const enc = (chunk.charCodeAt(j) + seed + (globalIndex * saltVal)) % 256
        encBytes.push(lightMath(enc))
        globalIndex++
      }
      vmCore += `local ${memName}={${encBytes.join(',')}} `
      currentReal++
    } else {
      let fakeBytes = []
      let fakeLen = Math.floor(Math.random() * 15) + 3
      for (let j = 0; j < fakeLen; j++) fakeBytes.push(lightMath(Math.floor(Math.random() * 255)))
      vmCore += `local ${memName}={${fakeBytes.join(',')}} `
    }
  }

  const poolVar = genName('_pool')
  const ORDER = genName('_order')
  const idxVar = genName('_idx')
  const byteVar = genName('_byte')

  vmCore += `local ${poolVar}={${memNames.join(',')}} `
  vmCore += `local ${ORDER}={${realOrder.map(n => lightMath(n)).join(',')}} `
  vmCore += `local _gIdx=0 `
  vmCore += `for _,${idxVar} in ipairs(${ORDER}) do `
  vmCore += `for _,${byteVar} in ipairs(${poolVar}[${idxVar}]) do `
  vmCore += `table.insert(${STACK},string.char(math.floor((${byteVar}-${KEY}-_gIdx*${SALT})%256))) `
  vmCore += `_gIdx=_gIdx+1 end end `
  vmCore += `local _e=table.concat(${STACK}) ${STACK}=nil `

  const ASSERT = `getfenv()[${runtimeString("assert")}]`
  const LOADSTRING = `getfenv()[${runtimeString("loadstring")}]`
  vmCore += `${ASSERT}(${LOADSTRING}(_e))() `

  return vmCore
}

function generateStrongJunk(lines) {
  let block = ''
  for (let i = 0; i < lines; i++) {
    const r = Math.random()
    if (r < 0.25) {
      block += `if pcall(function() return #{1,2,3}==3 end) then local ${genName('_')}=${lightMath(1)} end `
    } else if (r < 0.50) {
      block += `pcall(function() local ${genName('x')}=#{[1]=true} return ${genName('x')} end) `
    } else if (r < 0.75) {
      block += `for _=1,${lightMath(1)} do pcall(function() local ${genName('z')}='${genName('')}' end) end `
    } else {
      block += `local ${genName('u')}=pcall(function() return math.sqrt(${lightMath(144)}) end) `
    }
  }
  return block
}

function junkBlocks(totalLines, blockSize = 25) {
  let full = ''
  for (let i = 0; i < totalLines; i += blockSize) {
    const lines = Math.min(blockSize, totalLines - i)
    full += `do ${generateStrongJunk(lines)} end `
  }
  return full
}

function buildSingleVM(innerCode, handlerCount) {
  const handlers = []
  const used = new Set()
  const bases = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  while (handlers.length < handlerCount) {
    const base = bases[Math.floor(Math.random() * bases.length)]
    const name = base + Math.floor(Math.random() * 99)
    if (!used.has(name)) { used.add(name); handlers.push(name) }
  }

  const realIdx = Math.floor(Math.random() * handlerCount)
  const DISPATCH = genName('d')
  let out = `local lM={} `
  for (let i = 0; i < handlers.length; i++) {
    const fakeJunk = junkBlocks(1, 3)
    if (i === realIdx)
      out += `local ${handlers[i]}=function(lM) local lM=lM ${fakeJunk} ${innerCode} end `
    else
      out += `local ${handlers[i]}=function(lM) local lM=lM ${fakeJunk} return nil end `
  }
  out += `local ${DISPATCH}={`
  for (let i = 0; i < handlers.length; i++) out += `[${lightMath(i+1)}]=${handlers[i]},`
  out += `} `

  const stateVar = genName('s')
  let lua = `local ${stateVar}=${lightMath(1)} while true do `
  for (let i = 0; i < handlers.length; i++) {
    if (i === 0) lua += `if ${stateVar}==${lightMath(1)} then ${DISPATCH}[${lightMath(i+1)}](lM) ${stateVar}=${lightMath(2)} `
    else lua += `elseif ${stateVar}==${lightMath(i+1)} then ${DISPATCH}[${lightMath(i+1)}](lM) ${stateVar}=${lightMath(i+2)} `
  }
  lua += `elseif ${stateVar}==${lightMath(handlers.length+1)} then break end end `
  
  return `do ${out}${lua} end`
}

function build10xVM(payload) {
  let vm = buildTrueVM(payload)
  for (let i = 0; i < 9; i++)
    vm = buildSingleVM(vm, Math.floor(Math.random() * 2) + 3)
  return vm
}

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'

  // Detectar si es loadstring
  const regex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const match = sourceCode.match(regex)
  
  let finalCode = HEADER
  
  if (match) {
    // Es loadstring - usar manejador de loadstring con anti-env
    const urlPayload = match[1]
    finalCode += handleLoadstring(urlPayload)
  } else {
    // Es código grande - comprimir y dividir en chunks
    const compressed = compressCode(sourceCode)
    const chunks = splitIntoChunks(compressed, 2048)
    
    const junk = junkBlocks(40, 20)
    let vmCode
    
    if (chunks.length > 1) {
      vmCode = buildChunkedVM(chunks)
    } else {
      vmCode = build10xVM(compressed)
    }
    
    finalCode += ` ${junk} ${vmCode}`
  }
  
  return finalCode.replace(/\s+/g, " ").trim()
}

module.exports = { obfuscate }
