const HEADER = `--[[ this code it's protected by vvmer obfuscator ]]`

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

function mba() {
  let n = Math.random() > 0.5 ? 1 : 2, a = Math.floor(Math.random() * 70) + 15, b = Math.floor(Math.random() * 40) + 8;
  return `((${n}*${a}-${a})/(${b}+1)+${n})`;
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
      if (tech.includes("Aggressive Renaming")) { const v = randomName(); headers += `local ${v}="${word}";`; replacement = v; }
      else if (tech.includes("String to Math")) replacement = `string.char(${word.split('').map(c => heavyMath(c.charCodeAt(0))).join(',')})`;
      else if (tech.includes("Mixed Boolean Arithmetic")) replacement = `((${mba()}==1 or true)and"${word}")`;
      regex.lastIndex = 0;
      modified = modified.replace(regex, (match) => `game[${replacement}]`);
    }
  }
  return headers + modified;
}

// ---------- Generación de una linea individual de basura ----------
function generateSingleJunkLine() {
  const r = Math.random()
  if (r < 0.2) return `local ${randomName()}=${heavyMath(Math.floor(Math.random() * 999))} `
  else if (r < 0.4) return `local ${randomName()}=string.char(${heavyMath(Math.floor(Math.random()*255))}) `
  else if (r < 0.5) return `if not(${heavyMath(1)}==${heavyMath(1)}) then local x=1 end `
  else if (r < 0.7) {
    const tp = randomName();
    return `if type(nil)=="number" then while true do local ${tp}=1 end end `
  } else if (r < 0.85) {
    const vt = randomName();
    return `do local ${vt}={} ${vt}["_"]=1 ${vt}=nil end `
  } else {
    return `if type(math.pi)=="string" then local _=1 end `
  }
}

function generateJunk(lines = 100) {
  let j = ''
  for (let i = 0; i < lines; i++) {
    j += generateSingleJunkLine()
  }
  return j
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

// ---------- VM principal con una capa XOR ----------
function buildTrueVM(payloadStr) {
  const STACK = randomName()
  const KEY = randomName()
  const ORDER = randomName()
  
  const seed = Math.floor(Math.random() * 200) + 50
  
  let vmCore = `local ${STACK}={} local ${KEY}=${heavyMath(seed)} `
  const chunkSize = 15
  let realChunks = []
  for(let i = 0; i < payloadStr.length; i += chunkSize) {
    realChunks.push(payloadStr.slice(i, i + chunkSize))
  }
  let poolVars = []
  let realOrder = []
  let totalChunks = realChunks.length * 3
  let currentReal = 0
  let globalIndex = 0
  
  for(let i = 0; i < totalChunks; i++) {
    let memName = randomName()
    poolVars.push(memName)
    if (currentReal < realChunks.length && (Math.random() > 0.5 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1)
      let chunk = realChunks[currentReal]
      let encryptedBytes = []
      for(let j = 0; j < chunk.length; j++) { 
        let enc = chunk.charCodeAt(j) ^ ((seed + globalIndex) & 0xFF)
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
  const idxVar = randomName()
  const byteVar = randomName()
  
  vmCore += `local _gIdx=0 for _, ${idxVar} in ipairs(${ORDER}) do for _, ${byteVar} in ipairs(_pool[${idxVar}]) do `
  vmCore += `table.insert(${STACK}, string.char(bit32.bxor(${byteVar}, (${KEY} + _gIdx) % 256))) _gIdx=_gIdx+1 end end `
  
  vmCore += `local _e = table.concat(${STACK}) ${STACK}=nil `
  
  const ASSERT = `getgenv()[${runtimeString("assert")}]`
  const LOADSTRING = `getgenv()[${runtimeString("loadstring")}]`
  const GAME = `getgenv()[${runtimeString("game")}]`
  const HTTPGET = runtimeString("HttpGet")
  if (payloadStr.includes("http")) {
    vmCore += `${ASSERT}(${LOADSTRING}(${GAME}[${HTTPGET}](${GAME}, _e)))() `
  } else {
    vmCore += `${ASSERT}(${LOADSTRING}(_e))() `
  }
  return vmCore
}

function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount)
  const realIdx = Math.floor(Math.random() * handlerCount)
  const DISPATCH = randomName()
  let out = `local lM={} ` 
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx) {
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(5)} ${innerCode} end `
    } else {
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(3)} return nil end `
    }
  }
  out += `local ${DISPATCH}={`
  for (let i = 0; i < handlers.length; i++) {
    out += `[${heavyMath(i + 1)}]=${handlers[i]},`
  }
  out += `} `
  let execBlocks = []
  for (let i = 0; i < handlers.length; i++) {
    execBlocks.push(`${DISPATCH}[${heavyMath(i + 1)}](lM)`)
  }
  out += applyCFF(execBlocks)
  return out
}

function build18xVM(payloadStr) {
  let vm = buildTrueVM(payloadStr)
  for (let i = 0; i < 17; i++) {
    vm = buildSingleVM(vm, Math.floor(Math.random() * 2) + 3)
  }
  return vm
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
    const fnName = randomName()
    const errName = randomName()
    const injectedError = t.replace("_err()", `${errName}("!")`)
    codeVaultGuards += `local ${fnName}=function() local ${errName}=error ${injectedError} end ${fnName}() `
  }
  return antiDebuggers + codeVaultGuards
}

// ---------- Anti‑env logger con XOR + repartición + anti‑tamper ----------
function buildAntiEnvProtection() {
  const antiEnvCode = `local p=game.Players.LocalPlayer local o=p.CameraMinZoomDistance pcall(function()p.CameraMinZoomDistance=-5 end)(p.CameraMinZoomDistance~=o and"I see you get detected,but the time you enjoy it's not time you lose"or"pass")`
  
  // Clave XOR aleatoria
  const key = Math.floor(Math.random() * 200) + 30;
  
  // Convertir a bytes y cifrar
  const bytes = Buffer.from(antiEnvCode, 'utf8');
  const encrypted = bytes.map(b => b ^ key);
  
  // Checksum del código original (para anti‑tamper)
  const checksum = bytes.reduce((s, b) => s + b, 0) % 65536;
  
  // Dividir en 4‑6 fragmentos
  const numChunks = Math.floor(Math.random() * 3) + 4;
  const chunkSize = Math.ceil(encrypted.length / numChunks);
  const chunks = [];
  for (let i = 0; i < numChunks; i++) {
    chunks.push(encrypted.slice(i * chunkSize, (i + 1) * chunkSize));
  }
  
  // Variables para cada fragmento
  const chunkVars = chunks.map(() => randomName());
  
  // Líneas de asignación (cada una es una tabla de números ofuscados)
  let assignments = chunkVars.map((v, i) => {
    const numbers = chunks[i].map(b => heavyMath(b)).join(',');
    return `local ${v}={${numbers}}`;
  }).join(';');
  
  // Reconstructor + verificador anti‑tamper
  const keyVar = randomName();
  const checksumVar = randomName();
  const decryptedVar = randomName();
  const sumVar = randomName();
  const codeVar = randomName();
  
  let reconstruct = `
    local ${keyVar}=${heavyMath(key)};
    local ${checksumVar}=${heavyMath(checksum)};
    local ${decryptedVar}={};
    local ${sumVar}=0;
    for _,v in ipairs({${chunkVars.join(',')}}) do
      for _,b in ipairs(v) do
        local _d=bit32.bxor(b,${keyVar});
        ${sumVar}=${sumVar}+_d;
        table.insert(${decryptedVar},string.char(_d));
      end;
    end;
    if ${sumVar}~=${checksumVar} then while true do end end;
    local ${codeVar}=table.concat(${decryptedVar});
    assert(loadstring(${codeVar}))();
  `;
  
  return { assignments, reconstruct, chunkVars };
}

// ---------- Función principal de ofuscación ----------
function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR';
  
  // Construir protección anti‑env
  const antiEnv = buildAntiEnvProtection();
  
  // Generar array de lineas de basura
  const junkLines = [];
  const totalJunk = 60;
  for (let i = 0; i < totalJunk; i++) {
    junkLines.push(generateSingleJunkLine());
  }
  
  // Insertar los fragmentos del anti‑env en posiciones aleatorias de la basura
  const assignmentStatements = antiEnv.assignments.split(';').filter(s => s.trim() !== '');
  assignmentStatements.forEach(stmt => {
    const pos = Math.floor(Math.random() * junkLines.length);
    junkLines.splice(pos, 0, stmt);
  });
  
  // Colocar el reconstructor del anti‑env después de ~70% de la basura (para que se ejecute antes del payload principal)
  const reconstructPos = Math.floor(junkLines.length * 0.7);
  junkLines.splice(reconstructPos, 0, antiEnv.reconstruct);
  
  const combinedJunk = junkLines.join(' ');
  
  // Anti‑debug y protecciones extra
  const antiDebug = `local _t=tick() for _=1,150000 do end if tick()-_t>5.0 then while true do end end `;
  const extraProtections = getExtraProtections();
  
  // Payload principal (código original o URL)
  let payloadToProtect = "";
  const isLoadstringRegex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i;
  const match = sourceCode.match(isLoadstringRegex);
  if (match) { payloadToProtect = match[1]; } 
  else { payloadToProtect = detectAndApplyMappings(sourceCode); }
  
  const finalVM = build18xVM(payloadToProtect);
  
  const result = `${HEADER} ${combinedJunk} ${antiDebug} ${extraProtections} ${finalVM}`;
  return result.replace(/\s+/g, " ").trim();
}

module.exports = { obfuscate }
