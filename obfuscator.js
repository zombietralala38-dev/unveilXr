// ------------------------------------------------------------
//  Seak Obfuscator - v6 FINAL (Anti‑env interior, tamaño lineal)
// ------------------------------------------------------------
const HEADER = `--[[ this code it's protected by Seak obfuscator ]]`

// Anti‑env logger (se inyecta en la última capa de la VM)
const ANTI_ENV_LOGGER_CODE = `
local p = game.Players.LocalPlayer
local c = p and p.Character
local anim = c and c:FindFirstChild("Animate")
local dummy = Instance.new("LocalScript")
local is_ok, is_bad = false, false

if anim and pcall(function() return anim:IsA("LocalScript") end) then
    is_ok = true
end
if not pcall(function() return dummy:IsA("LocalScript") end) then
    is_bad = true
end

if not (is_ok and not is_bad) then
    print("you get detected my boy")
    while true do end
end
print("pass")
`

function randomName() {
  return "_" + Math.random().toString(36).substring(2, 8) + Math.floor(Math.random() * 1000)
}

function pickHandlers(count) {
  const used = new Set()
  const result = []
  while (result.length < count) {
    const name = randomName() + Math.floor(Math.random() * 99)
    if (!used.has(name)) { used.add(name); result.push(name) }
  }
  return result
}

function heavyMath(n) {
  if (Math.random() < 0.8) return n.toString();
  let a = Math.floor(Math.random() * 3000) + 500
  let b = Math.floor(Math.random() * 50) + 2
  let c = Math.floor(Math.random() * 800) + 10
  let d = Math.floor(Math.random() * 20) + 2
  return `(((((${n}+${a})*${b})/${b})-${a})+((${c}*${d})/${d})-${c})`
}

function generateSingleJunkLine() {
  const r = Math.random()
  if (r < 0.2) return `local ${randomName()}=${heavyMath(Math.floor(Math.random() * 999))}`
  else if (r < 0.35) return `local ${randomName()}=string.char(${heavyMath(Math.floor(Math.random()*255))})`
  else if (r < 0.5) return `if not(${heavyMath(1)}==${heavyMath(1)}) then local x=1 end`
  else if (r < 0.7) {
    const tp = randomName();
    return `if type(nil)=="number" then while true do local ${tp}=1 end end`
  } else if (r < 0.85) {
    const vt = randomName();
    return `do local ${vt}={} ${vt}["_"]=1 ${vt}=nil end`
  } else {
    return `if type(math.pi)=="string" then while true do end end`
  }
}

function generateJunkArray(count = 100) {
  const arr = []
  for (let i = 0; i < count; i++) arr.push(generateSingleJunkLine())
  return arr
}

function applyCFF(blocks) {
  const stateVar = randomName()
  let lua = `local ${stateVar}=${heavyMath(1)} while true do `
  for (let i = 0; i < blocks.length; i++) {
    if (i === 0) lua += `if ${stateVar}==${heavyMath(1)} then ${blocks[i]} ${stateVar}=${heavyMath(2)} `
    else lua += `elseif ${stateVar}==${heavyMath(i + 1)} then ${blocks[i]} ${stateVar}=${heavyMath(i + 2)} `
  }
  lua += `elseif ${stateVar}==${heavyMath(blocks.length + 1)} then break end end `
  return lua
}

function runtimeString(str) {
  return `string.char(${str.split('').map(c => heavyMath(c.charCodeAt(0))).join(',')})`;
}

// VM base: cifra y ejecuta un payload (string)
function buildTrueVM(payloadStr) {
  const STACK = randomName()
  const KEY = randomName()
  const ORDER = randomName()
  const seed = Math.floor(Math.random() * 200) + 50

  let vmCore = `local _pool={} local ${STACK}={} local ${KEY}=${heavyMath(seed)} `
  const chunkSize = 10
  let realChunks = []
  for(let i = 0; i < payloadStr.length; i += chunkSize)
    realChunks.push(payloadStr.slice(i, i + chunkSize))

  let realOrder = []
  let totalChunks = realChunks.length * 4
  let currentReal = 0
  let globalIndex = 0

  for(let i = 0; i < totalChunks; i++) {
    if (currentReal < realChunks.length && (Math.random() > 0.6 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1)
      let chunk = realChunks[currentReal], encryptedBytes = []
      for(let j = 0; j < chunk.length; j++) {
        let enc = chunk.charCodeAt(j) ^ ((seed + globalIndex) & 0xFF)
        encryptedBytes.push(heavyMath(enc))
        globalIndex++
      }
      vmCore += `_pool[${heavyMath(i + 1)}]={${encryptedBytes.join(',')}} `
      currentReal++
    } else {
      let fakeBytes = []
      for(let j = 0; j < Math.floor(Math.random() * 25) + 5; j++)
        fakeBytes.push(heavyMath(Math.floor(Math.random() * 255)))
      vmCore += `_pool[${heavyMath(i + 1)}]={${fakeBytes.join(',')}} `
    }
  }

  vmCore += `local ${ORDER}={${realOrder.map(n => heavyMath(n)).join(',')}} `
  const idxVar = randomName(), byteVar = randomName()

  vmCore += `local _gIdx=0 for _, ${idxVar} in ipairs(${ORDER}) do for _, ${byteVar} in ipairs(_pool[${idxVar}]) do `
  vmCore += `table.insert(${STACK}, string.char(bit32.bxor(${byteVar}, (${KEY} + _gIdx) % 256))) _gIdx=_gIdx+1 end end `
  vmCore += `local _e = table.concat(${STACK}) ${STACK}=nil `

  const ASSERT = `getgenv()[${runtimeString("assert")}]`
  const LOADSTRING = `getgenv()[${runtimeString("loadstring")}]`
  const GAME = `getgenv()[${runtimeString("game")}]`
  const HTTPGET = runtimeString("HttpGet")

  if (payloadStr.includes("http"))
    vmCore += `${ASSERT}(${LOADSTRING}(${GAME}[${HTTPGET}](${GAME}, _e)))() `
  else
    vmCore += `${ASSERT}(${LOADSTRING}(_e))() `
  return vmCore
}

// Capa de VM con UN solo handler real (los demás son señuelo)
function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount)
  const realIdx = Math.floor(Math.random() * handlerCount)
  const DISPATCH = randomName()
  let out = `local lM={} `
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx)
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunkArray(3).join(' ')} ${innerCode} end `
    else
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunkArray(2).join(' ')} return nil end `
  }
  out += `local ${DISPATCH}={`
  for (let i = 0; i < handlers.length; i++)
    out += `[${heavyMath(i + 1)}]=${handlers[i]},`
  out += `} `
  let execBlocks = []
  for (let i = 0; i < handlers.length; i++)
    execBlocks.push(`${DISPATCH}[${heavyMath(i + 1)}](lM)`)
  out += applyCFF(execBlocks)
  return out
}

// Construye 25 capas: payload puro → 24 capas de VM → 1 capa con anti‑env + payload
function buildFullVM(payloadStr) {
  // VM base del payload
  let vmPayload = buildTrueVM(payloadStr)

  // 24 capas intermedias
  for (let i = 0; i < 24; i++) {
    vmPayload = buildSingleVM(vmPayload, Math.floor(Math.random() * 2) + 3)
  }

  // Última capa: anti‑env SEGUIDO del payload (si pasa)
  const antiEnvAndPayload = `${ANTI_ENV_LOGGER_CODE} ${vmPayload}`
  const finalVM = buildSingleVM(antiEnvAndPayload, Math.floor(Math.random() * 2) + 3)

  return finalVM
}

function getExtraProtections() {
  const antiDebuggers = `
    if getmetatable(_G)~=nil then while true do end end 
    if type(print)~="function" then while true do end end
  `
  const rawTampers = [
    `if math.pi<3.14 or math.pi>3.15 then _err() end`,
    `if bit32 and bit32.bxor(10,5)~=15 then _err() end`,
    `if type(tostring)~="function" then _err() end`,
    `if not string.match("chk","^c.*k$") then _err() end`,
    `if type(coroutine.create)~="function" then _err() end`,
    `if type(table.concat)~="function" then _err() end`,
    `local _tm1=tick() local _tm2=tick() if _tm2<_tm1 then _err() end`,
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
  let codeVaultGuards = ""
  for(let t of rawTampers) {
    const fnName = randomName(), errName = randomName()
    codeVaultGuards += `local ${fnName}=function() local ${errName}=error ${t.replace("_err()", `${errName}("!")`)} end ${fnName}() `
  }
  return antiDebuggers + codeVaultGuards
}

function obfuscate(sourceCode) {
    if (!sourceCode) return '--ERROR';

    // Payload: extraer URL si es loadstring(game:HttpGet("URL"))
    let payload = "";
    const isLoadstringRegex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i;
    const match = sourceCode.match(isLoadstringRegex);
    if (match) {
        payload = match[1];
    } else {
        payload = sourceCode;
    }

    // VM blindada (anti‑env dentro)
    const finalVM = buildFullVM(payload);

    // Basura externa para camuflaje
    const junk = generateJunkArray(80).join(' ');

    const antiDebug = `local _t=tick() for _=1,150000 do end if tick()-_t>5.0 then while true do end end `;
    const extraProtections = getExtraProtections();

    return `${HEADER}\n${junk}\n${antiDebug}\n${extraProtections}\n${finalVM}`;
}

module.exports = { obfuscate };
