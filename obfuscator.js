const HEADER = '--[[THIS CODE ITS PROTECTED BY SEAK OBFUSCATOR FOR LUAU]]'
const IL_POOL = ["IIIIIIII1", "vvvvvv1", "vvvvvvvv2", "vvvvvv3", "IIlIlIlI1", "lvlvlvlv2", "I1","l1","v1","v2","v3","II","ll","vv", "I2"]
const HANDLER_POOL = ["KQ","HF","W8","SX","Rj","nT","pL","qZ","mV","xB","yC","wD"]

function generateIlName() {
  return IL_POOL[Math.floor(Math.random() * IL_POOL.length)] + Math.floor(Math.random() * 99999)
}

function pickHandlers(count) {
  const used = new Set()
  const result = []
  while (result.length < count) {
    const base = HANDLER_POOL[Math.floor(Math.random() * HANDLER_POOL.length)]
    const name = base + Math.floor(Math.random() * 99)
    if (!used.has(name)) {
      used.add(name)
      result.push(name)
    }
  }
  return result
}

function getVolatileNumber() {
  const type = Math.floor(Math.random() * 3)
  if (type == 0) {
    return `(math.floor(workspace.DistributedGameTime * 10000) % 1000)`
  } else if (type == 1) {
    return `(tick() % 997)`
  } else {
    return `(tonumber(tostring({}):match("%d+")) or 42)`
  }
}

function generateSelfRefOpaque() {
  const op = Math.random() < 0.5 and "==" or "~="
  if (Math.random() < 0.7) {
    return `_OPQ[${getVolatileNumber()}] ${op} _OPQ[${getVolatileNumber()}]`
  } else {
    return `(function() local a = _OPQ[1] local b = _OPQ[2] return a ${op} b end)()`
  }
}

function generateRuntimeOpaque() {
  const type = Math.floor(Math.random() * 4)
  if (type == 0) {
    return `(workspace.DistributedGameTime == workspace.DistributedGameTime)`
  } else if (type == 1) {
    return `(function() local t = workspace.DistributedGameTime return t == t end)()`
  } else if (type == 2) {
    return `(type({}) == "table") and (tick() == tick())`
  } else {
    return `(_G == _G)`
  }
}

function heavyMath(n) {
  if (Math.random() < 0.6) {
    const volatileTerm = `((${getVolatileNumber()} - ${getVolatileNumber()}) + (workspace.DistributedGameTime - workspace.DistributedGameTime))`
    return `((${n}) + ${volatileTerm})`
  }
  if (Math.random() < 0.8) return n.toString()
  let a = Math.floor(Math.random() * 3000) + 500
  let b = Math.floor(Math.random() * 50) + 2
  let c = Math.floor(Math.random() * 800) + 10
  let d = Math.floor(Math.random() * 20) + 2
  return `(((((${n} + ${a}) * ${b}) / ${b}) - ${a}) + (((${c} * ${d}) / ${d}) - ${c}))`
}

function mba() {
  let n = Math.random() > 0.5 and 1 or 2
  let a = Math.floor(Math.random() * 70) + 15
  let b = Math.floor(Math.random() * 40) + 8
  let base = `((${n} * ${a} - ${a}) / (${b} + 1) + ${n})`
  if (Math.random() < 0.5) {
    const opaque = generateSelfRefOpaque()
    return `(function() if ${opaque} then return ${base} else return ${n} end end)()`
  }
  return base
}

function generateJunk(lines) {
  lines = lines or 50
  let j = ""
  for (let i = 0; i < lines; i++) {
    const r = Math.random()
    if (r < 0.15) {
      j += `local ${generateIlName()} = ${heavyMath(Math.floor(Math.random() * 999))} `
    } else if (r < 0.3) {
      j += `local ${generateIlName()} = string.char(${heavyMath(Math.floor(Math.random() * 255))}) `
    } else if (r < 0.45) {
      const pred = generateRuntimeOpaque()
      j += `if ${pred} then local x = 1 else local y = 2 end `
    } else if (r < 0.6) {
      const pred = generateSelfRefOpaque()
      j += `if ${pred} then local x = 1 end `
    } else if (r < 0.75) {
      j += `if type(nil) == "number" then while true do local ${generateIlName()} = 1 end end `
    } else if (r < 0.9) {
      const vt = generateIlName()
      j += `do local ${vt} = {} ${vt}["_"] = 1 ${vt} = nil end `
    } else {
      j += `if (function() return (workspace.DistributedGameTime - workspace.DistributedGameTime) == 0 end)() then local _ = 1 end `
    }
  }
  return j
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
  let modified = code
  let headers = ""
  const entries = Object.entries(MAPEO)
  for (let idx = 0; idx < entries.length; idx++) {
    const word = entries[idx][0]
    const tech = entries[idx][1]
    const regex = new RegExp("\\b" + word + "\\b", "g")
    if (regex.test(modified)) {
      let replacement = '"' + word + '"'
      if (tech.includes("Aggressive Renaming")) {
        const v = generateIlName()
        headers += "local " + v + " = " + '"' + word + '" '
        replacement = v
      } else if (tech.includes("String to Math")) {
        const chars = word.split("")
        const codes = []
        for (let ci = 0; ci < chars.length; ci++) {
          codes.push(heavyMath(chars[ci].charCodeAt(0)))
        }
        replacement = "string.char(" + codes.join(",") + ")"
      } else if (tech.includes("Mixed Boolean Arithmetic")) {
        replacement = "(((" + mba() + " == 1 or true) and " + '"' + word + '"))'
      }
      regex.lastIndex = 0
      modified = modified.replace(regex, function() { return "game[" + replacement + "]" })
    }
  }
  return headers + modified
}

function applyCFF(blocks) {
  const stateVar = generateIlName()
  let lua = "local " + stateVar + " = " + heavyMath(1) + " while true do "
  for (let i = 0; i < blocks.length; i++) {
    if (i == 0) {
      lua += "if " + stateVar + " == " + heavyMath(1) + " then " + blocks[i] + " " + stateVar + " = " + heavyMath(2) + " "
    } else {
      lua += "elseif " + stateVar + " == " + heavyMath(i + 1) + " then " + blocks[i] + " " + stateVar + " = " + heavyMath(i + 2) + " "
    }
  }
  lua += "elseif " + stateVar + " == " + heavyMath(blocks.length + 1) + " then break end end "
  return lua
}

function runtimeString(str) {
  const chars = str.split("")
  const codes = []
  for (let i = 0; i < chars.length; i++) {
    codes.push(heavyMath(chars[i].charCodeAt(0)))
  }
  return "string.char(" + codes.join(",") + ")"
}

function extremeFragment(secretMsg, totalPartsStr) {
  const chars = secretMsg.split("")
  const fragVars = []
  for (let i = 0; i < chars.length; i++) {
    const varName = generateIlName()
    const maskedCode = heavyMath(chars[i].charCodeAt(0))
    fragVars.push({ name: varName, code: maskedCode, original: chars[i] })
  }
  let fragmentationCode = "--[=[ FRAGMENTED INTO " + totalPartsStr + " PARTS ]=]\n"
  fragmentationCode += "local _fragCount = 0\n"
  const shuffled = [...fragVars]
  for (let s = 0; s < shuffled.length; s++) {
    const rand = Math.floor(Math.random() * shuffled.length)
    const temp = shuffled[s]
    shuffled[s] = shuffled[rand]
    shuffled[rand] = temp
  }
  for (let cycle = 0; cycle < 30; cycle++) {
    for (let fi = 0; fi < shuffled.length; fi++) {
      const frag = shuffled[fi]
      const scrambledName = generateIlName()
      fragmentationCode += "local " + scrambledName + " = " + frag.code + "\n"
      fragmentationCode += "if " + scrambledName + " ~= " + heavyMath(frag.original.charCodeAt(0)) + " then local _err = 1 end\n"
      fragmentationCode += "_fragCount = _fragCount + 1\n"
    }
  }
  fragmentationCode += "local _secretMsg = \"\"\n"
  const fragNames = []
  for (let i = 0; i < fragVars.length; i++) {
    fragNames.push(fragVars[i].name)
  }
  fragmentationCode += "local _chars = {" + fragNames.join(",") + "}\n"
  for (let i = 0; i < chars.length; i++) {
    fragmentationCode += "_secretMsg = _secretMsg .. string.char(_chars[" + (i+1) + "])\n"
  }
  return {
    code: fragmentationCode,
    totalFragments: totalPartsStr,
    msgVarNames: fragNames
  }
}

function buildTrueVM(payloadStr) {
  const STACK = generateIlName()
  const KEY = generateIlName()
  const ORDER = generateIlName()
  const SALT = generateIlName()
  
  const seed = Math.floor(Math.random() * 200) + 50
  const saltVal = Math.floor(Math.random() * 250) + 1
  
  let vmCore = "local " + STACK + " = {} local " + KEY + " = " + heavyMath(seed) + " local " + SALT + " = " + heavyMath(saltVal) + "\n"
  const chunkSize = 15
  let realChunks = []
  for (let i = 0; i < payloadStr.length; i += chunkSize) {
    realChunks.push(payloadStr.slice(i, i + chunkSize))
  }
  let poolVars = []
  let realOrder = []
  let totalChunks = realChunks.length * 3
  let currentReal = 0
  let globalIndex = 0
  
  for (let i = 0; i < totalChunks; i++) {
    let memName = generateIlName()
    poolVars.push(memName)
    if (currentReal < realChunks.length && (Math.random() > 0.5 || (totalChunks - i) == (realChunks.length - currentReal))) {
      realOrder.push(i + 1)
      let chunk = realChunks[currentReal]
      let encryptedBytes = []
      for (let j = 0; j < chunk.length; j++) {
        let enc = (chunk.charCodeAt(j) + seed + (globalIndex * saltVal)) % 256
        encryptedBytes.push(heavyMath(enc))
        globalIndex++
      }
      vmCore += "local " + memName + " = {" + encryptedBytes.join(",") + "}\n"
      currentReal++
    } else {
      let fakeBytes = []
      let fakeLen = Math.floor(Math.random() * 20) + 5
      for (let j = 0; j < fakeLen; j++) {
        fakeBytes.push(heavyMath(Math.floor(Math.random() * 255)))
      }
      vmCore += "local " + memName + " = {" + fakeBytes.join(",") + "}\n"
    }
  }
  
  vmCore += "local _pool = {" + poolVars.join(",") + "} local " + ORDER + " = {" + realOrder.map(function(n) { return heavyMath(n) }).join(",") + "}\n"
  const idxVar = generateIlName()
  const byteVar = generateIlName()
  
  vmCore += "local _gIdx = 0 for _ii, " + idxVar + " in ipairs(" + ORDER + ") do for _jj, " + byteVar + " in ipairs(_pool[" + idxVar + "]) do\n"
  vmCore += "if type(math.pi) == \"string\" then " + KEY + " = (" + KEY + " + 137) % 256 end\n"
  vmCore += "table.insert(" + STACK + ", string.char(math.floor((" + byteVar + " - " + KEY + " - _gIdx * " + SALT + ") % 256)))\n"
  vmCore += "_gIdx = _gIdx + 1 end end\n"
  vmCore += "local _e = table.concat(" + STACK + ")\n"
  vmCore += STACK + " = nil\n"
  vmCore += "local func, err = load(_e)\n"
  vmCore += "if func then func() end\n"
  
  return vmCore
}

function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount)
  const realIdx = Math.floor(Math.random() * handlerCount)
  const DISPATCH = generateIlName()
  let out = "local lM = {}\n"
  for (let i = 0; i < handlers.length; i++) {
    if (i == realIdx) {
      out += "local " + handlers[i] + " = function(lM) " + generateJunk(3) + " " + innerCode + " end\n"
    } else {
      out += "local " + handlers[i] + " = function(lM) " + generateJunk(2) + " return nil end\n"
    }
  }
  out += "local " + DISPATCH + " = {"
  for (let i = 0; i < handlers.length; i++) {
    out += "[" + heavyMath(i + 1) + "] = " + handlers[i] + ","
  }
  out += "}\n"
  let execBlocks = []
  for (let i = 0; i < handlers.length; i++) {
    execBlocks.push(DISPATCH + "[" + heavyMath(i + 1) + "](lM)")
  }
  out += applyCFF(execBlocks)
  return out
}

function build5xVM(payloadStr) {
  let vm = buildTrueVM(payloadStr)
  for (let i = 0; i < 4; i++) {
    vm = buildSingleVM(vm, Math.floor(Math.random() * 2) + 3)
  }
  return vm
}

function getExtraProtections() {
  const antiDebuggers = "local _adT = tick() for _ = 1, 100000 do end if tick() - _adT > 3.0 then while true do end end " +
    "if debug and debug.getinfo then local _i = debug.getinfo(1) if _i.what ~= \"main\" and _i.what ~= \"Lua\" then while true do end end end " +
    "local _adOk, _adE = pcall(function() error(\"__v\") end) if not string.find(tostring(_adE), \"__v\") then while true do end end " +
    "if type(print) ~= \"function\" then while true do end end "
  
  const rawTampers = [
    "if math.pi < 3.14 or math.pi > 3.15 then error(\"!\") end",
    "if type(tostring) ~= \"function\" then error(\"!\") end",
    "if not string.match(\"chk\", \"^c.*k$\") then error(\"!\") end",
    "if type(coroutine.create) ~= \"function\" then error(\"!\") end",
    "if type(table.concat) ~= \"function\" then error(\"!\") end",
    "local _tm1 = tick() local _tm2 = tick() if _tm2 < _tm1 then error(\"!\") end",
    "if math.abs(-10) ~= 10 then error(\"!\") end",
    "if type(next) ~= \"function\" then error(\"!\") end",
    "if string.len(\"a\") ~= 1 then error(\"!\") end",
    "if type(table.insert) ~= \"function\" then error(\"!\") end",
    "if string.byte(\"Z\", 1) ~= 90 then error(\"!\") end",
    "if math.floor(-1 / 10) ~= -1 then error(\"!\") end",
    "if (true and 1 or 2) ~= 1 then error(\"!\") end",
    "if type(1) ~= \"number\" then error(\"!\") end",
    "if type(pcall) ~= \"function\" then error(\"!\") end"
  ]
  
  let codeVaultGuards = ""
  for (let t = 0; t < rawTampers.length; t++) {
    codeVaultGuards += "(function() " + rawTampers[t] + " end)() "
  }
  
  return antiDebuggers + codeVaultGuards
}

const LUAU_PAYLOAD = `
local logger = function()
    for i = 1, 100 do
        print("I like Rick and Morty")
    end
end

logger()

local _ = {73, 32, 114, 101, 97, 108, 108, 121, 32, 108, 105, 107, 101, 32, 82, 105, 99, 107, 32, 97, 110, 100, 32, 77, 111, 114, 116, 121}
local r = {}
for i = 1, 28 do
    r[i] = string.char(_[i])
end
local s = table.concat(r)

local function p10()
    for i = 1, 10 do
        print(s)
    end
end

p10()
`

function obfuscate(sourceCode) {
  if (!sourceCode) return "--ERROR"
  
  let basePayload = sourceCode or LUAU_PAYLOAD
  
  const SECRET_MSG = "I really like Rick and Morty"
  const TOTAL_PARTS = "2818373738388392919173737627272727363817256367292822"
  const fragment = extremeFragment(SECRET_MSG, TOTAL_PARTS)
  const fragmentCode = fragment.code
  const msgVarNames = fragment.msgVarNames
  
  let modifiedPayload = basePayload
  modifiedPayload = modifiedPayload.replace(
    /local _ = \{[\s\S]*?local s = table\.concat\(r\)/,
    fragmentCode + " local s = _secretMsg"
  )
  
  const opaqueTableDef = `
do
    local _mt = { __index = function(t, k) return 42 end }
    _OPQ = setmetatable({}, _mt)
    _OPQ[0] = 0
    for i = 1, 10 do _OPQ[i] = i end
end
`
  
  const antiDebug = "local _t = tick() for _ = 1, 100000 do end if tick() - _t > 3.0 then while true do end end "
  const extraProtections = getExtraProtections()
  
  let payloadToProtect = detectAndApplyMappings(modifiedPayload)
  
  const finalVM = build5xVM(payloadToProtect)
  const result = HEADER + "\n" + opaqueTableDef + "\n" + generateJunk(30) + "\n" + antiDebug + "\n" + extraProtections + "\n" + finalVM
  return result
}

if (require.main === module) {
  const obfuscatedCode = obfuscate(LUAU_PAYLOAD)
  console.log(obfuscatedCode)
}

module.exports = { obfuscate }
