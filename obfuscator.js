// obfuscator.js – Seak Obfuscator v7 + 17 técnicas completas
const HEADER = `--[[ this code it's protected by Seak obfuscator ]]`;

// ---------- Funciones auxiliares de Seak ----------
function randomName() {
  return "_" + Math.random().toString(36).substring(2, 8) + Math.floor(Math.random() * 1000);
}

function heavyMath(n) {
  if (Math.random() < 0.8) return n.toString();
  let a = Math.floor(Math.random() * 3000) + 500;
  let b = Math.floor(Math.random() * 50) + 2;
  let c = Math.floor(Math.random() * 800) + 10;
  let d = Math.floor(Math.random() * 20) + 2;
  return `(((((${n}+${a})*${b})/${b})-${a})+((${c}*${d})/${d})-${c})`;
}

function generateSingleJunkLine() {
  const r = Math.random();
  if (r < 0.2) return `local ${randomName()}=${heavyMath(Math.floor(Math.random() * 999))}`;
  else if (r < 0.35) return `local ${randomName()}=string.char(${heavyMath(Math.floor(Math.random()*255))})`;
  else if (r < 0.5) return `if not(${heavyMath(1)}==${heavyMath(1)}) then local x=1 end`;
  else if (r < 0.7) {
    const tp = randomName();
    return `if type(nil)=="number" then while true do local ${tp}=1 end end`;
  } else if (r < 0.85) {
    const vt = randomName();
    return `do local ${vt}={} ${vt}["_"]=1 ${vt}=nil end`;
  } else {
    return `if type(math.pi)=="string" then while true do end end`;
  }
}

function generateJunkArray(count) {
  const arr = [];
  for (let i = 0; i < count; i++) arr.push(generateSingleJunkLine());
  return arr;
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

function buildTrueVM(payloadStr) {
  const STACK = randomName();
  const KEY = randomName();
  const ORDER = randomName();
  const seed = Math.floor(Math.random() * 200) + 50;
  let vmCore = `local _pool={} local ${STACK}={} local ${KEY}=${heavyMath(seed)} `;
  const chunkSize = 10;
  let realChunks = [];
  for(let i = 0; i < payloadStr.length; i += chunkSize)
    realChunks.push(payloadStr.slice(i, i + chunkSize));
  let realOrder = [];
  let totalChunks = realChunks.length * 4;
  let currentReal = 0;
  let globalIndex = 0;
  for(let i = 0; i < totalChunks; i++) {
    if (currentReal < realChunks.length && (Math.random() > 0.6 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1);
      let chunk = realChunks[currentReal], encryptedBytes = [];
      for(let j = 0; j < chunk.length; j++) {
        let enc = chunk.charCodeAt(j) ^ ((seed + globalIndex) & 0xFF);
        encryptedBytes.push(heavyMath(enc));
        globalIndex++;
      }
      vmCore += `_pool[${heavyMath(i + 1)}]={${encryptedBytes.join(',')}} `;
      currentReal++;
    } else {
      let fakeBytes = [];
      for(let j = 0; j < Math.floor(Math.random() * 25) + 5; j++)
        fakeBytes.push(heavyMath(Math.floor(Math.random() * 255)));
      vmCore += `_pool[${heavyMath(i + 1)}]={${fakeBytes.join(',')}} `;
    }
  }
  vmCore += `local ${ORDER}={${realOrder.map(n => heavyMath(n)).join(',')}} `;
  const idxVar = randomName(), byteVar = randomName();
  vmCore += `local _gIdx=0 for _, ${idxVar} in ipairs(${ORDER}) do for _, ${byteVar} in ipairs(_pool[${idxVar}]) do `;
  vmCore += `table.insert(${STACK}, string.char(bit32.bxor(${byteVar}, (${KEY} + _gIdx) % 256))) _gIdx=_gIdx+1 end end `;
  vmCore += `local _e = table.concat(${STACK}) ${STACK}=nil `;
  const ASSERT = `getgenv()[${runtimeString("assert")}]`;
  const LOADSTRING = `getgenv()[${runtimeString("loadstring")}]`;
  vmCore += `${ASSERT}(${LOADSTRING}(_e))() `;
  return vmCore;
}

function buildSingleVM(innerCode, handlerCount) {
  function pickHandlers(count) {
    const used = new Set();
    const result = [];
    while (result.length < count) {
      const name = randomName() + Math.floor(Math.random() * 99);
      if (!used.has(name)) { used.add(name); result.push(name); }
    }
    return result;
  }
  const handlers = pickHandlers(handlerCount);
  const realIdx = Math.floor(Math.random() * handlerCount);
  const DISPATCH = randomName();
  let out = `local lM={} `;
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx)
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunkArray(3).join(' ')} ${innerCode} end `;
    else
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunkArray(2).join(' ')} return nil end `;
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

function buildSecureVM(payloadStr, layers = 25) {
  const ANTI_ENV_LOGGER_CODE = `local p=game.Players.LocalPlayer local c=p and p.Character local anim=c and c:FindFirstChild("Animate") local dummy=Instance.new("LocalScript") local ok,bad=false,false if anim and pcall(function()return anim:IsA("LocalScript")end)then ok=true end if not pcall(function()return dummy:IsA("LocalScript") print("ye you a env logger bro stop you get detected ") twhile true do end end`;
  const combinedCode = `${ANTI_ENV_LOGGER_CODE} ${payloadStr}`;
  let vm = buildTrueVM(combinedCode);
  for (let i = 0; i < layers; i++) {
    vm = buildSingleVM(vm, Math.floor(Math.random() * 2) + 3);
  }
  return vm;
}

// ---------- 17 técnicas ----------
const TECHNIQUES = [
  "Watermarking",
  "Anti-Environment Logger",
  "Identifier Renaming",
  "Arithmetic Obfuscation",
  "Dead Code Injection",
  "Control Flow Flattening",
  "Virtual Machine Obfuscation",
  "Custom VM",
  "Debug VM",
  "XOR Encryption",
  "Runtime String Obfuscation",
  "Fake Chunk Insertion",
  "VM Layering",
  "Decoy Handlers",
  "Remote Payload Fetching",
  "Junk Padding",
  "Constant Obfuscation"
];

// Implementación de cada técnica
function applyWatermark(code) {
  return `${HEADER}\n${code}`;
}

function applyAntiEnv(code) {
  const ANTI_ENV = `local p=game.Players.LocalPlayer local c=p and p.Character local anim=c and c:FindFirstChild("Animate") local dummy=Instance.new("LocalScript") local ok,bad=false,false if anim and pcall(function()return anim:IsA("LocalScript")end)then ok=true end if not pcall(function()return dummy:IsA("LocalScript") print("ye you a env logger bro stop you get detected ") twhile true do end end`;
  return `${ANTI_ENV}\n${code}`;
}

function applyIdentifierRenaming(code) {
  let renamed = code;
  const varMap = {};
  const localRegex = /\blocal\s+(\w+)\b/g;
  let match;
  while ((match = localRegex.exec(code)) !== null) {
    const old = match[1];
    if (!varMap[old]) varMap[old] = randomName();
    renamed = renamed.replace(new RegExp(`\\b${old}\\b`, 'g'), varMap[old]);
  }
  return renamed;
}

function applyArithmeticObfuscation(code) {
  return code.replace(/(\w+)\s*\+\s*(\d+)/g, (_, a, b) => `${a}-(-${b})`)
             .replace(/(\w+)\s*\-\s*(\d+)/g, (_, a, b) => `${a}+(-${b})`)
             .replace(/(\w+)\s*\*\s*(\d+)/g, (_, a, b) => `${a}/(1/${b})`);
}

function applyDeadCodeInjection(code) {
  const dead = `if false then print("dead") end\n`;
  return dead + code + dead;
}

function applyControlFlowFlattening(code) {
  return applyCFF([code]);
}

function applyVirtualMachineObfuscation(code) {
  return buildSecureVM(code, 5); // 5 capas de VM
}

function applyCustomVM(code) {
  return `-- Custom VM\nlocal bytecode = string.dump(load([=[${code}]=]))\nload(bytecode)()`;
}

function applyDebugVM(code) {
  return `-- Debug VM\nlocal function vm_run(src) debug.debug() load(src)() end\nvm_run([=[${code}]=])`;
}

function applyXOREncryption(code) {
  const key = Math.floor(Math.random() * 255) + 1;
  let encrypted = "";
  for (let i = 0; i < code.length; i++) {
    encrypted += String.fromCharCode(code.charCodeAt(i) ^ key);
  }
  return `local k=${key}\nlocal s="${encrypted}"\nlocal r=""\nfor i=1,#s do r=r..string.char(string.byte(s,i)~k) end\nload(r)()`;
}

function applyRuntimeStringObfuscation(code) {
  return code.replace(/"(.*?)"/g, (_, str) => {
    const key = 42;
    let enc = "";
    for (let i = 0; i < str.length; i++) enc += String.fromCharCode(str.charCodeAt(i) ^ key);
    return `(function() local k=42; local s="${enc}"; local r=""; for i=1,#s do r=r..string.char(string.byte(s,i)~k) end; return r end)()`;
  });
}

function applyFakeChunkInsertion(code) {
  return `(function() return "fake" end)()\n${code}\n(function() end)()`;
}

function applyVMLayering(code) {
  let layered = code;
  for (let i = 0; i < 3; i++) layered = `load([=[${layered}]=])()`;
  return layered;
}

function applyDecoyHandlers(code) {
  return `local h={}\nh[1]=function() end\nh[2]=function() ${code} end\nh[2]()`;
}

function applyRemotePayloadFetching(code) {
  return `-- remote fetch simulation (requires http request)\nlocal url="https://pastebin.com/raw/xxxx"\nlocal function fetch(u) return "${code.replace(/"/g, '\\"')}" end\nload(fetch(url))()`;
}

function applyJunkPadding(code, intensity = 50) {
  const junk = generateJunkArray(intensity).join(' ');
  return `${junk}\n${code}\n${junk}`;
}

function applyConstantObfuscation(code) {
  return code.replace(/\b(\d+)\b/g, (_, num) => `(${num}+0)`);
}

// ---------- Función principal de ofuscación ----------
function obfuscate(sourceCode, options = {}) {
  if (!sourceCode) return '--ERROR';
  let result = sourceCode;

  // Detectar si es loadstring remoto
  const loadstringMatch = sourceCode.match(/loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i);
  if (loadstringMatch) {
    result = `loadstring(game:HttpGet("${loadstringMatch[1]}"))()`;
  }

  // Modo custom: aplicar solo las técnicas seleccionadas (por índice)
  if (options.techniques && Array.isArray(options.techniques)) {
    for (const idx of options.techniques) {
      switch (idx) {
        case 0: result = applyWatermark(result); break;
        case 1: result = applyAntiEnv(result); break;
        case 2: result = applyIdentifierRenaming(result); break;
        case 3: result = applyArithmeticObfuscation(result); break;
        case 4: result = applyDeadCodeInjection(result); break;
        case 5: result = applyControlFlowFlattening(result); break;
        case 6: result = applyVirtualMachineObfuscation(result); break;
        case 7: result = applyCustomVM(result); break;
        case 8: result = applyDebugVM(result); break;
        case 9: result = applyXOREncryption(result); break;
        case 10: result = applyRuntimeStringObfuscation(result); break;
        case 11: result = applyFakeChunkInsertion(result); break;
        case 12: result = applyVMLayering(result); break;
        case 13: result = applyDecoyHandlers(result); break;
        case 14: result = applyRemotePayloadFetching(result); break;
        case 15: result = applyJunkPadding(result, 40); break;
        case 16: result = applyConstantObfuscation(result); break;
        default: break;
      }
    }
    return result;
  }

  // Niveles predefinidos
  const level = options.level || "normal";
  switch (level) {
    case "bad":
      result = applyWatermark(result);
      result = applyAntiEnv(result);
      result = applyJunkPadding(result, 20);
      break;
    case "normal":
      result = applyWatermark(result);
      result = applyAntiEnv(result);
      result = applyIdentifierRenaming(result);
      result = applyArithmeticObfuscation(result);
      result = applyDeadCodeInjection(result);
      result = applyJunkPadding(result, 40);
      break;
    case "medium":
      result = applyWatermark(result);
      result = applyAntiEnv(result);
      result = applyIdentifierRenaming(result);
      result = applyArithmeticObfuscation(result);
      result = applyDeadCodeInjection(result);
      result = applyControlFlowFlattening(result);
      result = applyXOREncryption(result);
      result = applyRuntimeStringObfuscation(result);
      result = applyFakeChunkInsertion(result);
      result = applyJunkPadding(result, 60);
      result = applyConstantObfuscation(result);
      break;
    case "extreme":
      result = applyWatermark(result);
      result = applyAntiEnv(result);
      result = applyIdentifierRenaming(result);
      result = applyArithmeticObfuscation(result);
      result = applyDeadCodeInjection(result);
      result = applyControlFlowFlattening(result);
      result = applyVirtualMachineObfuscation(result); // VM pesada
      result = applyXOREncryption(result);
      result = applyRuntimeStringObfuscation(result);
      result = applyFakeChunkInsertion(result);
      result = applyVMLayering(result);
      result = applyDecoyHandlers(result);
      result = applyJunkPadding(result, 100);
      result = applyConstantObfuscation(result);
      break;
    default:
      result = applyWatermark(result);
      result = applyAntiEnv(result);
      result = applyJunkPadding(result, 30);
      break;
  }
  return result;
}

module.exports = { obfuscate, TECHNIQUES };
