const HEADER = `--[[ protected by vvmer obfuscator | Architecture: Mother VM -> Intermediate VM -> Small VMs ]]`

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
  if (Math.random() < 0.65) return n.toString();
  let a = Math.floor(Math.random() * 50) + 5;
  let b = Math.floor(Math.random() * 10) + 2;
  return `((((${n}+${a})*${b})/${b})-${a})`;
}

function mba() {
  let a = Math.floor(Math.random() * 20) + 5;
  let b = Math.floor(Math.random() * 5) + 1;
  return `(((1*${a})+${b})-(${a}+${b})+1)`;
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
      if (tech.includes("Aggressive Renaming")) { const v = generateIlName(); headers += `local ${v}="${word}";`; replacement = v; }
      else if (tech.includes("String to Math")) replacement = `string.char(${word.split('').map(c => heavyMath(c.charCodeAt(0))).join(',')})`;
      else if (tech.includes("Mixed Boolean Arithmetic")) replacement = `((${mba()}==1 or true)and"${word}")`;
      regex.lastIndex = 0;
      modified = modified.replace(regex, (match) => `game[${replacement}]`);
    }
  }
  return headers + modified;
}

function generateJunk(lines = 15) {
  let j = ''
  for (let i = 0; i < lines; i++) {
    const r = Math.random()
    if (r < 0.25) j += `local ${generateIlName()}=${heavyMath(Math.floor(Math.random() * 999))} `
    else if (r < 0.45) j += `local ${generateIlName()}=string.char(${heavyMath(Math.floor(Math.random()*100)+50)}) `
    else if (r < 0.65) j += `if not(${heavyMath(1)}==${heavyMath(1)}) then local x=1 end `
    else if (r < 0.85) {
      const tp = generateIlName();
      j += `if type(nil)=="number" then while true do local ${tp}=1 end end `
    } else {
      j += `if type(math.pi)=="string" then local _=1 end `
    }
  }
  return j
}

function applyCFF(blocks) {
  const stateVar = generateIlName()
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

// ----------------------------------------------------------------------
// NUEVO: Generador de anti‑debugger con límite de 10 segundos
// ----------------------------------------------------------------------
function generateTimeBomb() {
  const startVar = generateIlName()
  const checkVar = generateIlName()
  return `local ${startVar}=os.clock() local ${checkVar}=function() if os.clock()-${startVar}>10 then while true do end end end ${checkVar}() `
}

// ----------------------------------------------------------------------
// NUEVO: Anti‑tamper anidado (tamper dentro de tamper)
// ----------------------------------------------------------------------
function generateNestedTamper(depth = 3) {
  if (depth <= 0) return ""
  const fnName = generateIlName()
  const inner = generateNestedTamper(depth - 1)
  const check = `
    if math.pi<3.14 or math.pi>3.15 then error("tampered") end
    if type(tostring)~="function" then error("tampered") end
    ${inner}
  `
  return `local ${fnName}=function() ${check} end ${fnName}() `
}

// ----------------------------------------------------------------------
// NUEVO: Anti‑tamper integrado en anti‑debugger (tamper dentro de debugger)
// ----------------------------------------------------------------------
function generateDebuggerWithTamper() {
  const dbg = generateTimeBomb()
  const tamper = generateNestedTamper(2)
  return `${dbg} ${tamper}`
}

// ----------------------------------------------------------------------
// Modificación de getExtraProtections para incluir las nuevas defensas
// ----------------------------------------------------------------------
function getExtraProtections() {
  const antiSandbox = 
    `if typeof(task)~="table" then while true do end end ` + 
    `if not game or not workspace then while true do end end ` + 
    `local _adT=os.clock() for _=1,50000 do end if os.clock()-_adT>2.0 then while true do end end ` + 
    `if type(print)~="function" then while true do end end `;

  const rawTampers = [
    `if math.pi<3.14 or math.pi>3.15 then _err() end`,
    `if type(tostring)~="function" then _err() end`,
    `if type(table.concat)~="function" then _err() end`,
    `if string.len("a")~=1 then _err() end`
  ];

  let codeVaultGuards = "";
  for(let t of rawTampers) {
    const fnName = generateIlName();
    const errName = generateIlName();
    const injectedError = t.replace("_err()", `${errName}("!")`);
    codeVaultGuards += `local ${fnName}=function() local ${errName}=error ${injectedError} end ${fnName}() `;
  }

  // Añadimos el anti‑debugger con tamper anidado
  const timeBombTamper = generateDebuggerWithTamper();
  // Añadimos tamper anidado puro
  const pureNestedTamper = generateNestedTamper(4);

  return antiSandbox + codeVaultGuards + timeBombTamper + pureNestedTamper;
}

// ----------------------------------------------------------------------
// buildTrueVM – sin cambios
// ----------------------------------------------------------------------
function buildTrueVM(payloadStr) {
  const STACK = generateIlName(); const KEY = generateIlName(); const ORDER = generateIlName()
  const SALT = generateIlName();
  
  const seed = Math.floor(Math.random() * 200) + 50
  const saltVal = Math.floor(Math.random() * 100) + 1 
  
  let vmCore = `local ${STACK}={} local ${KEY}=${heavyMath(seed)} local ${SALT}=${heavyMath(saltVal)} `
  const chunkSize = 20; let realChunks = [];
  for(let i = 0; i < payloadStr.length; i += chunkSize) { realChunks.push(payloadStr.slice(i, i + chunkSize)); }
  let poolVars = []; let realOrder = [];
  
  let totalChunks = realChunks.length * 2; let currentReal = 0; let globalIndex = 0;
  
  for(let i = 0; i < totalChunks; i++) {
    let memName = generateIlName(); poolVars.push(memName);
    if (currentReal < realChunks.length && (Math.random() > 0.4 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1);
      let chunk = realChunks[currentReal]; let encryptedBytes = [];
      for(let j = 0; j < chunk.length; j++) { 
        let enc = (chunk.charCodeAt(j) + seed + (globalIndex * saltVal)) % 256;
        encryptedBytes.push(heavyMath(enc)); 
        globalIndex++;
      }
      vmCore += `local ${memName}={${encryptedBytes.join(',')}} `;
      currentReal++;
    } else {
      let fakeBytes = []; let fakeLen = Math.floor(Math.random() * 10) + 5;
      for(let j = 0; j < fakeLen; j++) { fakeBytes.push(heavyMath(Math.floor(Math.random() * 255))); }
      vmCore += `local ${memName}={${fakeBytes.join(',')}} `;
    }
  }
  
  vmCore += `local _pool={${poolVars.join(',')}} local ${ORDER}={${realOrder.map(n => heavyMath(n)).join(',')}} `;
  const idxVar = generateIlName(); const byteVar = generateIlName();
  
  vmCore += `local _gIdx=0 for _, ${idxVar} in ipairs(${ORDER}) do for _, ${byteVar} in ipairs(_pool[${idxVar}]) do `;
  vmCore += `table.insert(${STACK}, string.char(math.floor((${byteVar} - ${KEY} - (_gIdx * ${SALT})) % 256))) _gIdx=_gIdx+1 end end `;
  
  vmCore += `local _e = table.concat(${STACK}) ${STACK}=nil `;
  const ASSERT = `getfenv()[${runtimeString("assert")}]`;
  const LOADSTRING = `getfenv()[${runtimeString("loadstring")}]`;
  const GAME = `getfenv()[${runtimeString("game")}]`;
  const HTTPGET = runtimeString("HttpGet");
  
  if (payloadStr.includes("http")) { vmCore += `${ASSERT}(${LOADSTRING}(${GAME}[${HTTPGET}](${GAME}, _e)))() ` } 
  else { vmCore += `${ASSERT}(${LOADSTRING}(_e))() ` }
  return vmCore
}

// ----------------------------------------------------------------------
// buildSingleVM – ahora inyecta tamper dentro de cada handler falso
// ----------------------------------------------------------------------
function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount); const realIdx = Math.floor(Math.random() * handlerCount);
  const DISPATCH = generateIlName(); let out = `local lM={} ` 
  for (let i = 0; i < handlers.length; i++) {
    // Inyectamos un pequeño tamper + junk en todos los handlers
    const extraTamper = generateNestedTamper(2);
    if (i === realIdx) { 
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(3)} ${extraTamper} ${innerCode} end ` 
    } else { 
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(2)} ${extraTamper} return nil end ` 
    }
  }
  out += `local ${DISPATCH}={`
  for (let i = 0; i < handlers.length; i++) { out += `[${heavyMath(i + 1)}]=${handlers[i]},` }
  out += `} `
  let execBlocks = []; for (let i = 0; i < handlers.length; i++) { execBlocks.push(`${DISPATCH}[${heavyMath(i + 1)}](lM)`) }
  out += applyCFF(execBlocks); return out
}

// ----------------------------------------------------------------------
// Arquitectura jerárquica (Mother -> Intermediate -> Small VMs)
// ----------------------------------------------------------------------
function buildMotherVM(payloadStr) {
  let coreVM = buildTrueVM(payloadStr);
  
  let smallVMs = coreVM;
  for (let i = 0; i < 3; i++) {
    smallVMs = buildSingleVM(smallVMs, 2); 
  }

  let intermediateVM = buildSingleVM(smallVMs, 3);
  let motherVM = buildSingleVM(intermediateVM, 4);

  return motherVM;
}

// ----------------------------------------------------------------------
// obfuscate – resultado final con todas las protecciones
// ----------------------------------------------------------------------
function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'
  const extraProtections = getExtraProtections()
  let payloadToProtect = ""
  
  const isLoadstringRegex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const match = sourceCode.match(isLoadstringRegex)
  
  if (match) { payloadToProtect = match[1] } 
  else { payloadToProtect = detectAndApplyMappings(sourceCode) }
  
  const finalVM = buildMotherVM(payloadToProtect)
  
  const result = `${HEADER}\n${generateJunk(10)} ${extraProtections} ${finalVM}`
  return result.replace(/\s+/g, " ").trim()
}

module.exports = { obfuscate }
