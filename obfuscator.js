// ------------------------------------------------------------
//  Seak Obfuscator v5 - VM mejorada + XOR dinámico + Full Custom
// ------------------------------------------------------------
const HEADER = `--[[ protected by Seak Obfuscator v5 ]]`;

function randomName() {
  return "_" + Math.random().toString(36).substring(2, 8) + Math.floor(Math.random() * 1000);
}

function pickHandlers(count) {
  const used = new Set(), result = [];
  while (result.length < count) {
    const name = randomName() + Math.floor(Math.random() * 99);
    if (!used.has(name)) { used.add(name); result.push(name); }
  }
  return result;
}

function heavyMath(n) {
  if (Math.random() < 0.8) return n.toString();
  let a = Math.floor(Math.random() * 3000) + 500;
  let b = Math.floor(Math.random() * 50) + 2;
  let c = Math.floor(Math.random() * 800) + 10;
  let d = Math.floor(Math.random() * 20) + 2;
  return `(((((${n}+${a})*${b})/${b})-${a})+((${c}*${d})/${d})-${c})`;
}

function randomXORKey() {
  return Math.floor(Math.random() * 0xFF);
}

function generateSingleJunkLine() {
  const r = Math.random();
  if (r < 0.2) return `local ${randomName()}=${heavyMath(Math.floor(Math.random() * 999))} `;
  else if (r < 0.35) return `local ${randomName()}=string.char(${heavyMath(Math.floor(Math.random()*255))}) `;
  else if (r < 0.5) return `if not(${heavyMath(1)}==${heavyMath(1)}) then local x=1 end `;
  else if (r < 0.7) return `if type(nil)=="number" then while true do local ${randomName()}=1 end end `;
  else if (r < 0.85) return `do local ${randomName()}={} ${randomName()}["_"]=1 ${randomName()}=nil end `;
  else return `if type(math.pi)=="string" then while true do end end `;
}

function generateJunk(lines = 100) {
  let j = '';
  for (let i = 0; i < lines; i++) j += generateSingleJunkLine();
  return j;
}

function applyCFF(blocks) {
  const stateVar = randomName();
  let lua = `local ${stateVar}=${heavyMath(1)} while true do `;
  for (let i = 0; i < blocks.length; i++) {
    if (i === 0) lua += `if ${stateVar}==${heavyMath(1)} then ${blocks[i]} ${stateVar}=${heavyMath(2)} `;
    else lua += `elseif ${stateVar}==${heavyMath(i + 1)} then ${blocks[i]} ${stateVar}=${heavyMath(i + 2)} `;
  }
  lua += `elseif ${stateVar}==${heavyMath(blocks.length + 1)} then break end end `;
  return lua;
}

function runtimeString(str) {
  return `string.char(${str.split('').map(c => heavyMath(c.charCodeAt(0))).join(',')})`;
}

// ------------------------------------------------------------
//  VM real (con XOR mejorado)
// ------------------------------------------------------------
function buildTrueVM(payloadStr, xorSeed = null) {
  const STACK = randomName();
  const KEY = xorSeed !== null ? xorSeed : randomXORKey();
  const ORDER = randomName();
  const seed = KEY;

  let vmCore = `local ${STACK}={} local ${randomName()}=${heavyMath(seed)} `;
  const chunkSize = 10;
  let realChunks = [];
  for (let i = 0; i < payloadStr.length; i += chunkSize)
    realChunks.push(payloadStr.slice(i, i + chunkSize));

  let poolVars = [], realOrder = [];
  let totalChunks = realChunks.length * 4;
  let currentReal = 0, globalIndex = 0;

  for (let i = 0; i < totalChunks; i++) {
    let memName = randomName();
    poolVars.push(memName);
    if (currentReal < realChunks.length && (Math.random() > 0.6 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1);
      let chunk = realChunks[currentReal], encryptedBytes = [];
      for (let j = 0; j < chunk.length; j++) {
        let enc = chunk.charCodeAt(j) ^ ((seed + globalIndex) & 0xFF);
        encryptedBytes.push(heavyMath(enc));
        globalIndex++;
      }
      vmCore += `local ${memName}={${encryptedBytes.join(',')}} `;
      currentReal++;
    } else {
      let fakeBytes = [];
      for (let j = 0; j < Math.floor(Math.random() * 25) + 5; j++)
        fakeBytes.push(heavyMath(Math.floor(Math.random() * 255)));
      vmCore += `local ${memName}={${fakeBytes.join(',')}} `;
    }
  }

  vmCore += `local _pool={${poolVars.join(',')}} local ${ORDER}={${realOrder.map(n => heavyMath(n)).join(',')}} `;
  const idxVar = randomName(), byteVar = randomName();
  vmCore += `local _gIdx=0 for _, ${idxVar} in ipairs(${ORDER}) do for _, ${byteVar} in ipairs(_pool[${idxVar}]) do `;
  vmCore += `table.insert(${STACK}, string.char(bit32.bxor(${byteVar}, (${heavyMath(seed)} + _gIdx) % 256))) _gIdx=_gIdx+1 end end `;
  vmCore += `local _e = table.concat(${STACK}) ${STACK}=nil `;

  const ASSERT = `getgenv()[${runtimeString("assert")}]`;
  const LOADSTRING = `getgenv()[${runtimeString("loadstring")}]`;
  const GAME = `getgenv()[${runtimeString("game")}]`;
  const HTTPGET = runtimeString("HttpGet");

  if (payloadStr.includes("http"))
    vmCore += `${ASSERT}(${LOADSTRING}(${GAME}[${HTTPGET}](${GAME}, _e)))() `;
  else
    vmCore += `${ASSERT}(${LOADSTRING}(_e))() `;
  return vmCore;
}

// ------------------------------------------------------------
//  VM anidada (capa de handlers falsos)
// ------------------------------------------------------------
function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount);
  const realIdx = Math.floor(Math.random() * handlerCount);
  const DISPATCH = randomName();
  let out = `local lM={} `;
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx)
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(8)} ${innerCode} end `;
    else
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(4)} return nil end `;
  }
  out += `local ${DISPATCH}={`;
  for (let i = 0; i < handlers.length; i++)
    out += `[${heavyMath(i + 1)}]=${handlers[i]},`;
  out += `} `;
  let execBlocks = [];
  for (let i = 0; i < handlers.length; i++)
    execBlocks.push(`${DISPATCH}[${heavyMath(i + 1)}](lM)`);
  out += applyCFF(execBlocks);
  return out;
}

// ------------------------------------------------------------
//  Construcción final de la VM (profundidad configurable)
// ------------------------------------------------------------
function build18xVM(payloadStr, depth = 25, extraHandlers = 3) {
  let vm = buildTrueVM(payloadStr, randomXORKey());
  for (let i = 0; i < depth; i++) {
    const handlerCount = Math.floor(Math.random() * extraHandlers) + 2;
    vm = buildSingleVM(vm, handlerCount);
  }
  return vm;
}

// ------------------------------------------------------------
//  Anti‑env logging (tabla asegurada)
// ------------------------------------------------------------
function buildAntiEnvProtection() {
  const antiEnvCode = `local _r,_n={},0 local function _push(v) _n=_n+1;_r[_n]=v and 1 or 0 end do local p=true pcall(function() local ts=game:GetService("TweenService") if not ts then return end local f=Instance.new("Frame") local tw=ts:Create(f,TweenInfo.new(0.1),{Size=UDim2.new(1,0,1,0)}) local t=os.clock() tw:Play() tw.Completed:Wait() if math.abs(os.clock()-t-0.1)>0.05 then p=false end f:Destroy() end) _push(p) end do local p=true pcall(function() local s=Instance.new("Sound") if pcall(function() s.PlaybackLoudness=99 end) then p=false end s:Destroy() end) _push(p) end do local p=true pcall(function() if not Instance then return end local f=Instance.new("Frame") if typeof(f)~="Instance" then p=false end f:Destroy() end) _push(p) end do local p=true pcall(function() if not game then return end if game.PlaceId==game.GameId then p=false end end) _push(p) end do local p=true pcall(function() local tb=Instance.new("TextBox") if pcall(function() tb.TextBounds=Vector2.new(1,1) end) then p=false end tb:Destroy() end) _push(p) end local _s=0 for i=1,_n do _s=_s+_r[i] end if _s~=_n then while true do end end`;

  const fragSize = 4 + Math.floor(Math.random() * 3);
  const fragments = [];
  for (let i = 0; i < antiEnvCode.length; i += fragSize)
    fragments.push(antiEnvCode.slice(i, i + fragSize));

  const tableName = randomName();
  const fragmentLines = [];
  for (const frag of fragments) {
    const bytes = frag.split('').map(c => heavyMath(c.charCodeAt(0)));
    fragmentLines.push(`${tableName}[#${tableName}+1] = string.char(${bytes.join(',')})`);
  }
  const initLine = `local ${tableName} = {}`;
  const reconstructLine = `local _reco = table.concat(${tableName}); assert(loadstring(_reco))();`;
  return { initLine, fragmentLines, reconstructLine };
}

// ------------------------------------------------------------
//  Protecciones adicionales (anti‑debug, anti‑tamper)
// ------------------------------------------------------------
function getExtraProtections() {
  const antiDebuggers = `
    if getmetatable(_G)~=nil then while true do end end 
    if type(print)~="function" then while true do end end
  `;
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
  ];
  let codeVaultGuards = "";
  for (let t of rawTampers) {
    const fnName = randomName(), errName = randomName();
    codeVaultGuards += `local ${fnName}=function() local ${errName}=error ${t.replace("_err()", `${errName}("!")`)} end ${fnName}() `;
  }
  return antiDebuggers + codeVaultGuards;
}

// ------------------------------------------------------------
//  Función principal de ofuscación (con opciones)
// ------------------------------------------------------------
function obfuscate(sourceCode, options = {}) {
  if (!sourceCode) return '--ERROR: no source code provided';

  const {
    junkLines = 100,           // cantidad de líneas basura al inicio
    vmDepth = 25,              // número de capas de VM (recomendado 15-35)
    vmHandlers = 3,            // handlers falsos por capa (2-6)
    useAntiDebug = true,       // incluir antidebug
    useAntiEnv = true,         // incluir anti‑env logging
    customXORSeed = null       // si quieres fijar la semilla XOR (null = aleatoria)
  } = options;

  let finalCode = "";

  // 1. Anti‑env logging (opcional)
  let antiEnvPart = "";
  if (useAntiEnv) {
    const antiEnv = buildAntiEnvProtection();
    const lines = [antiEnv.initLine];
    for (let i = 0; i < junkLines; i++) lines.push(generateSingleJunkLine());
    for (const stmt of antiEnv.fragmentLines) {
      const pos = Math.floor(Math.random() * (lines.length - 1)) + 1;
      lines.splice(pos, 0, stmt);
    }
    lines.push(antiEnv.reconstructLine);
    antiEnvPart = lines.join(' ');
  } else {
    antiEnvPart = generateJunk(junkLines);
  }

  // 2. Anti‑debug (opcional)
  const antiDebugPart = useAntiDebug
    ? `local _t=tick() for _=1,150000 do end if tick()-_t>5.0 then while true do end end `
    : "";

  // 3. Protecciones extra (siempre activas por seguridad)
  const extraProtections = getExtraProtections();

  // 4. Detectar si el código es una llamada loadstring con HttpGet
  let payloadToProtect = "";
  const isLoadstringRegex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i;
  const match = sourceCode.match(isLoadstringRegex);
  if (match) {
    payloadToProtect = match[1];
  } else {
    // ofuscación ligera de strings del código original (opcional)
    payloadToProtect = sourceCode;
  }

  // 5. Construir la VM principal
  const vmCode = build18xVM(payloadToProtect, vmDepth, vmHandlers);

  // 6. Ensamblar todo
  finalCode = `${HEADER}\n${antiEnvPart}\n${antiDebugPart}\n${extraProtections}\n${vmCode}`;
  return finalCode;
}

// ------------------------------------------------------------
//  Ejemplo de uso (puedes borrarlo o mantenerlo)
// ------------------------------------------------------------
if (require.main === module) {
  const ejemploScript = `
    -- Mi script original
    local Players = game:GetService("Players")
    local player = Players.LocalPlayer
    print("Hola " .. player.Name)
    loadstring(game:HttpGet("https://example.com/script.lua"))()
  `;

  const ofuscado = obfuscate(ejemploScript, {
    junkLines: 80,
    vmDepth: 20,
    vmHandlers: 4,
    useAntiDebug: true,
    useAntiEnv: true
  });

  console.log(ofuscado);
}

module.exports = { obfuscate };
