const HEADER = `--[[ Code Protected by VVMer 3.0 ]]`

// === GENERADOR DE NOMBRES SEGUROS ===
const IL_POOL = [
  "abc_x", "def_y", "ghi_z", "jkl_w", "mno_v", "pqr_u", "stu_t",
  "vwx_s", "yz_r", "alpha_q", "beta_p", "gamma_o", "delta_n"
];

const HANDLER_POOL = [
  "h_a", "h_b", "h_c", "h_d", "h_e", "h_f", "h_g", "h_h", "h_i", "h_j"
];

function generateIlName() {
  const base = IL_POOL[Math.floor(Math.random() * IL_POOL.length)];
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

function bit32ROT(a, shift) {
  return bit32OR(bit32LSHIFT(a, shift), bit32RSHIFT(a, 32 - shift));
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

// === TÉCNICA 1: EMBED RUNTIME ===
function embedRuntime() {
  return `local _rt=function(x) if x=="assert" then return assert end if x=="loadstring" then return loadstring end return nil end `;
}

// === TÉCNICA 2: MANGLE STATEMENTS ===
function mangleStatements(code) {
  let mangled = code;
  mangled = mangled.replace(/\n/g, ' ');
  mangled = mangled.replace(/;/g, ' ');
  return mangled;
}

// === TÉCNICA 3: FLATTEN CONTROL FLOW ===
function flattenControlFlow() {
  const stateVar = generateIlName();
  const blockVar = generateIlName();
  return `local ${stateVar}=1 local ${blockVar}={[1]=function() end} `;
}

// === JUNK CODE CON BIT32 ===
function generateJunk(lines = 50) {
  let junk = '';
  for (let i = 0; i < lines; i++) {
    const r = Math.random();
    const varName = generateIlName();
    
    if (r < 0.20) {
      const a = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      junk += `local ${varName}=bit32.bxor(${a},${b}) `;
    } else if (r < 0.40) {
      const a = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      junk += `local ${varName}=bit32.band(${a},${b}) `;
    } else if (r < 0.60) {
      const a = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      junk += `local ${varName}=bit32.bor(${a},${b}) `;
    } else if (r < 0.75) {
      const a = Math.floor(Math.random() * 16);
      const b = Math.floor(Math.random() * 4);
      junk += `local ${varName}=bit32.lshift(${a},${b}) `;
    } else if (r < 0.85) {
      const a = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 4);
      junk += `local ${varName}=bit32.rshift(${a},${b}) `;
    } else {
      junk += `if true then local ${varName}=0 end `;
    }
  }
  return junk;
}

// === RUNTIME STRING (SIN CRYPTO) ===
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

// === MÁQUINA VIRTUAL FUERTE ===
function buildVM(payloadStr) {
  const STACK = generateIlName();
  const KEY = generateIlName();
  const IV = generateIlName();
  const POOL = generateIlName();
  const ORDER = generateIlName();
  
  const masterKey = Math.floor(Math.random() * 0xFFFFFFFF);
  const initIV = Math.floor(Math.random() * 0xFFFFFFFF);
  
  let vmCore = `local ${STACK}={} local ${KEY}=${masterKey} local ${IV}=${initIV} `;
  
  const chunkSize = 20;
  let realChunks = [];
  for (let i = 0; i < payloadStr.length; i += chunkSize) {
    realChunks.push(payloadStr.slice(i, i + chunkSize));
  }
  
  let poolVars = [];
  let realOrder = [];
  let totalChunks = realChunks.length * 3;
  let currentReal = 0;
  
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
      const fakeLen = Math.floor(Math.random() * 25) + 8;
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
  
  vmCore += `for _, ${idxVar} in ipairs(${ORDER}) do for _, ${byteVar} in ipairs(${POOL}[${idxVar}]) do `;
  vmCore += `table.insert(${STACK},string.char(bit32.band(bit32.bxor(${byteVar},${KEY}),0xFF))) end end `;
  
  vmCore += `local _payload=table.concat(${STACK}) `;
  vmCore += `local _assert=assert local _load=loadstring `;
  vmCore += `_assert(_load(_payload))() `;
  
  return vmCore;
}

// === WRAPPER VM ANIDADA (SOLO 2 CAPAS) ===
function buildSingleWrapper(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount);
  const realIdx = Math.floor(Math.random() * handlerCount);
  const DISPATCH = generateIlName();
  
  let out = `local ${DISPATCH}={} `;
  
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx) {
      out += `${DISPATCH}[${i}]=function() ${innerCode} end `;
    } else {
      out += `${DISPATCH}[${i}]=function() return nil end `;
    }
  }
  
  out += `${DISPATCH}[${realIdx}]() `;
  return out;
}

// === BUILD 2 VMS ANIDADAS ===
function build2xVM(payloadStr) {
  let vm = buildVM(payloadStr);
  for (let i = 0; i < 1; i++) {
    const handlerCount = Math.floor(Math.random() * 2) + 4;
    vm = buildSingleWrapper(vm, handlerCount);
  }
  return vm;
}

// === PROTECCIONES BÁSICAS ===
function getProtections() {
  return `if bit32.band(0xFFFFFFFF,0xFFFFFFFF)~=0xFFFFFFFF then while true do end end `;
}

// === OBFUSCADOR PRINCIPAL ===
function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR';
  
  // Aplicar las 3 técnicas
  let code = sourceCode;
  const runtime = embedRuntime();
  const mangled = mangleStatements(code);
  const flattened = flattenControlFlow();
  
  const protections = getProtections();
  const junkStart = generateJunk(30);
  const finalVM = build2xVM(mangled);
  
  const result = `${HEADER} ${runtime} ${junkStart} ${protections} ${flattened} ${finalVM}`;
  return result.replace(/\s+/g, " ").trim();
}

module.exports = { obfuscate };
