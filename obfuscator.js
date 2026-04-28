const HEADER = `--[[ Code Protected by VVMer 2.0 - Enterprise Grade Encryption ]]`

// === GENERADOR DE NOMBRES OFUSCADOS ===
const IL_POOL = [
  "llllllll", "IIIIIIII", "llIIllII", "IIllIIll", "lIlIlIlI", "IlIlIlIl",
  "lllIlIll", "IIIlllII", "lIIlIIIl", "IlllIlll", "llIlIlII", "IIllllll"
];

const HANDLER_POOL = [
  "xK", "yP", "zQ", "aM", "bN", "cR", "dS", "eT", "fU", "gV", "hW", "iX",
  "jY", "kZ", "lA", "mB", "nC", "oD", "pE", "qF", "rG", "sH", "tI", "uJ"
];

function generateIlName() {
  const base = IL_POOL[Math.floor(Math.random() * IL_POOL.length)];
  const num = Math.floor(Math.random() * 999999);
  const suffix = Math.random().toString(36).substring(7);
  return `${base}_${num}_${suffix}`;
}

function pickHandlers(count) {
  const used = new Set();
  const result = [];
  while (result.length < count) {
    const base = HANDLER_POOL[Math.floor(Math.random() * HANDLER_POOL.length)];
    const rand = Math.floor(Math.random() * 999999);
    const name = `${base}_${rand}`;
    if (!used.has(name)) { 
      used.add(name); 
      result.push(name); 
    }
  }
  return result;
}

// === ENCRIPTACIÓN FUERTE CON BIT32 ===
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
    
    let encrypted1 = bit32XOR(byte, keyByte);
    let encrypted2 = bit32XOR(encrypted1, ivByte);
    let encrypted3 = bit32LSHIFT((encrypted2 + 127) & 0xFF, 1);
    let encrypted4 = bit32OR(encrypted3, bit32RSHIFT(encrypted2, 7));
    
    encrypted.push(encrypted4 & 0xFF);
  }
  return encrypted;
}

function generateKeySchedule(masterKey) {
  let schedule = [];
  for (let i = 0; i < 256; i++) {
    const val = bit32XOR(masterKey, i);
    const rotated = bit32LSHIFT(val & 0xFF, 3) | bit32RSHIFT(val & 0xFF, 5);
    schedule.push(rotated >>> 0);
  }
  return schedule;
}

// === JUNK CODE CON BIT32 (SIN MATH DÉBIL) ===
function generateJunk(lines = 100) {
  let junk = '';
  for (let i = 0; i < lines; i++) {
    const r = Math.random();
    const varName = generateIlName();
    
    if (r < 0.15) {
      // Operación bit32.bxor
      junk += `local ${varName}=bit32.bxor(${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)}) `;
    } else if (r < 0.30) {
      // Operación bit32.band
      junk += `local ${varName}=bit32.band(${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)}) `;
    } else if (r < 0.45) {
      // Operación bit32.bor
      junk += `local ${varName}=bit32.bor(${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)}) `;
    } else if (r < 0.60) {
      // Operación bit32.lshift
      junk += `local ${varName}=bit32.lshift(${Math.floor(Math.random() * 16)},${Math.floor(Math.random() * 8)}) `;
    } else if (r < 0.75) {
      // Operación bit32.rshift
      junk += `local ${varName}=bit32.rshift(${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 8)}) `;
    } else if (r < 0.85) {
      // Tarpit - código muerto
      const loopVar = generateIlName();
      junk += `if bit32.bxor(1,1)==0 then for ${loopVar}=1,1 do end end `;
    } else {
      // Opaque predicate con bit32
      junk += `if bit32.band(255,255)==255 then local ${varName}=0 end `;
    }
  }
  return junk;
}

// === MÁQUINA VIRTUAL FUERTE ===
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

function buildTrueVM(payloadStr) {
  const STACK = generateIlName();
  const KEY = generateIlName();
  const IV = generateIlName();
  const INDEX = generateIlName();
  const POOL = generateIlName();
  const ORDER = generateIlName();
  
  const masterKey = Math.floor(Math.random() * 0xFFFFFFFF);
  const initIV = Math.floor(Math.random() * 0xFFFFFFFF);
  
  let vmCore = `local ${STACK}={} local ${KEY}=${masterKey} local ${IV}=${initIV} local ${INDEX}=0 `;
  
  const chunkSize = 20;
  let realChunks = [];
  for (let i = 0; i < payloadStr.length; i += chunkSize) {
    realChunks.push(payloadStr.slice(i, i + chunkSize));
  }
  
  let poolVars = [];
  let realOrder = [];
  let totalChunks = realChunks.length * 4;
  let currentReal = 0;
  
  for (let i = 0; i < totalChunks; i++) {
    const memName = generateIlName();
    poolVars.push(memName);
    
    if (currentReal < realChunks.length && (Math.random() > 0.4 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1);
      const chunk = realChunks[currentReal];
      const encrypted = encryptChunk(chunk, masterKey, initIV, currentReal);
      const encStr = encrypted.map(b => `bit32.band(${b},0xFF)`).join(',');
      vmCore += `local ${memName}={${encStr}} `;
      currentReal++;
    } else {
      const fakeLen = Math.floor(Math.random() * 30) + 10;
      const fakeBytes = [];
      for (let j = 0; j < fakeLen; j++) {
        fakeBytes.push(`bit32.bxor(${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)})`);
      }
      vmCore += `local ${memName}={${fakeBytes.join(',')}} `;
    }
  }
  
  vmCore += `local ${POOL}={${poolVars.join(',')}} `;
  vmCore += `local ${ORDER}={${realOrder.join(',')}} `;
  
  const byteVar = generateIlName();
  const idxVar = generateIlName();
  
  vmCore += `for _, ${idxVar} in ipairs(${ORDER}) do for _, ${byteVar} in ipairs(${POOL}[${idxVar}]) do `;
  vmCore += `local ${generateIlName()}=bit32.bxor(${byteVar},0xAA) `;
  vmCore += `table.insert(${STACK},string.char(bit32.band(bit32.bxor(${byteVar},${KEY}),0xFF))) ${INDEX}=${INDEX}+1 end end `;
  
  vmCore += `local _payload=table.concat(${STACK}) ${STACK}=nil `;
  
  const ASSERT = `getfenv()[${runtimeString("assert")}]`;
  const LOADSTRING = `getfenv()[${runtimeString("loadstring")}]`;
  
  vmCore += `${ASSERT}(${LOADSTRING}(_payload))() `;
  
  return vmCore;
}

function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount);
  const realIdx = Math.floor(Math.random() * handlerCount);
  const DISPATCH = generateIlName();
  
  let out = `local ${DISPATCH}={} `;
  
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx) {
      out += `${DISPATCH}[${i}]=function() ${generateJunk(8)} ${innerCode} end `;
    } else {
      out += `${DISPATCH}[${i}]=function() ${generateJunk(4)} return nil end `;
    }
  }
  
  out += `${DISPATCH}[${realIdx}]() `;
  return out;
}

function build18xVM(payloadStr) {
  let vm = buildTrueVM(payloadStr);
  for (let i = 0; i < 18; i++) {
    const handlerCount = Math.floor(Math.random() * 3) + 5;
    vm = buildSingleVM(vm, handlerCount);
  }
  return vm;
}

// === PROTECCIONES CON BIT32 ===
function getExtraProtections() {
  const antiDebuggers = [
    `if debug then while true do end end`,
    `if type(rawget)~="function" then while true do end end`,
    `if getmetatable(_G)~=nil then while true do end end`,
    `if bit32.band(0xFFFFFFFF,0xFFFFFFFF)~=0xFFFFFFFF then while true do end end`,
    `if bit32.bxor(0xAAAAAAAA,0x55555555)~=0xFFFFFFFF then while true do end end`,
    `if string.sub("protected",1,1)~="p" then while true do end end`
  ];

  let protections = '';
  for (const guard of antiDebuggers) {
    const fnName = generateIlName();
    protections += `local ${fnName}=function() ${guard} end pcall(${fnName}) `;
  }
  
  return protections;
}

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR';
  
  const protections = getExtraProtections();
  const junkStart = generateJunk(75);
  const finalVM = build18xVM(sourceCode);
  
  const result = `${HEADER} ${junkStart} ${protections} ${finalVM}`;
  return result.replace(/\s+/g, " ").trim();
}

module.exports = { obfuscate };
