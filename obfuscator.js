const HEADER = `--[[ this code it's protected by vvmer obfos ]]`;

const IL_POOL = ["IIIIIIII1", "vvvvvv1", "vvvvvvvv2", "vvvvvv3", "IIlIlIlI1", "lvlvlvlv2", "I1","l1","v1","v2","v3","II","ll","vv", "I2"];
const HANDLER_POOL = ["KQ","HF","W8","SX","Rj","nT","pL","qZ","mV","xB","yC","wD"];
const LOCKER_POOL = ["L0CK","TR4P","H0N3Y","P0T","SN4R3","F4K3","D3C0Y","B41T","M1M1C","GH0ST"];

function generateIlName() {
  return IL_POOL[Math.floor(Math.random() * IL_POOL.length)] + Math.floor(Math.random() * 99999);
}
function generateLockerName() {
  return LOCKER_POOL[Math.floor(Math.random() * LOCKER_POOL.length)] + Math.floor(Math.random() * 9999);
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

// ═══════════════════════════════════════════════════════════════
// ANTI-DEBUG LOCKER – inofensivo (sin bloqueos ni bucles)
// ═══════════════════════════════════════════════════════════════
function buildAntiDebugLocker(innerCode) {
  const LOCKER_KEY = generateLockerName();
  const TRAP_DOOR = generateLockerName();
  const GUARDIAN = generateLockerName();
  const SENTINEL = generateLockerName();
  const WARDEN = generateLockerName();

  const antiTamper = `
    local ${LOCKER_KEY} = ${heavyMath(Math.floor(Math.random() * 9999) + 1000)}
    local ${TRAP_DOOR} = function()
      -- capa anti-tamper desactivada
    end
  `;

  const infiniteVMTrap = `
    local ${GUARDIAN} = function()
      local vm_stack = {}
      for i = 1, 1000 do table.insert(vm_stack, math.random(1, 256)) end
      return vm_stack
    end
  `;

  const antiHook = `
    local ${SENTINEL} = function()
      local original_clock = os.clock()
      for _ = 1, 10000 do end
      if os.clock() - original_clock > 10 then
        -- ralentización detectada, pero seguimos
      end
      local test_func = function() return true end
      local ok, result = pcall(string.dump, test_func)
    end
  `;

  const envValidation = `
    local ${WARDEN} = function()
      if getfenv and _G ~= getfenv(0) then
        -- entorno alterado, nada pasa
      end
    end
  `;

  const decisionLogic = `
    ${TRAP_DOOR}()
    ${GUARDIAN}()
    ${SENTINEL}()
    ${WARDEN}()
    
    -- Si llegamos aquí, todo está bien, ejecutar el payload
    ${innerCode}
  `;

  return antiTamper + infiniteVMTrap + antiHook + envValidation + decisionLogic;
}

// ═══════════════════════════════════════════════════════════════
// CODE VAULT: fragmentación extrema del mensaje secreto
// ═══════════════════════════════════════════════════════════════
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
  fragmentationCode += `local _fragCount = 0 `;

  const shuffled = [...fragVars].sort(() => Math.random() - 0.5);

  for (let cycle = 0; cycle < 50; cycle++) {
    for (const frag of shuffled) {
      const scrambledName = generateIlName();
      fragmentationCode += `local ${scrambledName} = ${frag.code} `;
      fragmentationCode += `if ${scrambledName} ~= ${heavyMath(frag.original.charCodeAt(0))} then local _err = 1 end `;
      fragmentationCode += `_fragCount = _fragCount + 1 `;
    }
  }

  fragmentationCode += `local _secretMsg = "" `;
  fragmentationCode += `local _idx = 1 `;

  const reconstructVars = fragVars.map(f => f.name);
  fragmentationCode += `local _chars = {${reconstructVars.map(v => v).join(',')}} `;

  for (let i = 0; i < chars.length; i++) {
    fragmentationCode += `_secretMsg = _secretMsg .. string.char(_chars[${i+1}]) `;
  }

  return {
    code: fragmentationCode,
    totalFragments: totalPartsStr,
    msgVarNames: reconstructVars
  };
}

// VM verdadera con Rolling XOR + Salt (CODE VAULT)
function buildTrueVM(payloadStr) {
  const STACK = generateIlName(); const KEY = generateIlName(); const ORDER = generateIlName();
  const SALT = generateIlName();

  const seed = Math.floor(Math.random() * 200) + 50;
  const saltVal = Math.floor(Math.random() * 250) + 1;

  let vmCore = `local ${STACK}={} local ${KEY}=${heavyMath(seed)} local ${SALT}=${heavyMath(saltVal)} `;
  const chunkSize = 15; let realChunks = [];
  for(let i = 0; i < payloadStr.length; i += chunkSize) { realChunks.push(payloadStr.slice(i, i + chunkSize)); }
  let poolVars = []; let realOrder = [];
  let totalChunks = realChunks.length * 3; let currentReal = 0; let globalIndex = 0;

  for(let i = 0; i < totalChunks; i++) {
    let memName = generateIlName(); poolVars.push(memName);
    if (currentReal < realChunks.length && (Math.random() > 0.5 || (totalChunks - i) === (realChunks.length - currentReal))) {
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
      let fakeBytes = []; let fakeLen = Math.floor(Math.random() * 20) + 5;
      for(let j = 0; j < fakeLen; j++) { fakeBytes.push(heavyMath(Math.floor(Math.random() * 255))); }
      vmCore += `local ${memName}={${fakeBytes.join(',')}} `;
    }
  }

  vmCore += `local _pool={${poolVars.join(',')}} local ${ORDER}={${realOrder.map(n => heavyMath(n)).join(',')}} `;
  const idxVar = generateIlName(); const byteVar = generateIlName();

  vmCore += `local _gIdx=0 for _, ${idxVar} in ipairs(${ORDER}) do for _, ${byteVar} in ipairs(_pool[${idxVar}]) do `;
  vmCore += `if type(math.pi)=="string" then ${KEY}=(${KEY}+137)%256 end `;
  vmCore += `table.insert(${STACK}, string.char(math.floor((${byteVar} - ${KEY} - _gIdx * ${SALT}) % 256))) _gIdx=_gIdx+1 end end `;

  vmCore += `local _e = table.concat(${STACK}) ${STACK}=nil `;
  return vmCore;
}

function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount); const realIdx = Math.floor(Math.random() * handlerCount);
  const DISPATCH = generateIlName(); let out = `local lM={} `;
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx) { out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(5)} ${innerCode} end `; }
    else { out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(3)} return nil end `; }
  }
  out += `local ${DISPATCH}={`;
  for (let i = 0; i < handlers.length; i++) { out += `[${heavyMath(i + 1)}]=${handlers[i]},`; }
  out += `} `;
  let execBlocks = []; for (let i = 0; i < handlers.length; i++) { execBlocks.push(`${DISPATCH}[${heavyMath(i + 1)}](lM)`); }
  out += applyCFF(execBlocks); return out;
}

function build18xVM(payloadStr) {
  let vm = buildTrueVM(payloadStr);
  for (let i = 0; i < 17; i++) {
    vm = buildSingleVM(vm, Math.floor(Math.random() * 2) + 3);
  }
  return vm;
}

// generateJunk sin bucles infinitos
function generateJunk(lines = 100) {
  let j = '';
  for (let i = 0; i < lines; i++) {
    const r = Math.random();
    if (r < 0.2) j += `local ${generateIlName()}=${heavyMath(Math.floor(Math.random() * 999))} `;
    else if (r < 0.4) j += `local ${generateIlName()}=string.char(${heavyMath(Math.floor(Math.random()*255))}) `;
    else if (r < 0.5) j += `if not(${heavyMath(1)}==${heavyMath(1)}) then local x=1 end `;
    else if (r < 0.7) {
      const tp = generateIlName();
      j += `local ${tp}=1 `;
    } else if (r < 0.85) {
      const vt = generateIlName();
      j += `do local ${vt}={} ${vt}["_"]=1 ${vt}=nil end `;
    } else {
      j += `local _=1 `;
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

// Protections extra – sin errores de sintaxis
function getExtraProtections() {
  const antiDebuggers =
    `local _adT=os.clock() for _=1,150000 do end if os.clock()-_adT>5.0 then -- debugger? seguimos igual end ` +
    `if debug~=nil and debug.getinfo then local _i=debug.getinfo(1) if _i.what~="main" and _i.what~="Lua" then _i=nil end end ` +
    `local _adOk,_adE=pcall(function() error("__v") end) if not string.find(tostring(_adE),"__v") then _adE=nil end `;

  const guards = [
    `if math.pi<3.14 or math.pi>3.15 then else end`,
    `if bit32 and bit32.bxor(10,5)~=15 then else end`,
    `if type(tostring)~="function" then else end`,
    `if not string.match("chk","^c.*k$") then else end`,
    `if type(coroutine.create)~="function" then else end`,
    `if type(table.concat)~="function" then else end`,
  ];

  let codeVaultGuards = "";
  for(let guard of guards) {
    const fnName = generateIlName();
    codeVaultGuards += `local ${fnName}=function() ${guard} end ${fnName}() `;
  }

  return antiDebuggers + codeVaultGuards;
}

// ═════════════════════════════════════════
// PAYLOAD INOFENSIVO (sin os.exit ni anti-debug)
// ═════════════════════════════════════════
const SAFE_PAYLOAD = `
local logger = function()
    for i = 1, 100 do
        print("I like Rick and Morty")
    end
end
logger()

local s = "I really like Rick and Morty"
local function p10()
    for i = 1, 10 do
        print(s)
    end
end
p10()
`;

// ═════════════════════════════════════════
// FUNCIONES AUXILIARES: hoist, mangle, embed
// ═════════════════════════════════════════
function embedRuntimeWrapper(vmCore) {
  const runtimeName = generateIlName();
  // loader compatible con LuaJIT y Lua 5.1+
  const runtimeCode = `
    local ${runtimeName} = function(code)
      local f, err = (loadstring or load)(code)
      if not f then return end
      return f()
    end
    ${runtimeName}([=[${vmCore}]=])
  `;
  return runtimeCode;
}

function hoistLocals(luaCode) {
  const localPattern = /\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)\b(?!\s*[\[\.])/g;
  const localsFound = new Set();
  let match;
  while ((match = localPattern.exec(luaCode)) !== null) {
    localsFound.add(match[1]);
  }
  if (localsFound.size === 0) return luaCode;

  const hoistedDecl = 'local ' + Array.from(localsFound).join(', ') + ';\n';
  let hoistedCode = luaCode.replace(/\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)\b(?!\s*[\[\.])/g, '$1');
  return hoistedDecl + hoistedCode;
}

function mangleStatements(luaCode) {
  let lines = luaCode.split('\n');
  const mangled = lines.map(line => {
    // solo añadimos basura, sin romper estructuras
    if (Math.random() < 0.3 && line.trim() !== '') {
      const junkVar = generateIlName();
      return `local ${junkVar}=${heavyMath(Math.floor(Math.random()*1000))}; ${line}`;
    }
    return line;
  });
  return mangled.join('\n');
}

// ═════════════════════════════════════════
// FUNCIÓN PRINCIPAL DE OFUSCACIÓN
// ═════════════════════════════════════════
function obfuscate(sourceCode) {
  if (!sourceCode) sourceCode = SAFE_PAYLOAD;

  let basePayload = sourceCode;
  basePayload = hoistLocals(basePayload);

  const SECRET_MSG = "I really like Rick and Morty";
  const TOTAL_PARTS = "2818373738388392919173737627272727363817256367292822";
  const { code: fragmentCode, msgVarNames } = extremeFragment(SECRET_MSG, TOTAL_PARTS);

  let modifiedPayload = basePayload;

  modifiedPayload = modifiedPayload.replace(
    /local s = "I really like Rick and Morty"/,
    `--[=[ ORIGINAL MESSAGE FRAGMENTED INTO ${TOTAL_PARTS} PARTS ]=] ${fragmentCode} local s = _secretMsg`
  );

  modifiedPayload = modifiedPayload.replace(
    /local logger = function\(\)/,
    `--[=[ MSG_VARS: ${msgVarNames.join(',')} ]=] local logger = function()`
  );

  modifiedPayload = mangleStatements(modifiedPayload);

  const antiDebug = `local _clk=os.clock local _t=_clk() for _=1,150000 do end if os.clock()-_t>5.0 then -- seguir end `;
  const extraProtections = getExtraProtections();

  const finalVM = build18xVM(modifiedPayload);
  const runtimeWrapped = embedRuntimeWrapper(finalVM);
  const lockedCode = buildAntiDebugLocker(runtimeWrapped);

  const result = `${HEADER} ${generateJunk(50)} ${antiDebug} ${lockedCode}`;
  return result.replace(/\s+/g, " ").trim();
}

module.exports = { obfuscate };

if (require.main === module) {
  const obfuscatedCode = obfuscate();
  console.log(obfuscatedCode);
}
