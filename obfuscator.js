const HEADER = `--[[ Code Protected by VVMer 3.0 ]]`

const HANDLER_POOL = [
  "h_a", "h_b", "h_c", "h_d", "h_e", "h_f", "h_g", "h_h", "h_i", "h_j",
  "KQ", "HF", "W8", "SX", "Rj", "nT", "pL", "qZ", "mV", "xB"
];

function generateIlName() {
  const prefix = ["abc_", "def_", "ghi_", "jkl_", "mno_", "pqr_"];
  const base = prefix[Math.floor(Math.random() * prefix.length)];
  const num = Math.floor(Math.random() * 99999);
  return `${base}${num}`;
}

function pickHandlers(count) {
  const used = new Set();
  const result = [];
  while (result.length < count) {
    const base = HANDLER_POOL[Math.floor(Math.random() * HANDLER_POOL.length)];
    const rand = Math.floor(Math.random() * 999);
    const name = `${base}_${rand}`;
    if (!used.has(name)) { 
      used.add(name); 
      result.push(name); 
    }
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

function mba() {
  let n = Math.random() > 0.5 ? 1 : 2;
  let a = Math.floor(Math.random() * 70) + 15;
  let b = Math.floor(Math.random() * 40) + 8;
  return `((${n}*${a}-${a})/(${b}+1)+${n})`;
}

// === BIT32 OPERATIONS (COMPATIBLE CON LUA) ===
function bit32XOR(a, b) {
  return (a ^ b) >>> 0;
}

function bit32AND(a, b) {
  return (a & b) >>> 0;
}

function bit32OR(a, b) {
  return (a | b) >>> 0;
}

function bit32LSHIFT(a, shift) {
  return (a << shift) >>> 0;
}

function bit32RSHIFT(a, shift) {
  return (a >>> shift) >>> 0;
}

function encryptChunk(chunk, key, iv, index) {
  let encrypted = [];
  for (let i = 0; i < chunk.length; i++) {
    const byte = chunk.charCodeAt(i);
    const keyByte = (key >>> (i % 4) * 8) & 0xFF;
    const ivByte = (iv >>> ((i + index) % 4) * 8) & 0xFF;
    
    let e1 = bit32XOR(byte, keyByte);
    let e2 = bit32XOR(e1, ivByte);
    let e3 = bit32LSHIFT((e2 + 127) & 0xFF, 1);
    let e4 = bit32OR(e3, bit32RSHIFT(e2, 7));
    
    encrypted.push(e4 & 0xFF);
  }
  return encrypted;
}

function mangleStatements(code) {
  let mangled = code;
  mangled = mangled.replace(/\n/g, ' ');
  mangled = mangled.replace(/;/g, ' ');
  return mangled;
}

function flattenControlFlow() {
  const stateVar = generateIlName();
  const blockVar = generateIlName();
  return `local ${stateVar}=1 local ${blockVar}={[1]=function() end} `;
}

function generateJunk(lines = 100) {
  let junk = '';
  for (let i = 0; i < lines; i++) {
    const r = Math.random();
    const varName = generateIlName();
    
    if (r < 0.15) {
      const a = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      junk += `local ${varName}=bit32.bxor(${a},${b}) `;
    } else if (r < 0.30) {
      const a = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      junk += `local ${varName}=bit32.band(${a},${b}) `;
    } else if (r < 0.45) {
      const a = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      junk += `local ${varName}=bit32.bor(${a},${b}) `;
    } else if (r < 0.60) {
      junk += `local ${varName}=${heavyMath(Math.floor(Math.random() * 999))} `;
    } else if (r < 0.75) {
      // CODE VAULT: Tarpit
      const tp = generateIlName();
      junk += `if type(nil)=="number" then while true do local ${tp}=1 end end `;
    } else if (r < 0.85) {
      // CODE VAULT: Symbol Waterfall
      const vt = generateIlName();
      junk += `do local ${vt}={} ${vt}["_"]=1 ${vt}=nil end `;
    } else {
      // CODE VAULT: Opaque Predicate
      junk += `if type(math.pi)=="string" then local _=1 end `;
    }
  }
  return junk;
}

function runtimeString(str) {
  let result = 'string.char(';
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    const xored = bit32XOR(code, 0xAA);
    bytes.push(`bit32.bxor(${xored},0xAA)`);
  }
  result += bytes.join(',') + ')';
  return result;
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

// === MÁQUINA VIRTUAL CON TÉCNICAS COMBINADAS ===
function buildVM(payloadStr) {
  const STACK = generateIlName();
  const KEY = generateIlName();
  const IV = generateIlName();
  const POOL = generateIlName();
  const ORDER = generateIlName();
  const SALT = generateIlName();
  
  const masterKey = Math.floor(Math.random() * 0xFFFFFFFF);
  const initIV = Math.floor(Math.random() * 0xFFFFFFFF);
  const saltVal = Math.floor(Math.random() * 250) + 1;
  
  let vmCore = `local ${STACK}={} local ${KEY}=${masterKey} local ${IV}=${initIV} local ${SALT}=${saltVal} `;
  
  const chunkSize = 15;
  let realChunks = [];
  for (let i = 0; i < payloadStr.length; i += chunkSize) {
    realChunks.push(payloadStr.slice(i, i + chunkSize));
  }
  
  let poolVars = [];
  let realOrder = [];
  let totalChunks = realChunks.length * 3;
  let currentReal = 0;
  let globalIndex = 0;
  
  for (let i = 0; i < totalChunks; i++) {
    const memName = generateIlName();
    poolVars.push(memName);
    
    if (currentReal < realChunks.length && (Math.random() > 0.45 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1);
      const chunk = realChunks[currentReal];
      const encrypted = encryptChunk(chunk, masterKey, initIV, currentReal);
      const encStr = encrypted.map(b => `${b}`).join(',');
      vmCore += `local ${memName}={${encStr}} `;
      currentReal++;
    } else {
      const fakeLen = Math.floor(Math.random() * 20) + 5;
      const fakeBytes = [];
      for (let j = 0; j < fakeLen; j++) {
        fakeBytes.push(Math.floor(Math.random() * 256));
      }
      vmCore += `local ${memName}={${fakeBytes.join(',')}} `;
    }
  }
  
  vmCore += `local ${POOL}={${poolVars.join(',')}} `;
  vmCore += `local ${ORDER}={${realOrder.join(',')}} `;
  
  const byteVar = generateIlName();
  const idxVar = generateIlName();
  
  vmCore += `local _gIdx=0 for _, ${idxVar} in ipairs(${ORDER}) do for _, ${byteVar} in ipairs(${POOL}[${idxVar}]) do `;
  vmCore += `if type(math.pi)=="string" then ${KEY}=(${KEY}+137)%256 end `;
  vmCore += `table.insert(${STACK},string.char(bit32.band(bit32.bxor(${byteVar},${KEY}),0xFF))) _gIdx=_gIdx+1 end end `;
  
  vmCore += `local _payload=table.concat(${STACK}) `;
  vmCore += `local _assert=assert local _load=loadstring `;
  vmCore += `_assert(_load(_payload))() `;
  
  return vmCore;
}

function buildSingleWrapper(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount);
  const realIdx = Math.floor(Math.random() * handlerCount);
  const DISPATCH = generateIlName();
  
  let out = `local lM={} `;
  
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx) {
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(3)} ${innerCode} end `;
    } else {
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(2)} return nil end `;
    }
  }
  
  out += `local ${DISPATCH}={`;
  for (let i = 0; i < handlers.length; i++) {
    out += `[${i + 1}]=${handlers[i]},`;
  }
  out += `} `;
  
  let execBlocks = [];
  for (let i = 0; i < handlers.length; i++) {
    execBlocks.push(`${DISPATCH}[${i + 1}](lM)`);
  }
  out += applyCFF(execBlocks);
  return out;
}

function build2xVM(payloadStr) {
  let vm = buildVM(payloadStr);
  for (let i = 0; i < 1; i++) {
    const handlerCount = Math.floor(Math.random() * 2) + 4;
    vm = buildSingleWrapper(vm, handlerCount);
  }
  return vm;
}

function getProtections() {
  const antiDebuggers =
    `local _adT=os.clock() for _=1,150000 do end if os.clock()-_adT>5.0 then while true do end end ` +
    `if debug~=nil and debug.getinfo then local _i=debug.getinfo(1) if _i.what~="main" and _i.what~="Lua" then while true do end end end `;

  const rawTampers = [
    `if math.pi<3.14 or math.pi>3.15 then error("!") end`,
    `if bit32 and bit32.bxor(10,5)~=15 then error("!") end`,
    `if type(tostring)~="function" then error("!") end`,
    `if not string.match("chk","^c.*k$") then error("!") end`,
    `if type(coroutine.create)~="function" then error("!") end`,
    `if type(table.concat)~="function" then error("!") end`,
    `if math.abs(-10)~=10 then error("!") end`,
    `if type(next)~="function" then error("!") end`,
    `if string.len("a")~=1 then error("!") end`
  ];

  let codeVaultGuards = "";
  for (let t of rawTampers) {
    const fnName = generateIlName();
    codeVaultGuards += `local ${fnName}=function() ${t} end ${fnName}() `;
  }

  return antiDebuggers + codeVaultGuards;
}

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR';
  
  let code = sourceCode;
  const mangled = mangleStatements(code);
  const flattened = flattenControlFlow();
  
  const protections = getProtections();
  const junkStart = generateJunk(50);
  const finalVM = build2xVM(mangled);
  
  const result = `${HEADER} ${junkStart} ${protections} ${flattened} ${finalVM}`;
  return result.replace(/\s+/g, " ").trim();
}

module.exports = { obfuscate };
