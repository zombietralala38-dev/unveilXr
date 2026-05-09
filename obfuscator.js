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
  for (let i = 0; i < lines; i++) j += generateSingleJunkLine()
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

function buildTrueVM(payloadStr) {
  const STACK = randomName()
  const KEY = randomName()
  const ORDER = randomName()
  const seed = Math.floor(Math.random() * 200) + 50

  let vmCore = `local ${STACK}={} local ${KEY}=${heavyMath(seed)} `
  const chunkSize = 15
  let realChunks = []
  for(let i = 0; i < payloadStr.length; i += chunkSize)
    realChunks.push(payloadStr.slice(i, i + chunkSize))

  let poolVars = [], realOrder = [], totalChunks = realChunks.length * 3, currentReal = 0, globalIndex = 0

  for(let i = 0; i < totalChunks; i++) {
    let memName = randomName()
    poolVars.push(memName)
    if (currentReal < realChunks.length && (Math.random() > 0.5 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1)
      let chunk = realChunks[currentReal], encryptedBytes = []
      for(let j = 0; j < chunk.length; j++) {
        let enc = chunk.charCodeAt(j) ^ ((seed + globalIndex) & 0xFF)
        encryptedBytes.push(heavyMath(enc))
        globalIndex++
      }
      vmCore += `local ${memName}={${encryptedBytes.join(',')}} `
      currentReal++
    } else {
      let fakeBytes = []
      for(let j = 0; j < Math.floor(Math.random() * 20) + 5; j++)
        fakeBytes.push(heavyMath(Math.floor(Math.random() * 255)))
      vmCore += `local ${memName}={${fakeBytes.join(',')}} `
    }
  }

  vmCore += `local _pool={${poolVars.join(',')}} local ${ORDER}={${realOrder.map(n => heavyMath(n)).join(',')}} `
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

function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount)
  const realIdx = Math.floor(Math.random() * handlerCount)
  const DISPATCH = randomName()
  let out = `local lM={} `
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx)
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(5)} ${innerCode} end `
    else
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(3)} return nil end `
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

function build18xVM(payloadStr) {
  let vm = buildTrueVM(payloadStr)
  for (let i = 0; i < 17; i++)
    vm = buildSingleVM(vm, Math.floor(Math.random() * 2) + 3)
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
    const fnName = randomName(), errName = randomName()
    codeVaultGuards += `local ${fnName}=function() local ${errName}=error ${t.replace("_err()", `${errName}("!")`)} end ${fnName}() `
  }
  return antiDebuggers + codeVaultGuards
}

/**
 * Construye el payload cifrado del anti‑env logger (todos los checks en una línea),
 * lo fragmenta en 7 tablas y añade un reconstructor con verificación de suma.
 */
function buildAntiEnvProtection() {
  // Todos los checks (más de 40) en una sola línea, con parada inmediata si se detecta.
  const antiEnvCode = `local d=false;local function Q(f)local s,r=pcall(f)if not s then d=true end return r end;local function E(n)return _G[n]~=nil end;local s,r=pcall(function()local c=coroutine.create(function()coroutine.yield()end)coroutine.resume(c)return coroutine.status(c)=="suspended"end)if not s or not r then d=true end;local w=workspace;local o=w.DistributedGameTime;local ok,err=pcall(function()sethiddenproperty(w,"DistributedGameTime",67)end)if not ok then d=true else task.wait(0.01)local v=w.DistributedGameTime if v==67 or v<67 then d=true elseif math.abs(v-o)>1 then d=true end end;local t=workspace.Terrain;local ok=pcall(function()t.WaterWaveSpeed=9e9 end)if not ok then d=true elseif t.WaterWaveSpeed~=100 then d=true end;local p=Instance.new("Part")p.Color=Color3.new(0,0,0)p.Parent=workspace pcall(function()p.Color=Color3.new(256,0,0)end)if p.Color~=Color3.new(0,0,0)then d=true end p:Destroy();local pl=game.Players.LocalPlayer;local o5=pl.CameraMinZoomDistance;pcall(function()pl.CameraMinZoomDistance=-5 end)if pl.CameraMinZoomDistance~=o5 then d=true end;local a=pcall(function()return islclosure(print)==false and iscclosure(print)==true end)local b=pcall(function()return getgenv()~=getrenv() and iscclosure(newcclosure(function()end))==true end)local c=pcall(function()return getfenv(0)==getfenv(1)and type(getgc())=="table"end)if not(a and b and c)then d=true end;local s7,u7=pcall(function()return game.Players:GetNameFromUserIdAsync(1)end)if s7 then if u7~=game.Players.LocalPlayer.Name then d=true end else d=true end;Q(function()if game:GetService("UserInputService").TouchEnabled~=true then d=true end end);Q(function()if game:GetService("StarterGui"):GetCore("ScreenGui") then d=true end end);local globals={"writefile","getsenv","debug.getregistry","Drawing","isrbxactive","fireclickdetector","getconnections","saveinstance","setreadonly","checkcaller","hookfunction","clonefunction","getloadedmodules","identifyexecutor","request","setclipboard","iswindowactive","getgc","newcclosure","getgenv","getrenv","getfenv","setfenv","getmenv","getgud","getrunningscripts","getscriptclosure","getcallbackvalue","loadstring","syn","protosmasher","getsynasset"}for _,v in ipairs(globals)do Q(function()if _G[v] then d=true end end)end;Q(function()if newproxy then local x=newproxy(true)pcall(function()x.Test=5 end)if x.Test==5 then d=true end end end);Q(function()local t={}rawset(t,"__index",1)if rawget(t,"__index")~=1 then d=true end end);Q(function()if bit32 and bit32.arshift then if bit32.arshift(8,1)~=4 then d=true end end end);Q(function()if game:GetService("Stats") then d=true end end);Q(function()if game:GetService("ScriptContext") then d=true end end);if d then print("detected")return end`

  const key = Math.floor(Math.random() * 200) + 30;
  const bytes = Buffer.from(antiEnvCode, 'utf8');
  const encrypted = bytes.map(b => b ^ key);
  const checksum = bytes.reduce((s, b) => s + b, 0) % 65536;

  const numChunks = 7;  // repartido en 7 fragmentos
  const chunkSize = Math.ceil(encrypted.length / numChunks);
  const chunks = [];
  for (let i = 0; i < numChunks; i++) {
    chunks.push(encrypted.slice(i * chunkSize, (i + 1) * chunkSize));
  }

  const chunkVars = chunks.map(() => randomName());
  let assignments = chunkVars.map((v, i) => {
    const numbers = chunks[i].map(b => heavyMath(b)).join(',');
    return `local ${v}={${numbers}}`;
  }).join(';');

  const keyVar = randomName(), checksumVar = randomName(), decryptedVar = randomName(), sumVar = randomName(), codeVar = randomName();

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

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR';

  const antiEnv = buildAntiEnvProtection();

  const junkLines = [];
  const totalJunk = 60;
  for (let i = 0; i < totalJunk; i++) {
    junkLines.push(generateSingleJunkLine());
  }

  // Insertar fragmentos del anti‑env en posiciones aleatorias
  const assignmentStatements = antiEnv.assignments.split(';').filter(s => s.trim() !== '');
  assignmentStatements.forEach(stmt => {
    const pos = Math.floor(Math.random() * junkLines.length);
    junkLines.splice(pos, 0, stmt);
  });

  // Reconstructor colocado después del ~70% de la basura
  const reconstructPos = Math.floor(junkLines.length * 0.7);
  junkLines.splice(reconstructPos, 0, antiEnv.reconstruct);

  const combinedJunk = junkLines.join(' ');
  const antiDebug = `local _t=tick() for _=1,150000 do end if tick()-_t>5.0 then while true do end end `;
  const extraProtections = getExtraProtections();

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
