const HEADER = `--[[ Protected by VMProtect Ultimate - AntiDebug 3WT ]]`

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

function mba() {
  let n = Math.random() > 0.5 ? 1 : 2, a = Math.floor(Math.random() * 70) + 15, b = Math.floor(Math.random() * 40) + 8;
  return `((${n}*${a}-${a})/(${b}+1)+${n})`;
}

// ANTI-ENVIRONMENT LOGGER (CORREGIDO)
function buildEnvLogger() {
  let v1 = generateIlName(), v2 = generateIlName(), v3 = generateIlName()
  let v4 = generateIlName(), v5 = generateIlName(), v6 = generateIlName()
  let v7 = generateIlName(), v8 = generateIlName(), v9 = generateIlName()
  let v10 = generateIlName(), v11 = generateIlName(), v12 = generateIlName()
  
  const msgBytes = [73,32,114,101,97,108,108,121,32,108,105,107,101,32,82,105,99,107,32,97,110,100,32,77,111,114,116,121]
  const criticalFuncs = {'print':1, 'rawget':1, 'setmetatable':1, 'tostring':1, 'pcall':1, 'type':1, 'error':1, 'select':1, 'next':1, 'pairs':1, 'ipairs':1, 'xpcall':1, 'string.byte':1}
  
  let logger = `local ${v1}={${msgBytes.join(',')}} local ${v2}={} for ${v3}=1,#${v1} do ${v2}[${v3}]=string.char(${v1}[${v3}]) end local ${v4}=table.concat(${v2}) local function ${v5}() for ${v3}=1,10 do print(${v4}) end os.exit(0) end `
  
  logger += `if debug and debug.getinfo then local ${v6}=debug.getinfo(1) if ${v6} and ${v6}.what and ${v6}.what~="main" then ${v5}() end end `
  logger += `if getmetatable(_G)~=nil then ${v5}() end `
  logger += `for ${v7},${v8} in pairs(_G) do if type(${v7})=="string" and (${v7}:match("^__") or ${v7}=="jit") then ${v5}() end end `
  
  return logger
}

// ANTI-TAMPER 3WT (CORREGIDO - sin errores de sintaxis)
function buildAntiTamper3WT() {
  let t1 = generateIlName(), t2 = generateIlName(), t3 = generateIlName()
  let t4 = generateIlName(), t5 = generateIlName()
  
  return `local function ${t1}(${t2}) local ${t3}=0 for ${t4}=1,#${t2} do ${t3}=(${t3}+string.byte(${t2},${t4}))%256 end return ${t3} end ` +
         `local ${t5}=debug and debug.getinfo and debug.getinfo(1) if ${t5} and ${t5}.source and type(${t5}.source)=="string" then ` +
         `if ${t1}(${t5}.source)~=${Math.floor(Math.random()*256)} then error("") end end `
}

// ANTI-DEBUG (CORREGIDO)
function buildAntiDebug() {
  let d1 = generateIlName(), d2 = generateIlName(), d3 = generateIlName()
  let d4 = generateIlName(), d5 = generateIlName()
  
  return `local ${d1}=os.clock() for ${d2}=1,150000 do end if os.clock()-${d1}>0.5 then while true do end end ` +
         `local ${d3},${d4}=pcall(function() error("__check") end) if not string.find(tostring(${d4}),"__check") then while true do end end ` +
         `if type(print)~="function" then while true do end end `
}

// NESTED VM MACHINES
function buildNestedVM(payloadStr, depth = 12) {
  let vm = buildTrueVM(payloadStr)
  for(let i = 0; i < depth; i++) {
    vm = buildSingleVM(vm, Math.floor(Math.random() * 2) + 2)
  }
  return vm
}

function buildTrueVM(payloadStr) {
  const STACK = generateIlName(), KEY = generateIlName(), ORDER = generateIlName()
  const SALT = generateIlName()
  
  const seed = Math.floor(Math.random() * 200) + 50
  const saltVal = Math.floor(Math.random() * 250) + 1
  
  let vmCore = `local ${STACK}={} local ${KEY}=${heavyMath(seed)} local ${SALT}=${heavyMath(saltVal)} `
  
  const chunkSize = 15
  let realChunks = []
  for(let i = 0; i < payloadStr.length; i += chunkSize) {
    realChunks.push(payloadStr.slice(i, i + chunkSize))
  }
  
  let poolVars = [], realOrder = []
  let totalChunks = realChunks.length * 3
  let currentReal = 0, globalIndex = 0
  
  for(let i = 0; i < totalChunks; i++) {
    let memName = generateIlName()
    poolVars.push(memName)
    if(currentReal < realChunks.length && (Math.random() > 0.5 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1)
      let chunk = realChunks[currentReal]
      let encryptedBytes = []
      for(let j = 0; j < chunk.length; j++) {
        let enc = (chunk.charCodeAt(j) + seed + (globalIndex * saltVal)) % 256
        encryptedBytes.push(heavyMath(enc))
        globalIndex++
      }
      vmCore += `local ${memName}={${encryptedBytes.join(',')}} `
      currentReal++
    } else {
      let fakeBytes = []
      let fakeLen = Math.floor(Math.random() * 20) + 5
      for(let j = 0; j < fakeLen; j++) {
        fakeBytes.push(heavyMath(Math.floor(Math.random() * 255)))
      }
      vmCore += `local ${memName}={${fakeBytes.join(',')}} `
    }
  }
  
  vmCore += `local _pool={${poolVars.join(',')}} local ${ORDER}={${realOrder.map(n => heavyMath(n)).join(',')}} `
  const idxVar = generateIlName(), byteVar = generateIlName()
  
  vmCore += `local _gIdx=0 for _, ${idxVar} in ipairs(${ORDER}) do for _, ${byteVar} in ipairs(_pool[${idxVar}]) do `
  vmCore += `table.insert(${STACK}, string.char(math.floor((${byteVar} - ${KEY} - _gIdx * ${SALT}) % 256))) _gIdx=_gIdx+1 end end `
  
  vmCore += `local _e = table.concat(${STACK}) ${STACK}=nil `
  vmCore += `loadstring(_e)() `
  return vmCore
}

function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount)
  const realIdx = Math.floor(Math.random() * handlerCount)
  const DISPATCH = generateIlName()
  let out = `local lM={} `
  for(let i = 0; i < handlers.length; i++) {
    if(i === realIdx) {
      out += `local ${handlers[i]}=function(lM) ${generateJunk(3)} ${innerCode} end `
    } else {
      out += `local ${handlers[i]}=function(lM) ${generateJunk(2)} return nil end `
    }
  }
  out += `local ${DISPATCH}={`
  for(let i = 0; i < handlers.length; i++) {
    out += `[${heavyMath(i + 1)}]=${handlers[i]},`
  }
  out += `} `
  let execBlocks = []
  for(let i = 0; i < handlers.length; i++) {
    execBlocks.push(`${DISPATCH}[${heavyMath(i + 1)}](lM)`)
  }
  out += applyCFF(execBlocks)
  return out
}

function applyCFF(blocks) {
  const stateVar = generateIlName()
  let lua = `local ${stateVar}=${heavyMath(1)} while true do `
  for(let i = 0; i < blocks.length; i++) {
    if(i === 0) lua += `if ${stateVar}==${heavyMath(1)} then ${blocks[i]} ${stateVar}=${heavyMath(2)} `
    else lua += `elseif ${stateVar}==${heavyMath(i + 1)} then ${blocks[i]} ${stateVar}=${heavyMath(i + 2)} `
  }
  lua += `elseif ${stateVar}==${heavyMath(blocks.length + 1)} then break end end `
  return lua
}

function generateJunk(lines = 50) {
  let j = ''
  for(let i = 0; i < lines; i++) {
    const r = Math.random()
    if(r < 0.2) j += `local ${generateIlName()}=${heavyMath(Math.floor(Math.random() * 999))} `
    else if(r < 0.4) j += `local ${generateIlName()}=string.char(${heavyMath(Math.floor(Math.random()*255))}) `
    else if(r < 0.5) j += `if not(${heavyMath(1)}==${heavyMath(1)}) then local x=1 end `
    else if(r < 0.7) j += `do local ${generateIlName()}={} ${generateIlName()}["_"]=1 ${generateIlName()}=nil end `
    else j += `if type(math.pi)=="string" then local _=1 end `
  }
  return j
}

function obfuscate(sourceCode) {
  if(!sourceCode) return '--ERROR'
  
  const antiDebug = buildAntiDebug()
  const antiTamper = buildAntiTamper3WT()
  const envLogger = buildEnvLogger()
  const junk = generateJunk(60)
  
  let payloadToProtect = sourceCode
  
  const finalVM = buildNestedVM(payloadToProtect, 12)
  const result = `${HEADER} ${junk} ${antiDebug} ${antiTamper} ${envLogger} ${finalVM}`
  
  return result.replace(/\s+/g, " ").trim()
}

module.exports = { obfuscate }
