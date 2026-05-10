// ------------------------------------------------------------
//  Seak Obfuscator v5 - FINAL (VM anidada extrema + XOR dinámico)
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

// VM real con XOR dinámico
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

// VM anidada (capa de handlers falsos)
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

// Construcción final con profundidad y handlers configurables
function build18xVM(payloadStr, depth = 25, extraHandlers = 3) {
  let vm = buildTrueVM(payloadStr, randomXORKey());
  for (let i = 0; i < depth; i++) {
    const handlerCount = Math.floor(Math.random() * extraHandlers) + 2;
    vm = buildSingleVM(vm, handlerCount);
  }
  return vm;
}

// Anti‑env logging (versión legible, SIN ofuscar)
function getAntiEnvCode() {
  return `
-- Anti-Environment Logger Protection (visible)
local _results, _count = {}, 0
local function _store(value) _count = _count + 1; _results[_count] = value and 1 or 0 end
do local ok=true pcall(function() local ts=game:GetService("TweenService") if not ts then return end local f=Instance.new("Frame") local tw=ts:Create(f,TweenInfo.new(0.1),{Size=UDim2.new(1,0,1,0)}) local t=os.clock() tw:Play() tw.Completed:Wait() if math.abs(os.clock()-t-0.1)>0.05 then ok=false end f:Destroy() end) _store(ok) end
do local ok=true pcall(function() local s=Instance.new("Sound") if pcall(function() s.PlaybackLoudness=99 end) then ok=false end s:Destroy() end) _store(ok) end
do local ok=true pcall(function() if not Instance then return end local f=Instance.new("Frame") if typeof(f)~="Instance" then ok=false end f:Destroy() end) _store(ok) end
do local ok=true pcall(function() if not game then return end if game.PlaceId==game.GameId then ok=false end end) _store(ok) end
do local ok=true pcall(function() local tb=Instance.new("TextBox") if pcall(function() tb.TextBounds=Vector2.new(1,1) end) then ok=false end tb:Destroy() end) _store(ok) end
local _s=0 for i=1,_count do _s=_s+_results[i] end if _s~=_count then while true do end end
`;
}

// Protecciones adicionales (anti-debug, anti-tamper)
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
    junkLines = 100,
    vmDepth = 25,
    vmHandlers = 3,
    useAntiDebug = true,
    useAntiEnv = true
  } = options;

  let finalCode = "";

  // 1. Anti‑env (visible, no ofuscado)
  if (useAntiEnv) {
    finalCode += getAntiEnvCode() + "\n";
  }

  // 2. Basura opcional
  if (junkLines > 0) {
    finalCode += generateJunk(junkLines) + "\n";
  }

  // 3. Anti‑debug
  if (useAntiDebug) {
    finalCode += `local _t=tick() for _=1,150000 do end if tick()-_t>5.0 then while true do end end\n`;
  }

  // 4. Protecciones extra
  finalCode += getExtraProtections() + "\n";

  // 5. Detectar si el código es una llamada loadstring con HttpGet
  let payloadToProtect = "";
  const isLoadstringRegex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i;
  const match = sourceCode.match(isLoadstringRegex);
  if (match) {
    payloadToProtect = match[1];
  } else {
    payloadToProtect = sourceCode;
  }

  // 6. VM principal (anidada)
  const vmCode = build18xVM(payloadToProtect, vmDepth, vmHandlers);
  finalCode += vmCode;

  return HEADER + "\n" + finalCode;
}

// ------------------------------------------------------------
//  Ejemplo de uso (puedes modificar el script y los parámetros)
// ------------------------------------------------------------
if (require.main === module) {
  const miScript = `
    -- Tu script aquí
    print("Hola mundo")
    local player = game.Players.LocalPlayer
    player.Character.Humanoid.Health = 100
  `;

  const ofuscado = obfuscate(miScript, {
    junkLines: 80,      // Basura entre capas
    vmDepth: 30,        // Capas de VM (más = más seguro)
    vmHandlers: 5,      // Handlers falsos por capa
    useAntiDebug: true,
    useAntiEnv: true
  });

  console.log(ofuscado);
}

module.exports = { obfuscate };
