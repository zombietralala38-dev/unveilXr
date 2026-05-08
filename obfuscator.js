const HEADER = `--[[ XOR PSYCHO MODE - vvmer obfoscator ]]`

const IL_POOL = ["IIIIIIII1", "vvvvvv1", "vvvvvvvv2", "vvvvvv3", "IIlIlIlI1", "lvlvlvlv2", "I1","l1","v1","v2","v3","II","ll","vv", "I2"]
const HANDLER_POOL = ["KQ","HF","W8","SX","Rj","nT","pL","qZ","mV","xB","yC","wD"]

function generateIlName() {
  return IL_POOL[Math.floor(Math.random() * IL_POOL.length)] + Math.floor(Math.random() * 99999)
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
      if (tech.includes("Aggressive Renaming")) { const v = generateIlName(); headers += `local ${v}="${word}";`; replacement = v; }
      else if (tech.includes("String to Math")) replacement = `string.char(${word.split('').map(c => heavyMath(c.charCodeAt(0))).join(',')})`;
      else if (tech.includes("Mixed Boolean Arithmetic")) replacement = `((${mba()}==1 or true)and"${word}")`;
      regex.lastIndex = 0;
      modified = modified.replace(regex, (match) => `game[${replacement}]`);
    }
  }
  return headers + modified;
}

function generateJunk(lines = 100) {
  let j = ''
  for (let i = 0; i < lines; i++) {
    const r = Math.random()
    if (r < 0.2) j += `local ${generateIlName()}=${heavyMath(Math.floor(Math.random() * 999))} `
    else if (r < 0.4) j += `local ${generateIlName()}=string.char(${heavyMath(Math.floor(Math.random()*255))}) `
    else if (r < 0.5) j += `if not(${heavyMath(1)}==${heavyMath(1)}) then local x=1 end `
    else if (r < 0.7) {
      const tp = generateIlName();
      j += `if type(nil)=="number" then while true do local ${tp}=1 end end `
    } else if (r < 0.85) {
      const vt = generateIlName();
      j += `do local ${vt}={} ${vt}["_"]=1 ${vt}=nil end `
    } else {
      j += `if type(math.pi)=="string" then local _=1 end `
    }
  }
  return j
}

function applyCFF(blocks) {
  const stateVar = generateIlName()
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

// ================================================================
// 🔥🔥🔥 TRIPLE XOR PSYCHO MODE - CIFRADO EN CADENA 🔥🔥🔥
// ================================================================
function xorByte(byte, key) {
  return byte ^ key;
}

function buildTripleXOR_VM(payloadStr) {
  const STACK = generateIlName();
  
  // TRES CAPAS DE XOR con keys y salts independientes
  const KEY1 = generateIlName();
  const KEY2 = generateIlName();
  const KEY3 = generateIlName();
  const SALT1 = generateIlName();
  const SALT2 = generateIlName();
  const SALT3 = generateIlName();
  const ORDER = generateIlName();
  
  // Seeds y salts aleatorios para cada capa XOR
  const seed1 = Math.floor(Math.random() * 200) + 50;
  const seed2 = Math.floor(Math.random() * 200) + 50;
  const seed3 = Math.floor(Math.random() * 200) + 50;
  const saltVal1 = Math.floor(Math.random() * 250) + 1;
  const saltVal2 = Math.floor(Math.random() * 250) + 1;
  const saltVal3 = Math.floor(Math.random() * 250) + 1;
  
  let vmCore = `local ${STACK}={} `;
  vmCore += `local ${KEY1}=${heavyMath(seed1)} local ${SALT1}=${heavyMath(saltVal1)} `;
  vmCore += `local ${KEY2}=${heavyMath(seed2)} local ${SALT2}=${heavyMath(saltVal2)} `;
  vmCore += `local ${KEY3}=${heavyMath(seed3)} local ${SALT3}=${heavyMath(saltVal3)} `;
  
  // Fragmentación del payload en chunks
  const chunkSize = 10; // Chunks más pequeños para más XOR
  let realChunks = [];
  for(let i = 0; i < payloadStr.length; i += chunkSize) { 
    realChunks.push(payloadStr.slice(i, i + chunkSize)); 
  }
  
  let poolVars = []; 
  let realOrder = [];
  let totalChunks = realChunks.length * 4; // 4x más chunks falsos
  let currentReal = 0; 
  let globalIndex = 0;
  
  for(let i = 0; i < totalChunks; i++) {
    let memName = generateIlName(); 
    poolVars.push(memName);
    
    if (currentReal < realChunks.length && 
        (Math.random() > 0.6 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1);
      let chunk = realChunks[currentReal]; 
      let encryptedBytes = [];
      
      for(let j = 0; j < chunk.length; j++) {
        // 🔥 TRIPLE XOR ENCADENADO 🔥
        // XOR1: byte ^ (key1 ^ (index * salt1))
        // XOR2: resultado ^ (key2 ^ (index * salt2))
        // XOR3: resultado ^ (key3 ^ (index * salt3))
        let b = chunk.charCodeAt(j);
        
        // Capa 1 XOR
        let xor1_key = seed1 ^ (globalIndex * saltVal1);
        b = xorByte(b, xor1_key % 256);
        
        // Capa 2 XOR
        let xor2_key = seed2 ^ (globalIndex * saltVal2);
        b = xorByte(b, xor2_key % 256);
        
        // Capa 3 XOR
        let xor3_key = seed3 ^ (globalIndex * saltVal3);
        b = xorByte(b, xor3_key % 256);
        
        encryptedBytes.push(heavyMath(b)); 
        globalIndex++;
      }
      vmCore += `local ${memName}={${encryptedBytes.join(',')}} `;
      currentReal++;
    } else {
      // Chunks falsos llenos de XOR aleatorio
      let fakeBytes = []; 
      let fakeLen = Math.floor(Math.random() * 25) + 10;
      for(let j = 0; j < fakeLen; j++) { 
        let fakeByte = Math.floor(Math.random() * 255);
        // También aplicamos XOR a los chunks falsos para más locura
        fakeByte = xorByte(fakeByte, xorByte(Math.floor(Math.random() * 255), Math.floor(Math.random() * 255));
        fakeBytes.push(heavyMath(fakeByte)); 
      }
      vmCore += `local ${memName}={${fakeBytes.join(',')}} `;
    }
  }
  
  vmCore += `local _pool={${poolVars.join(',')}} `;
  vmCore += `local ${ORDER}={${realOrder.map(n => heavyMath(n)).join(',')}} `;
  
  const idxVar = generateIlName(); 
  const byteVar = generateIlName();
  
  // 🔥 DECODIFICADOR TRIPLE XOR - igual de psicótico 🔥
  vmCore += `local _gIdx=0 `;
  vmCore += `for _, ${idxVar} in ipairs(${ORDER}) do `;
  vmCore += `for _, ${byteVar} in ipairs(_pool[${idxVar}]) do `;
  
  // Corrupción silenciosa en cada capa
  vmCore += `if type(math.pi)=="string" then ${KEY1}=(${KEY1}^137)%256 end `;
  vmCore += `if type(nil)=="number" then ${KEY2}=(${KEY2}^69)%256 end `;
  vmCore += `if false then ${KEY3}=(${KEY3}^42)%256 end `;
  
  // 🔥 DES-XOR TRIPLE INVERTIDO 🔥
  vmCore += `local _b = ${byteVar} `;
  
  // Des-XOR capa 3
  vmCore += `_b = math.floor((_b ~ (${KEY3} ~ (_gIdx * ${SALT3} % 256))) % 256) `;
  // Des-XOR capa 2
  vmCore += `_b = math.floor((_b ~ (${KEY2} ~ (_gIdx * ${SALT2} % 256))) % 256) `;
  // Des-XOR capa 1
  vmCore += `_b = math.floor((_b ~ (${KEY1} ~ (_gIdx * ${SALT1} % 256))) % 256) `;
  
  vmCore += `table.insert(${STACK}, string.char(_b)) `;
  vmCore += `_gIdx=_gIdx+1 `;
  vmCore += `end end `;
  
  vmCore += `local _e = table.concat(${STACK}) ${STACK}=nil `;
  
  const ASSERT = `getfenv()[${runtimeString("assert")}]`;
  const LOADSTRING = `getfenv()[${runtimeString("loadstring")}]`;
  const GAME = `getfenv()[${runtimeString("game")}]`;
  const HTTPGET = runtimeString("HttpGet");
  
  if (payloadStr.includes("http")) { 
    vmCore += `${ASSERT}(${LOADSTRING}(${GAME}[${HTTPGET}](${GAME}, _e)))() `; 
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
  for (let i = 0; i < handlers.length; i++) { 
    out += `[${heavyMath(i + 1)}]=${handlers[i]},`; 
  }
  out += `} `;
  
  let execBlocks = []; 
  for (let i = 0; i < handlers.length; i++) { 
    execBlocks.push(`${DISPATCH}[${heavyMath(i + 1)}](lM)`); 
  }
  out += applyCFF(execBlocks); 
  return out;
}

function build18xVM(payloadStr) {
  let vm = buildTripleXOR_VM(payloadStr); // Ahora usa Triple XOR
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
    `if type(print)~="function" then while true do end end `;

  const rawTampers = [
    `if math.pi<3.14 or math.pi>3.15 then _err() end`,
    `if bit32 and bit32.bxor(10,5)~=15 then _err() end`,
    `if type(tostring)~="function" then _err() end`,
    `if not string.match("chk","^c.*k$") then _err() end`,
    `if type(coroutine.create)~="function" then _err() end`,
    `if type(table.concat)~="function" then _err() end`,
    `local _tm1=os.time() local _tm2=os.time() if _tm2<_tm1 then _err() end`,
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
  for(let t of rawTampers) {
    const fnName = generateIlName();
    const errName = generateIlName();
    const injectedError = t.replace("_err()", `${errName}("!")`);
    codeVaultGuards += `local ${fnName}=function() local ${errName}=error ${injectedError} end ${fnName}() `;
  }

  return antiDebuggers + codeVaultGuards;
}

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR';
  
  const antiDebug = `local _clk=os.clock local _t=_clk() for _=1,150000 do end if os.clock()-_t>5.0 then while true do end end `;
  const extraProtections = getExtraProtections();
  let payloadToProtect = "";
  
  const isLoadstringRegex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i;
  const match = sourceCode.match(isLoadstringRegex);
  
  if (match) { 
    payloadToProtect = match[1]; 
  } else { 
    payloadToProtect = detectAndApplyMappings(sourceCode); 
  }
  
  const finalVM = build18xVM(payloadToProtect);
  const result = `${HEADER} ${generateJunk(50)} ${antiDebug} ${extraProtections} ${finalVM}`;
  return result.replace(/\s+/g, " ").trim();
}

module.exports = { obfuscate };
