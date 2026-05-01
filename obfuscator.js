// Obfuscador UnveilX con anti-env logger integrado

const HEADER = `--[[ this code is protected by unveilX | https://discord.gg/DU35Mhyhq ]]`

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

const MAPEO = {
  "ScreenGui": "Aggressive Renaming",
  "Frame": "String to Math",
  "TextLabel": "Table Indirection",
  "TextButton": "Mixed Boolean Arithmetic",
  "Humanoid": "Dynamic Junk",
  "Player": "Fake Flow",
  "RunService": "Virtual Machine",
  "TweenService": "Fake Flow",
  "Players": "Fake Flow"
}

function detectAndApplyMappings(code) {
  let modified = code, headers = ""
  for (const [word, tech] of Object.entries(MAPEO)) {
    const regex = new RegExp(`\\b${word}\\b`, "g")
    if (regex.test(modified)) {
      let replacement = `"${word}"`
      if (tech.includes("Aggressive Renaming")) {
        const v = genName()
        headers += `local ${v}="${word}" `
        replacement = v
      } else if (tech.includes("String to Math")) {
        replacement = `string.char(${word.split('').map(c => c.charCodeAt(0)).join(',')})`
      } else if (tech.includes("Mixed Boolean Arithmetic")) {
        replacement = `((1==1 or true)and"${word}")`
      }
      regex.lastIndex = 0
      modified = modified.replace(regex, () => `game[${replacement}]`)
    }
  }
  return headers + modified
}

function generateStrongJunk(lines) {
  let block = ''
  for (let i = 0; i < lines; i++) {
    const r = Math.random()
    if (r < 0.15) {
      block += `if pcall(function() return #{1,2,3}==3 end) then local ${genName('_')}=${lightMath(1)} end `
    } else if (r < 0.3) {
      block += `pcall(function() local ${genName('x')}=#{[1]=true} return ${genName('x')} end) `
    } else if (r < 0.45) {
      block += `if pcall(function() return type(rawget)=='function' end) then local ${genName('y')}=true end `
    } else if (r < 0.6) {
      block += `for _=1,${lightMath(1)} do pcall(function() local ${genName('z')}='${genName('')}' end) end `
    } else if (r < 0.75) {
      block += `pcall(function() error() end) `
    } else {
      block += `local ${genName('u')}=pcall(function() return math.sqrt(${lightMath(144)}) end) `
    }
  }
  return block
}

function junkBlocks(totalLines, blockSize = 30) {
  let full = ''
  for (let i = 0; i < totalLines; i += blockSize) {
    const lines = Math.min(blockSize, totalLines - i)
    full += `do ${generateStrongJunk(lines)} end `
  }
  return full
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
  const totalChunks = realChunks.length * 3
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
      let fakeLen = Math.floor(Math.random() * 20) + 5
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
  const GAME = `getfenv()[${runtimeString("game")}]`
  const HTTPGET = runtimeString("HttpGet")
  if (payloadStr.includes("http"))
    vmCore += `${ASSERT}(${LOADSTRING}(${GAME}[${HTTPGET}](${GAME},_e)))() `
  else
    vmCore += `${ASSERT}(${LOADSTRING}(_e))() `

  return vmCore
}

function applyCFF(blocks, stateVar) {
  let lua = `local ${stateVar}=${lightMath(1)} `
  lua += `while true do `
  for (let i = 0; i < blocks.length; i++) {
    if (i === 0) lua += `if ${stateVar}==${lightMath(1)} then ${blocks[i]} ${stateVar}=${lightMath(2)} `
    else lua += `elseif ${stateVar}==${lightMath(i+1)} then ${blocks[i]} ${stateVar}=${lightMath(i+2)} `
  }
  lua += `elseif ${stateVar}==${lightMath(blocks.length+1)} then break end end `
  return lua
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
    const fakeJunk = junkBlocks(2, 5)
    if (i === realIdx)
      out += `local ${handlers[i]}=function(lM) local lM=lM ${fakeJunk} ${innerCode} end `
    else
      out += `local ${handlers[i]}=function(lM) local lM=lM ${fakeJunk} return nil end `
  }
  out += `local ${DISPATCH}={`
  for (let i = 0; i < handlers.length; i++) out += `[${lightMath(i+1)}]=${handlers[i]},`
  out += `} `

  const execBlocks = handlers.map((_, i) => `${DISPATCH}[${lightMath(i+1)}](lM)`)
  const stateVar = genName('s')
  out += applyCFF(execBlocks, stateVar)
  return `do ${out} end`
}

function build30xVM(payload) {
  let vm = buildTrueVM(payload)
  for (let i = 0; i < 29; i++)
    vm = buildSingleVM(vm, Math.floor(Math.random() * 3) + 3)
  return vm
}

// =============================================
// megaProtections - Anti-Env Logger & Integrity Checks
// =============================================
function megaProtections() {
  return `
local function antiEnv()
    -- 1. getgenv hook (muy común en executors)
    local hasGG = false
    pcall(function()
        if rawget and rawget(getfenv and getfenv() or _G, "getgenv") ~= nil then
            hasGG = true
        end
    end)
    if hasGG then error("E1") end

    -- 2. game.PlaceId debe funcionar sin errores
    if not pcall(function() return game.PlaceId end) then error("E2") end
    if type(game) ~= "userdata" or game.ClassName ~= "DataModel" then error("E3") end

    -- 3. Players/GetNameFromUserIdAsync (detecta proxies falsos)
    local ok, name = pcall(function()
        return game:GetService("Players"):GetNameFromUserIdAsync(1)
    end)
    if ok then
        local lp = game.Players.LocalPlayer
        if lp and lp.Name ~= name then error("E4") end
    else
        error("E5")
    end

    -- 4. Time‑based detection (task.wait / os.clock)
    if pcall(function() return os.clock end) and pcall(function() return task end) then
        local t = os.clock()
        task.wait(0.1)
        if (os.clock() - t) < 0.05 then
            error("E6")  -- wait demasiado corto -> hook en task
        end
    end

    -- 5. Funciones críticas sin reemplazar
    local crit = {"pcall","xpcall","error","loadstring","getfenv","rawget","type","select"}
    for _, fn in ipairs(crit) do
        local f = rawget and rawget(_G, fn) or _G[fn]
        if f and type(f) ~= "function" then error("E7") end
    end

    -- 6. Servicios básicos y tipos de datos coherentes
    local check = true
    pcall(function()
        local r = game:GetService("ReplicatedStorage")
        local b = game:GetService("Lighting").Brightness
        if type(b) ~= "number" then check = false end
        local ts = game:GetService("TextService"):GetTextSize("X", 14, Enum.Font.Arial, Vector2.new(100, 0))
        if typeof(ts) ~= "Vector2" or ts.X <= 0 then check = false end
        local guiInset = game:GetService("GuiService"):GetGuiInset()
        if typeof(guiInset) ~= "Vector2" then check = false end
    end)
    if not check then error("E8") end

    return true
end

local anti_ok, anti_err = pcall(antiEnv)
if not anti_ok then
    error("Env tampered: " .. tostring(anti_err), 0)
end
`;
}

// =============================================
// Obfuscate principal
// =============================================
function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'

  let payload = ""
  const regex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const match = sourceCode.match(regex)
  if (match) {
    payload = match[1]
  } else {
    payload = detectAndApplyMappings(sourceCode)
  }

  const protections = megaProtections()
  const junk = junkBlocks(80, 30)
  const vm = build30xVM(payload)

  const final = `${HEADER}
${protections}
${junk}
${vm}`
  return final.replace(/\s+/g, " ").trim()
}

module.exports = { obfuscate }
