const HEADER = `--[[ vvmer obfuscator - Rick and Morty locker pool ]]`

const IL_POOL = ["IIIIIIII1", "vvvvvv1", "vvvvvvvv2", "vvvvvv3", "IIlIlIlI1", "lvlvlvlv2", "I1","l1","v1","v2","v3","II","ll","vv", "I2"]
const LOCKER_POOL = ["R1CK","M0RTY","P0RT4L","C1T4D3L","P1CKLE","M33S33KS","SCHW1FTY","S4NCHEZ","SM1TH","G4Z0RP4Z0P"]
const HANDLER_POOL = ["KQ","HF","W8","SX","Rj","nT","pL","qZ","mV","xB","yC","wD"]

function generateIlName() {
  return IL_POOL[Math.floor(Math.random() * IL_POOL.length)] + Math.floor(Math.random() * 99999)
}

function generateLockerName() {
  return LOCKER_POOL[Math.floor(Math.random() * LOCKER_POOL.length)] + Math.floor(Math.random() * 9999)
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

function heavyMath(n) {
  if (Math.random() < 0.5) return n.toString()
  let a = Math.floor(Math.random() * 100) + 10
  let b = Math.floor(Math.random() * 20) + 2
  return `(((${n}+${a})*${b}/${b})-${a})`
}

function extremeFragment(secretMsg, totalPartsStr) {
  const chars = secretMsg.split('')
  const charCodes = chars.map(c => c.charCodeAt(0))
  const fragVars = []
  
  for (let i = 0; i < chars.length; i++) {
    const varName = generateIlName()
    fragVars.push({ name: varName, code: heavyMath(charCodes[i]), original: chars[i] })
  }
  
  let fragmentationCode = ''
  fragmentationCode += `-- FRAGMENTED INTO ${totalPartsStr} PARTS `
  
  for (const frag of fragVars) {
    fragmentationCode += `local ${frag.name} = ${frag.code} `
  }
  
  fragmentationCode += `local _secretMsg = "" `
  for (let i = 0; i < chars.length; i++) {
    fragmentationCode += `_secretMsg = _secretMsg .. string.char(${fragVars[i].name}) `
  }
  
  return {
    code: fragmentationCode,
    totalFragments: totalPartsStr,
    msgVarNames: fragVars.map(f => f.name)
  }
}

function buildTrueVM(payloadStr) {
  const STACK = generateIlName()
  const KEY = generateIlName()
  const ORDER = generateIlName()
  const SALT = generateIlName()
  const seed = Math.floor(Math.random() * 200) + 50
  const saltVal = Math.floor(Math.random() * 250) + 1
  
  let vmCore = `local ${STACK}={} local ${KEY}=${seed} local ${SALT}=${saltVal} `
  const chunkSize = 10
  let realChunks = []
  for(let i = 0; i < payloadStr.length; i += chunkSize) {
    realChunks.push(payloadStr.slice(i, i + chunkSize))
  }
  
  let poolVars = []
  let realOrder = []
  let totalChunks = realChunks.length * 2
  let currentReal = 0
  let globalIndex = 0
  
  for(let i = 0; i < totalChunks; i++) {
    let memName = generateIlName()
    poolVars.push(memName)
    
    if (currentReal < realChunks.length && (Math.random() > 0.4 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1)
      let chunk = realChunks[currentReal]
      let encryptedBytes = []
      for(let j = 0; j < chunk.length; j++) { 
        let enc = (chunk.charCodeAt(j) + seed + (globalIndex * saltVal)) % 256
        encryptedBytes.push(enc)
        globalIndex++
      }
      vmCore += `local ${memName}={${encryptedBytes.join(',')}} `
      currentReal++
    } else {
      let fakeBytes = []
      let fakeLen = Math.floor(Math.random() * 10) + 3
      for(let j = 0; j < fakeLen; j++) {
        fakeBytes.push(Math.floor(Math.random() * 255))
      }
      vmCore += `local ${memName}={${fakeBytes.join(',')}} `
    }
  }
  
  vmCore += `local _pool={${poolVars.join(',')}} local ${ORDER}={${realOrder.join(',')}} `
  const idxVar = generateIlName()
  const byteVar = generateIlName()
  
  vmCore += `local _gIdx=0 for _, ${idxVar} in ipairs(${ORDER}) do for _, ${byteVar} in ipairs(_pool[${idxVar}]) do `
  vmCore += `table.insert(${STACK}, string.char((${byteVar} - ${KEY} - _gIdx * ${SALT}) % 256)) _gIdx=_gIdx+1 end end `
  vmCore += `local _e = table.concat(${STACK}) ${STACK}=nil `
  
  return vmCore
}

function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount)
  const realIdx = Math.floor(Math.random() * handlerCount)
  const DISPATCH = generateIlName()
  
  let out = `local lM={} `
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx) {
      out += `local ${handlers[i]}=function(lM) ${generateJunk(5)} ${innerCode} end `
    } else {
      out += `local ${handlers[i]}=function(lM) ${generateJunk(3)} return nil end `
    }
  }
  
  out += `local ${DISPATCH}={`
  for (let i = 0; i < handlers.length; i++) {
    out += `[${i + 1}]=${handlers[i]},`
  }
  out += `} `
  
  let execBlocks = []
  for (let i = 0; i < handlers.length; i++) {
    execBlocks.push(`${DISPATCH}[${i + 1}](lM)`)
  }
  out += applyCFF(execBlocks)
  
  return out
}

function buildVM(payloadStr, layers) {
  let vm = buildTrueVM(payloadStr)
  for (let i = 0; i < layers; i++) {
    vm = buildSingleVM(vm, Math.floor(Math.random() * 2) + 2)
  }
  return vm
}

function generateJunk(lines = 10) {
  let j = ''
  for (let i = 0; i < lines; i++) {
    const r = Math.random()
    if (r < 0.3) {
      j += `local ${generateIlName()}=${Math.floor(Math.random() * 999)} `
    } else if (r < 0.5) {
      j += `local ${generateIlName()}=string.char(${Math.floor(Math.random() * 255)}) `
    } else if (r < 0.7) {
      j += `local ${generateIlName()}=${heavyMath(Math.floor(Math.random() * 999))} `
    } else {
      j += `local ${generateIlName()}="${generateLockerName()}" `
    }
  }
  return j
}

function applyCFF(blocks) {
  const stateVar = generateIlName()
  let lua = `local ${stateVar}=1 while true do `
  for (let i = 0; i < blocks.length; i++) {
    if (i === 0) {
      lua += `if ${stateVar}==1 then ${blocks[i]} ${stateVar}=2 `
    } else if (i === blocks.length - 1) {
      lua += `elseif ${stateVar}==${i + 1} then ${blocks[i]} break `
    } else {
      lua += `elseif ${stateVar}==${i + 1} then ${blocks[i]} ${stateVar}=${i + 2} `
    }
  }
  lua += `end end `
  return lua
}

const ETA_ENAI_TKVR_PAYLOAD = `
local function logger()
    for i = 1, 100 do
        print("I like Rick and Morty")
    end
end

logger()

local _ = {73, 32, 114, 101, 97, 108, 108, 121, 32, 108, 105, 107, 101, 32, 82, 105, 99, 107, 32, 97, 110, 100, 32, 77, 111, 114, 116, 121}
local r = {}
for i = 1, #_ do
    r[i] = string.char(_[i])
end
local s = table.concat(r)

local function p10()
    for i = 1, 10 do
        print(s)
    end
end

p10()
`;

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'
  
  let basePayload = sourceCode || ETA_ENAI_TKVR_PAYLOAD
  
  const SECRET_MSG = "I really like Rick and Morty"
  const TOTAL_PARTS = "2818373738388392919173737627272727363817256367292822"
  const { code: fragmentCode, msgVarNames } = extremeFragment(SECRET_MSG, TOTAL_PARTS)
  
  let modifiedPayload = basePayload
  
  modifiedPayload = modifiedPayload.replace(
    /local _ = \{[\s\S]*?local s = table\.concat\(r\)/,
    `-- MSG FRAGMENTED ${fragmentCode} local s = _secretMsg`
  )
  
  modifiedPayload = modifiedPayload.replace(
    /local function logger\(\)/,
    `-- VARS: ${msgVarNames.join(',')} local function logger()`
  )
  
  const lockerName = generateLockerName()
  
  const finalCode = `
${HEADER}

-- LOCKER: ${lockerName}
${generateJunk(30)}

local ${lockerName} = function()
    ${modifiedPayload}
end

${lockerName}()

-- END LOCKER: ${lockerName}
`
  
  return finalCode
}

module.exports = { obfuscate }

if (require.main === module) {
  const obfuscatedCode = obfuscate(ETA_ENAI_TKVR_PAYLOAD)
  console.log(obfuscatedCode)
}
