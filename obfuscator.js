// vvmer Obfuscator - Modo Luau Blindado
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

function generateJunk(lines = 80) {
  let j = '';
  for (let i = 0; i < lines; i++) {
    const r = Math.random();
    if (r < 0.15) {
      j += `for _=1,1 do if false then continue end end `; // Solo Luau
    } else if (r < 0.3) {
      j += `local ${generateIlName()}=if nil then "" else "" `; // Solo Luau
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

// ... (el resto de las funciones: applyCFF, runtimeString, buildTrueVM, buildSingleVM, build18xVM, etc.)
// Son exactamente las mismas que ya tenías, solo que buildTrueVM ahora incluye "continue"

function buildTrueVM(payloadStr) {
  const STACK = generateIlName(); const KEY = generateIlName(); const ORDER = generateIlName();
  const SALT = generateIlName();
  const seed = Math.floor(Math.random() * 200) + 50;
  const saltVal = Math.floor(Math.random() * 250) + 1;

  let vmCore = `local ${STACK}={} local ${KEY}=${heavyMath(seed)} local ${SALT}=${heavyMath(saltVal)} `;
  const chunkSize = 15;
  let realChunks = [];
  for (let i = 0; i < payloadStr.length; i += chunkSize) realChunks.push(payloadStr.slice(i, i + chunkSize));

  let poolVars = [], realOrder = [], currentReal = 0, globalIndex = 0;
  let totalChunks = realChunks.length * 3;

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
  vmCore += `if false then continue end `; // 🚀 LÍNEA LUAU EXCLUSIVA (rompe Lua normal)
  vmCore += `if type(math.pi)=="string" then ${KEY}=(${KEY}+137)%256 end `;
  vmCore += `table.insert(${STACK}, string.char(math.floor((${byteVar} - ${KEY} - _gIdx * ${SALT}) % 256))) _gIdx=_gIdx+1 end end `;

  vmCore += `local _e = table.concat(${STACK}) ${STACK}=nil `;
  // Usamos _G directamente (Roblox)
  const ASSERT = `_G[string.char(${runtimeString("assert").split(',')[0]})]`; // simplificado
  const LOADSTRING = `_G[string.char(${runtimeString("loadstring").split(',')[0]})]`;
  const GAME = `_G[string.char(${runtimeString("game").split(',')[0]})]`;

  if (payloadStr.includes("http")) {
    vmCore += `local _h=_G[string.char(${runtimeString("HttpGet").split(',')[0]})] `;
    vmCore += `${ASSERT}(${LOADSTRING}(${GAME}[_h](${GAME}, _e)))() `;
  } else {
    vmCore += `${ASSERT}(${LOADSTRING}(_e))() `;
  }
  return vmCore;
}

// buildSingleVM, build18xVM, obfuscate se mantienen igual

function obfuscate(sourceCode) {
  let basePayload = sourceCode || `print("I like Rick and Morty")`; // payload mínimo
  const antiDebug = `local _c=os.clock;local _t=_c() for _=1,150000 do end if _c()-_t>5 then while true do end end `;
  const extra = getExtraProtections(); // la función getExtraProtections sigue igual
  const finalVM = build18xVM(basePayload);
  const result = `${HEADER} ${generateJunk(80)} ${antiDebug} ${extra} ${finalVM}`;
  return result.replace(/\s+/g, " ").trim();
}

module.exports = { obfuscate };
