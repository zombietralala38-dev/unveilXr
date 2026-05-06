const HEADER = `--[[ this code it's protected by vvmer obfoscator ]]`

const IL_POOL = ["IIIIIIII1", "vvvvvv1", "vvvvvvvv2", "vvvvvv3", "IIlIlIlI1", "lvlvlvlv2", "I1","l1","v1","v2","v3","II","ll","vv", "I2"]
const HANDLER_POOL = ["KQ","HF","W8","SX","Rj","nT","pL","qZ","mV","xB","yC","wD"]
const LOCKER_POOL = ["R1CK","M0RTY","P0RT4L","C1T4D3L","P1CKLE","M33S33KS","SCHW1FTY","S4NCHEZ","SM1TH","G4Z0RP4Z0P"]

function generateIlName() {
  return IL_POOL[Math.floor(Math.random() * IL_POOL.length)] + Math.floor(Math.random() * 99999)
}

function generateLockerName() {
  return LOCKER_POOL[Math.floor(Math.random() * LOCKER_POOL.length)] + Math.floor(Math.random() * 9999)
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
  
  for (let cycle = 0; cycle < 3; cycle++) {
    for (const frag of fragVars) {
      const scrambledName = generateIlName();
      fragmentationCode += `local ${scrambledName} = ${frag.code} `;
      fragmentationCode += `_fragCount = _fragCount + 1 `;
    }
  }
  
  fragmentationCode += `local _secretMsg = "" `;
  fragmentationCode += `local _idx = 1 `;
  
  const reconstructVars = fragVars.map(f => f.name);
  fragmentationCode += `local _chars = {${reconstructVars.map(v => `${v}`).join(',')}} `;
  
  for (let i = 0; i < chars.length; i++) {
    fragmentationCode += `_secretMsg = _secretMsg .. string.char(_chars[${i+1}]) `;
  }
  
  return {
    code: fragmentationCode,
    totalFragments: totalPartsStr,
    msgVarNames: reconstructVars
  };
}

function buildTrueVM(payloadStr) {
  const STACK = generateIlName(); const KEY = generateIlName(); const ORDER = generateIlName()
  const SALT = generateIlName();
  
  const seed = Math.floor(Math.random() * 200) + 50
  const saltVal = Math.floor(Math.random() * 250) + 1
  
  let vmCore = `local ${STACK}={} local ${KEY}=${heavyMath(seed)} local ${SALT}=${heavyMath(saltVal)} `
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
  vmCore += `table.insert(${STACK}, string.char(math.floor((${byteVar} - ${KEY} - _gIdx * ${SALT}) % 256))) _gIdx=_gIdx+1 end end `;
  
  vmCore += `local _e = table.concat(${STACK}) ${STACK}=nil `;
  return vmCore;
}

function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount); const realIdx = Math.floor(Math.random() * handlerCount);
  const DISPATCH = generateIlName(); let out = `local lM={} ` 
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx) { out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(5)} ${innerCode} end ` } 
    else { out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunk(3)} return nil end ` }
  }
  out += `local ${DISPATCH}={`
  for (let i = 0; i < handlers.length; i++) { out += `[${heavyMath(i + 1)}]=${handlers[i]},` }
  out += `} `
  let execBlocks = []; for (let i = 0; i < handlers.length; i++) { execBlocks.push(`${DISPATCH}[${heavyMath(i + 1)}](lM)`) }
  out += applyCFF(execBlocks); return out
}

function build18xVM(payloadStr) {
  let vm = buildTrueVM(payloadStr);
  for (let i = 0; i < 17; i++) {
    vm = buildSingleVM(vm, Math.floor(Math.random() * 2) + 3); 
  }
  return vm;
}

function generateJunk(lines = 100) {
  let j = ''
  for (let i = 0; i < lines; i++) {
    const r = Math.random()
    if (r < 0.3) j += `local ${generateIlName()}=${heavyMath(Math.floor(Math.random() * 999))} `
    else if (r < 0.6) j += `local ${generateIlName()}=string.char(${heavyMath(Math.floor(Math.random()*255))}) `
    else j += `local ${generateIlName()}=${heavyMath(1)} `
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

const ETA_ENAI_TKVR_PAYLOAD = `
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

p10()
`;

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'
  
  let basePayload = sourceCode || ETA_ENAI_TKVR_PAYLOAD;
  
  const SECRET_MSG = "I really like Rick and Morty";
  const TOTAL_PARTS = "2818373738388392919173737627272727363817256367292822";
  const { code: fragmentCode, msgVarNames } = extremeFragment(SECRET_MSG, TOTAL_PARTS);
  
  let modifiedPayload = basePayload;
  
  modifiedPayload = modifiedPayload.replace(
    /local _ = \{[\s\S]*?local s = table\.concat\(r\)/,
    `--[=[ ORIGINAL MESSAGE FRAGMENTED INTO ${TOTAL_PARTS} PARTS ]=] ${fragmentCode} local s = _secretMsg`
  );
  
  modifiedPayload = modifiedPayload.replace(
    /local logger = function\(\)/,
    `--[=[ MSG_VARS: ${msgVarNames.join(',')} ]=] local logger = function()`
  );
  
  const finalVM = build18xVM(modifiedPayload);
  
  const result = `${HEADER} ${generateJunk(50)} ${finalVM}`
  return result.replace(/\s+/g, " ").trim()
}

module.exports = { obfuscate };

if (require.main === module) {
  const obfuscatedCode = obfuscate(ETA_ENAI_TKVR_PAYLOAD);
  console.log(obfuscatedCode);
}
