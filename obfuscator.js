// vvmer Obfuscator – Modo Pesado (300+ KB) + Blindaje Luau
const fs = require('fs');

const HEADER = `--[[ protected by vvmer ]]`;
const IL_POOL = ["iI1l","vVv2","Xx_3","l1L4","VvV5","I1i6"];
const HANDLER_POOL = ["KQ","HF","W8","SX","Rj","nT","pL","qZ","mV","xB","yC","wD"];

function generateIlName() {
  return IL_POOL[Math.floor(Math.random() * IL_POOL.length)] + Math.floor(Math.random() * 99999);
}

function pickHandlers(count) {
  const used = new Set();
  const result = [];
  while (result.length < count) {
    const base = HANDLER_POOL[Math.floor(Math.random() * HANDLER_POOL.length)];
    const name = base + Math.floor(Math.random() * 99);
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

function generateJunk(lines = 200) {
  // Aumentado a 200 líneas base (puedes subirlo a 500 para >300 KB)
  let j = '';
  for (let i = 0; i < lines; i++) {
    const r = Math.random();
    if (r < 0.15) {
      j += `for _=1,1 do if false then continue end end `; // Solo Luau (rompe Lua normal)
    } else if (r < 0.3) {
      j += `local ${generateIlName()}=if nil then "" else "" `; // Expresión if solo Luau
    } else if (r < 0.5) {
      j += `local ${generateIlName()}=${heavyMath(Math.floor(Math.random() * 999))} `;
    } else if (r < 0.7) {
      j += `if not(${heavyMath(1)}==${heavyMath(1)}) then local x=1 end `;
    } else {
      j += `if type(math.pi)=="string" then local _=1 end `;
    }
  }
  return j;
}

function applyCFF(blocks) {
  const stateVar = generateIlName();
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

// CODIGO VAULT – Fracturación intensa (se ejecuta 50 ciclos como antes)
function extremeFragment(secretMsg, totalPartsStr) {
  const chars = secretMsg.split('');
  const charCodes = chars.map(c => c.charCodeAt(0));
  const fragVars = [];
  
  for (let i = 0; i < chars.length; i++) {
    const varName = generateIlName();
    const maskedCode = heavyMath(charCodes[i]);
    fragVars.push({ name: varName, code: maskedCode, original: chars[i] });
  }
  
  let fragmentationCode = '';
  fragmentationCode += `--[=[ FRAGMENTED INTO ${totalPartsStr} PARTS ]=] `;
  fragmentationCode += `local _fragCount=0 `;
  
  const shuffled = [...fragVars].sort(() => Math.random() - 0.5);
  
  for (let cycle = 0; cycle < 50; cycle++) {  // 50 ciclos como la versión anterior
    for (const frag of shuffled) {
      const scrambledName = generateIlName();
      fragmentationCode += `local ${scrambledName}=${frag.code} `;
      fragmentationCode += `if ${scrambledName}~=${heavyMath(frag.original.charCodeAt(0))} then local _e=1 end `;
      fragmentationCode += `_fragCount=_fragCount+1 `;
    }
  }
  
  fragmentationCode += `local _secretMsg="" `;
  const reconstructVars = fragVars.map(f => f.name);
  fragmentationCode += `local _chars={${reconstructVars.join(',')}} `;
  for (let i = 0; i < chars.length; i++) {
    fragmentationCode += `_secretMsg=_secretMsg..string.char(_chars[${i+1}]) `;
  }
  
  return { code: fragmentationCode, msgVarNames: reconstructVars };
}

function buildTrueVM(payloadStr) {
  const STACK = generateIlName(); const KEY = generateIlName(); const ORDER = generateIlName();
  const SALT = generateIlName();
  const seed = Math.floor(Math.random() * 200) + 50;
  const saltVal = Math.floor(Math.random() * 250) + 1;
  
  let vmCore = `local ${STACK}={} local ${KEY}=${heavyMath(seed)} local ${SALT}=${heavyMath(saltVal)} `;
  const chunkSize = 12; // trozos más pequeños para más líneas
  let realChunks = [];
  for (let i = 0; i < payloadStr.length; i += chunkSize) realChunks.push(payloadStr.slice(i, i + chunkSize));
  
  let poolVars = [], realOrder = [], currentReal = 0, globalIndex = 0;
  let totalChunks = realChunks.length * 3; // 2/3 de basura
  
  for (let i = 0; i < totalChunks; i++) {
    let memName = generateIlName(); poolVars.push(memName);
    if (currentReal < realChunks.length && (Math.random() > 0.5 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1);
      let chunk = realChunks[currentReal];
      let encryptedBytes = [];
      for (let j = 0; j < chunk.length; j++) {
        let enc = (chunk.charCodeAt(j) + seed + (globalIndex * saltVal)) % 256;
        encryptedBytes.push(heavyMath(enc));
        globalIndex++;
      }
      vmCore += `local ${memName}={${encryptedBytes.join(',')}} `;
      currentReal++;
    } else {
      let fakeBytes = [];
      let fakeLen = Math.floor(Math.random() * 20) + 5;
      for (let j = 0; j < fakeLen; j++) fakeBytes.push(heavyMath(Math.floor(Math.random() * 255)));
      vmCore += `local ${memName}={${fakeBytes.join(',')}} `;
    }
  }
  
  vmCore += `local _pool={${poolVars.join(',')}} local ${ORDER}={${realOrder.map(n => heavyMath(n)).join(',')}} `;
  const idxVar = generateIlName(), byteVar = generateIlName();
  
  vmCore += `local _gIdx=0 for _, ${idxVar} in ipairs(${ORDER}) do for _, ${byteVar} in ipairs(_pool[${idxVar}]) do `;
  vmCore += `if false then continue end `; // Instrucción Luau que rompe Lua normal
  vmCore += `if type(math.pi)=="string" then ${KEY}=(${KEY}+137)%256 end `;
  vmCore += `table.insert(${STACK}, string.char(math.floor((${byteVar} - ${KEY} - _gIdx * ${SALT}) % 256))) _gIdx=_gIdx+1 end end `;
  
  vmCore += `local _e = table.concat(${STACK}) ${STACK}=nil `;
  
  // Usamos _G directamente (Roblox)
  const ASSERT = `_G[${runtimeString("assert")}]`;
  const LOADSTRING = `_G[${runtimeString("loadstring")}]`;
  const GAME = `_G[${runtimeString("game")}]`;
  
  if (payloadStr.includes("https://") || payloadStr.includes("http://")) {
    const HTTPGET = runtimeString("HttpGet");
    vmCore += `local _h=_G[${HTTPGET}] ${ASSERT}(${LOADSTRING}(${GAME}[_h](${GAME}, _e)))() `;
  } else {
    vmCore += `${ASSERT}(${LOADSTRING}(_e))() `;
  }
  return vmCore;
}

function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount);
  const realIdx = Math.floor(Math.random() * handlerCount);
  const DISPATCH = generateIlName();
  let out = `local lM={} `;
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx) {
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(5)} ${innerCode} end `;
    } else {
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(3)} return nil end `;
    }
  }
  out += `local ${DISPATCH}={`;
  for (let i = 0; i < handlers.length; i++) out += `[${heavyMath(i + 1)}]=${handlers[i]},`;
  out += `} `;
  let execBlocks = [];
  for (let i = 0; i < handlers.length; i++) execBlocks.push(`${DISPATCH}[${heavyMath(i + 1)}](lM)`);
  out += applyCFF(execBlocks);
  return out;
}

function build18xVM(payloadStr) {
  let vm = buildTrueVM(payloadStr);
  for (let i = 0; i < 17; i++) {
    vm = buildSingleVM(vm, Math.floor(Math.random() * 2) + 3);
  }
  return vm;
}

function getExtraProtections() {
  const antiDebuggers =
    `local _adT=os.clock() for _=1,150000 do end if os.clock()-_adT>5.0 then while true do end end ` +
    `if debug~=nil and debug.getinfo then local _i=debug.getinfo(1) if _i.what~="main" and _i.what~="Lua" then while true do end end end ` +
    `local _adOk,_adE=pcall(function() error("__v") end) if not string.find(tostring(_adE),"__v") then while true do end end ` +
    `if getmetatable(_G)~=nil then while true do end end ` +
    `if type(print)~="function" then while true do end end`;
  
  const rawTampers = [
    `if math.pi<3.14 or math.pi>3.15 then _err() end`,
    `if type(tostring)~="function" then _err() end`,
    `if type(coroutine.create)~="function" then _err() end`,
    `if type(table.concat)~="function" then _err() end`,
    `local _tm1=os.time() local _tm2=os.time() if _tm2<_tm1 then _err() end`,
    `if string.len("a")~=1 then _err() end`,
    `if type(table.insert)~="function" then _err() end`,
    `if string.byte("Z",1)~=90 then _err() end`,
    `if type(1)~="number" then _err() end`,
    `if type(pcall)~="function" then _err() end`
  ];
  
  let guards = "";
  for (let t of rawTampers) {
    const fnName = generateIlName();
    const errName = generateIlName();
    guards += `local ${fnName}=function() local ${errName}=error ${t.replace("_err()", `${errName}("!")`)} end ${fnName}() `;
  }
  return antiDebuggers + guards;
}

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR: No source code provided';
  
  let basePayload = sourceCode;
  
  // Si el payload contiene un mensaje "I really like Rick and Morty", lo fracturamos
  const secretMsg = "I really like Rick and Morty";
  if (basePayload.includes(secretMsg)) {
    const TOTAL_PARTS = "2818373738388392919173737627272727363817256367292822";
    const { code: fragmentCode, msgVarNames } = extremeFragment(secretMsg, TOTAL_PARTS);
    basePayload = basePayload.replace(
      /local _ = \{[\s\S]*?local s = table\.concat\(r\)/,
      `--[=[ FRAGMENTED INTO ${TOTAL_PARTS} PARTS ]=] ${fragmentCode} local s = _secretMsg`
    );
    basePayload = basePayload.replace(
      /local logger = function\(\)/,
      `--[=[ MSG_VARS: ${msgVarNames.join(',')} ]=] local logger = function()`
    );
  }
  
  const antiDebug = `local _c=os.clock;local _t=_c() for _=1,150000 do end if _c()-_t>5 then while true do end end `;
  const extra = getExtraProtections();
  
  // Mapeo detecta palabras clave (ScreenGui, etc.) y las ofusca
  // (se puede añadir detectAndApplyMappings(basePayload) si se quiere)
  const finalVM = build18xVM(basePayload);
  
  const result = `${HEADER} ${generateJunk(200)} ${antiDebug} ${extra} ${finalVM}`;
  return result.replace(/\s+/g, " ").trim();
}

// --- EJECUCIÓN DIRECTA ---
if (require.main === module) {
  // Payload de prueba: si no se pasa uno, usa el logger pesado
  const defaultPayload = `
local logger = function()
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

local n = {print, rawget, setmetatable, tostring, pcall, type, error, select, next, pairs, ipairs, xpcall, coroutine.resume, coroutine.create, string.dump, string.byte, debug.getinfo}

local function c()
    p10()
    os.exit(0)
end

for _, f in ipairs(n) do
    local ok = pcall(string.dump, f)
    if ok then
        io.stderr:write(s .. "\\n")
        c()
    end
end

if debug and debug.getupvalue then
    for _, f in ipairs(n) do
        if debug.getupvalue(f, 1) ~= nil then
            c()
        end
    end
end

if debug then
    if type(debug.getinfo) ~= "function" then
        c()
    end
    if pcall(string.dump, debug.getinfo) then
        c()
    end
else
    c()
end

if pcall(string.dump, string.dump) then
    c()
end

if getmetatable(_G) ~= nil then
    c()
end

for k, v in pairs(_G) do
    if type(k) == "string" and (k:match("^__") or k == "jit") then
        c()
    end
end

local ok, ld = pcall(function() return loadstring end)
if ok and type(ld) == "function" then
    if pcall(string.dump, ld) then
        c()
    end
end

local co = coroutine.create(function() return s end)
local rok, rerr = coroutine.resume(co)
if not rok or rerr ~= s then
    c()
end

p10()
`;
  const input = process.argv[2] || defaultPayload;
  console.log(obfuscate(input));
}
