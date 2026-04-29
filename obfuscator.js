const HEADER = `--[[ this code it's protected by vvmer obfoscator ]]`

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

// heavyMath reducido: solo 30% de chance de expresión compleja
function heavyMath(n) {
  if (Math.random() < 0.7) return n.toString();
  const a = Math.floor(Math.random() * 500) + 10;
  const b = Math.floor(Math.random() * 10) + 2;
  return `(((${n}+${a})*${b})/${b}-${a})`;
}

function mba() {
  const a = Math.floor(Math.random() * 50) + 5;
  return `((1*${a}-${a}+1))`;
}

const MAPEO = {
  "ScreenGui":"Aggressive Renaming","Frame":"String to Math","TextLabel":"Table Indirection",
  "TextButton":"Mixed Boolean Arithmetic","Humanoid":"Dynamic Junk","Player":"Fake Flow",
  "RunService":"Virtual Machine","TweenService":"Fake Flow","Players":"Fake Flow"
};

function detectAndApplyMappings(code) {
  let modified = code, headers = "";
  for (const [word, tech] of Object.entries(MAPEO)) {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    if (regex.test(modified)) {
      let replacement = `"${word}"`;
      if (tech.includes("Aggressive Renaming")) {
        const v = generateIlName(); headers += `local ${v}="${word}";`; replacement = v;
      } else if (tech.includes("String to Math")) {
        replacement = `string.char(${word.split('').map(c => c.charCodeAt(0)).join(',')})`;
      } else if (tech.includes("Mixed Boolean Arithmetic")) {
        replacement = `(${mba()}==1 and "${word}" or "${word}")`;
      }
      regex.lastIndex = 0;
      modified = modified.replace(regex, () => `game[${replacement}]`);
    }
  }
  return headers + modified;
}

function generateJunk(lines = 100) {
  let j = ''
  for (let i = 0; i < lines; i++) {
    const r = Math.random()
    if (r < 0.2) j += `local ${generateIlName()}=${heavyMath(Math.floor(Math.random() * 999))} `
    else if (r < 0.4) j += `local ${generateIlName()}=string.char(${Math.floor(Math.random()*255)}) `
    else if (r < 0.5) j += `if not(1==1) then local x=1 end `
    else if (r < 0.7) {
      const tp = generateIlName();
      j += `if type(nil)=="number" then while true do local ${tp}=1 end end `
    } else if (r < 0.85) {
      const vt = generateIlName();
      j += `do local ${vt}={} ${vt}["_"]=1 ${vt}=nil end `
    } else {
      j += `if type(math.pi)=="string" then local _=1 end `
    }
  }
  return j
}

function applyCFF(blocks) {
  const stateVar = generateIlName()
  let lua = `local ${stateVar}=1 while true do `
  for (let i = 0; i < blocks.length; i++) {
    if (i === 0) lua += `if ${stateVar}==1 then ${blocks[i]} ${stateVar}=2 `
    else lua += `elseif ${stateVar}==${i+1} then ${blocks[i]} ${stateVar}=${i+2} `
  }
  lua += `elseif ${stateVar}==${blocks.length+1} then break end end `
  return lua
}

function runtimeString(str) {
  return `string.char(${str.split('').map(c => c.charCodeAt(0)).join(',')})`;
}

// ═══════════════════════════════════════════════════════════════
// VM NIVEL 0: VM base que cifra el payload real
// ═══════════════════════════════════════════════════════════════
function buildBaseVM(payloadStr) {
  const STACK = generateIlName()
  const KEY   = generateIlName()
  const ORDER = generateIlName()
  const SALT  = generateIlName()

  const seed    = Math.floor(Math.random() * 200) + 50
  const saltVal = Math.floor(Math.random() * 250) + 1

  let vm = `local ${STACK}={} local ${KEY}=${seed} local ${SALT}=${saltVal} `

  const chunkSize = 15
  let realChunks = []
  for (let i = 0; i < payloadStr.length; i += chunkSize)
    realChunks.push(payloadStr.slice(i, i + chunkSize))

  let poolVars = [], realOrder = []
  let totalChunks = realChunks.length * 3
  let currentReal = 0, globalIndex = 0

  for (let i = 0; i < totalChunks; i++) {
    const memName = generateIlName(); poolVars.push(memName)
    if (currentReal < realChunks.length && (Math.random() > 0.5 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1)
      const chunk = realChunks[currentReal]
      let encBytes = []
      for (let j = 0; j < chunk.length; j++) {
        encBytes.push((chunk.charCodeAt(j) + seed + globalIndex * saltVal) % 256)
        globalIndex++
      }
      vm += `local ${memName}={${encBytes.join(',')}} `
      currentReal++
    } else {
      const fakeLen = Math.floor(Math.random() * 20) + 5
      const fake = Array.from({length: fakeLen}, () => Math.floor(Math.random() * 255))
      vm += `local ${memName}={${fake.join(',')}} `
    }
  }

  vm += `local _pool={${poolVars.join(',')}} local ${ORDER}={${realOrder.join(',')}} `

  const idxVar  = generateIlName()
  const byteVar = generateIlName()

  vm += `local _gIdx=0 `
  vm += `for _,${idxVar} in ipairs(${ORDER}) do for _,${byteVar} in ipairs(_pool[${idxVar}]) do `
  vm += `if type(math.pi)=="string" then ${KEY}=(${KEY}+137)%256 end `
  vm += `table.insert(${STACK},string.char(math.floor((${byteVar}-${KEY}-_gIdx*${SALT})%256))) `
  vm += `_gIdx=_gIdx+1 end end `
  vm += `local _e=table.concat(${STACK}) ${STACK}=nil `

  const ASSERT     = `getfenv()[${runtimeString("assert")}]`
  const LOADSTRING = `getfenv()[${runtimeString("loadstring")}]`
  const GAME       = `getfenv()[${runtimeString("game")}]`
  const HTTPGET    = runtimeString("HttpGet")

  if (payloadStr.includes("http")) {
    vm += `${ASSERT}(${LOADSTRING}(${GAME}[${HTTPGET}](${GAME},_e)))() `
  } else {
    vm += `${ASSERT}(${LOADSTRING}(_e))() `
  }

  return vm
}

// ═══════════════════════════════════════════════════════════════
// VM NIVEL 1: Envuelve código en dispatch + CFF
// ═══════════════════════════════════════════════════════════════
function buildWrapperVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount)
  const realIdx  = Math.floor(Math.random() * handlerCount)
  const DISPATCH = generateIlName()

  let out = `local lM={} `
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx) {
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(3)} ${innerCode} end `
    } else {
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(2)} return nil end `
    }
  }

  out += `local ${DISPATCH}={`
  for (let i = 0; i < handlers.length; i++) out += `[${i+1}]=${handlers[i]},`
  out += `} `

  const execBlocks = handlers.map((_, i) => `${DISPATCH}[${i+1}](lM)`)
  out += applyCFF(execBlocks)
  return out
}

// ═══════════════════════════════════════════════════════════════
// VM NIVEL 2 (RECONSTRUCTORA): Reconstruye la VM nivel 1
// Esta VM tiene el código de buildWrapperVM cifrado dentro,
// lo descifra en runtime y lo ejecuta con loadstring
// ═══════════════════════════════════════════════════════════════
function buildReconstructorVM(innerCode) {
  // Ciframos el innerCode como si fuera un payload normal
  return buildBaseVM(innerCode)
}

// ═══════════════════════════════════════════════════════════════
// VM NIVEL 3 (MAESTRA): Reconstruye a la VM reconstructora,
// que a su vez reconstruye todas las VMs inferiores
// ═══════════════════════════════════════════════════════════════
function buildMasterVM(innerCode) {
  // La VM maestra cifra a la reconstructora
  // y le añade una capa extra de dispatch con junk
  const STACK   = generateIlName()
  const KEY     = generateIlName()
  const SALT    = generateIlName()
  const ORDER   = generateIlName()

  const seed    = Math.floor(Math.random() * 200) + 50
  const saltVal = Math.floor(Math.random() * 250) + 1

  let vm = `local ${STACK}={} local ${KEY}=${seed} local ${SALT}=${saltVal} `
  vm += `${generateJunk(8)} `

  const chunkSize = 15
  let realChunks = []
  for (let i = 0; i < innerCode.length; i += chunkSize)
    realChunks.push(innerCode.slice(i, i + chunkSize))

  let poolVars = [], realOrder = []
  let totalChunks = realChunks.length * 3
  let currentReal = 0, globalIndex = 0

  for (let i = 0; i < totalChunks; i++) {
    const memName = generateIlName(); poolVars.push(memName)
    if (currentReal < realChunks.length && (Math.random() > 0.5 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1)
      const chunk = realChunks[currentReal]
      let encBytes = []
      for (let j = 0; j < chunk.length; j++) {
        encBytes.push((chunk.charCodeAt(j) + seed + globalIndex * saltVal) % 256)
        globalIndex++
      }
      vm += `local ${memName}={${encBytes.join(',')}} `
      currentReal++
    } else {
      const fakeLen = Math.floor(Math.random() * 15) + 5
      const fake = Array.from({length: fakeLen}, () => Math.floor(Math.random() * 255))
      vm += `local ${memName}={${fake.join(',')}} `
    }
  }

  vm += `local _pool={${poolVars.join(',')}} local ${ORDER}={${realOrder.join(',')}} `

  const idxVar  = generateIlName()
  const byteVar = generateIlName()

  vm += `local _gIdx=0 `
  vm += `for _,${idxVar} in ipairs(${ORDER}) do for _,${byteVar} in ipairs(_pool[${idxVar}]) do `
  vm += `if type(math.pi)=="string" then ${KEY}=(${KEY}+137)%256 end `
  vm += `table.insert(${STACK},string.char(math.floor((${byteVar}-${KEY}-_gIdx*${SALT})%256))) `
  vm += `_gIdx=_gIdx+1 end end `
  vm += `local _master=table.concat(${STACK}) ${STACK}=nil `

  // La VM maestra ejecuta el reconstructor que a su vez ejecuta todo lo demás
  const ASSERT     = `getfenv()[${runtimeString("assert")}]`
  const LOADSTRING = `getfenv()[${runtimeString("loadstring")}]`
  vm += `${ASSERT}(${LOADSTRING}(_master))() `

  return vm
}

// ═══════════════════════════════════════════════════════════════
// CADENA COMPLETA:
// MasterVM → cifra → ReconstructorVM → cifra → WrapperVM(x3) → cifra → BaseVM → payload
// ═══════════════════════════════════════════════════════════════
function buildFullChain(payloadStr) {
  // Nivel 0: VM base con el payload real
  let vm = buildBaseVM(payloadStr)

  // Nivel 1: 3 capas de wrapper con dispatch + CFF
  for (let i = 0; i < 3; i++) {
    vm = buildWrapperVM(vm, Math.floor(Math.random() * 2) + 3)
  }

  // Nivel 2: VM reconstructora — cifra todo lo anterior
  vm = buildReconstructorVM(vm)

  // Nivel 3: 2 capas de wrapper para la reconstructora
  for (let i = 0; i < 2; i++) {
    vm = buildWrapperVM(vm, Math.floor(Math.random() * 2) + 3)
  }

  // Nivel 4: VM maestra — cifra la reconstructora + sus wrappers
  vm = buildMasterVM(vm)

  return vm
}

function getExtraProtections() {
  const antiDebuggers =
    `local _adT=os.clock() for _=1,150000 do end if os.clock()-_adT>5.0 then while true do end end ` +
    `if debug~=nil and debug.getinfo then local _i=debug.getinfo(1) if _i.what~="main" and _i.what~="Lua" then while true do end end end ` +
    `local _adOk,_adE=pcall(function() error("__v") end) if not string.find(tostring(_adE),"__v") then while true do end end ` +
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

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'

  const antiDebug = `local _clk=os.clock local _t=_clk() for _=1,150000 do end if os.clock()-_t>5.0 then while true do end end `
  const extraProtections = getExtraProtections()

  const isLoadstringRegex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const match = sourceCode.match(isLoadstringRegex)

  let payload
  if (match) {
    payload = match[1]
  } else {
    payload = detectAndApplyMappings(sourceCode)
  }

  const finalVM = buildFullChain(payload)
  const result  = `${HEADER} ${generateJunk(30)} ${antiDebug} ${extraProtections} ${finalVM}`
  return result.replace(/\s+/g, " ").trim()
}

module.exports = { obfuscate }
