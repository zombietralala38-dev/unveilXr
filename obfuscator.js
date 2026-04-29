const HEADER = `--[[ PROTECTED BY VVNER HYPER-NESTED-VM & SILENT CORRUPTION SHIELD ]]`

const IL_POOL = [
  "IIIIIIII1", "vvvvvv1", "vvvvvvvv2", "vvvvvv3", "IIlIlIlI1", "lvlvlvlv2", "I1","l1","v1","v2","v3","II","ll","vv", "I2",
  "lIlIIl11", "IvIvIvI1", "O0O0O0O1", "l1l1l1l1", "IIllIIll", "v1v1v1v1", "lVlVlVl1", "iIiIiIi1", "llIlIlI1", "vVvVvV2",
  "IlIlIlI1", "lI1I1I1I", "v1l1v1l1", "I0I0I0I0", "lO10lO10", "vIvIvIvI", "i1i1i1i1", "l1lI1lI1", "II11II11", "vv11vv11",
  "lIlIlIl1", "vlvlvlv1", "I1I1I1I1", "V1V1V1V1", "i1I1v1l1", "lI1vI1l1", "I1l1V1i1", "v1I1L1l1", "l1V1i1I1"
]

const HANDLER_POOL = ["KQ","HF","W8","SX","Rj","nT","pL","qZ","mV","xB","yC","wD"]

// --- UTILIDADES ---
function generateIlName() {
  return IL_POOL[Math.floor(Math.random() * IL_POOL.length)] + Math.floor(Math.random() * 999999)
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

function runtimeString(str) {
  return `string.char(${str.split('').map(c => c.charCodeAt(0)).join(',')})`;
}

// --- PROTECCIONES AVANZADAS ---
function getExtraProtections() {
  const antiDebuggers =
    `local _adT=os.clock() for _=1,150000 do end if os.clock()-_adT>5.0 then while true do end end ` +
    `if debug~=nil and debug.getinfo then local _i=debug.getinfo(1) if _i.what~="main" and _i.what~="Lua" then while true do end end end ` +
    `local _adOk,_adE=pcall(function() error("__v") end) if not string.find(tostring(_adE),"__v") then while true do end end ` +
    `if getmetatable(_G)~=nil then while true do end end `;

  const rawTampers = [
    `if game:GetService("RunService"):IsStudio() then _err() end`,
    `if math.pi<3.14 or math.pi>3.15 then _err() end`,
    `if type(rawget)~="function" then _err() end`,
    `if string.byte("Z",1)~=90 then _err() end`,
    `if #game:GetService("Players"):GetPlayers()<0 then _err() end`
  ];

  let codeVaultGuards = "";
  for(let t of rawTampers) {
    const fnName = generateIlName();
    const errName = generateIlName();
    const injectedError = t.replace("_err()", `${errName}("!")`);
    codeVaultGuards += `local ${fnName}=function() local ${errName}=error ${injectedError} end ${fnName}() `;
  }
  return antiDebuggers + codeVaultGuards;
}

// --- LÓGICA DE VIRTUALIZACIÓN ---
function buildTrueVM(payloadStr) {
  const STACK = generateIlName(); const KEY = generateIlName(); 
  const ORDER = generateIlName(); const SALT = generateIlName();
  const seed = Math.floor(Math.random() * 200) + 50
  const saltVal = Math.floor(Math.random() * 250) + 1
  
  let vmCore = `local ${STACK}={} local ${KEY}=${seed} local ${SALT}=${saltVal} `
  const chunks = [];
  for(let i = 0; i < payloadStr.length; i += 15) { chunks.push(payloadStr.slice(i, i + 15)); }
  
  let poolVars = [];
  chunks.forEach((chunk, i) => {
    let memName = generateIlName(); poolVars.push(memName);
    let encrypted = chunk.split('').map((c, j) => (c.charCodeAt(0) + seed + ((i * 15 + j) * saltVal)) % 256);
    vmCore += `local ${memName}={${encrypted.join(',')}} `;
  });

  vmCore += `local _p={${poolVars.join(',')}} local _gIdx=0 for _, ${ORDER} in ipairs(_p) do for _, b in ipairs(${ORDER}) do `;
  vmCore += `if type(math.pi)=="string" then ${KEY}=(${KEY}+1) end `; // Silent Corruption
  vmCore += `table.insert(${STACK}, string.char((b - ${KEY} - _gIdx * ${SALT}) % 256)) _gIdx=_gIdx+1 end end `;
  
  const LOADSTRING = `getfenv()[${runtimeString("loadstring")}]`;
  vmCore += `${LOADSTRING}(table.concat(${STACK}))()`;
  return vmCore;
}

function buildNestedWrapper(innerCode) {
  const handlers = pickHandlers(3);
  const realIdx = Math.floor(Math.random() * handlers.length);
  const stateVar = generateIlName();
  
  let out = "";
  handlers.forEach((h, i) => {
    out += `local ${h}=function() ${i === realIdx ? innerCode : "return nil"} end `;
  });
  
  out += `local ${stateVar}=1 while true do `;
  handlers.forEach((h, i) => {
    out += `if ${stateVar}==${i+1} then ${h}() ${stateVar}=${i+2} `;
  });
  out += `elseif ${stateVar}>${handlers.length} then break end end `;
  return out;
}

// --- FUNCIÓN PRINCIPAL ---
function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR';
  
  // 1. Capas iniciales
  const antiDebug = `local _t=os.clock() for _=1,100000 do end if os.clock()-_t>2.0 then while true do end end `;
  const extraProtections = getExtraProtections();
  
  // 2. Construir VM núcleo
  let vm = buildTrueVM(sourceCode);
  
  // 3. Anidar 18 veces para máxima protección
  for (let i = 0; i < 18; i++) {
    vm = buildNestedWrapper(vm);
  }
  
  const result = `${HEADER} ${antiDebug} ${extraProtections} ${vm}`;
  return result.replace(/\s+/g, " ").trim();
}

module.exports = { obfuscate }
