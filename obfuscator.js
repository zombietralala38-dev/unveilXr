const IL_POOL = ["IIIIIIII1","vvvvvv1","vvvvvvvv2","vvvvvv3","IIlIlIlI1","lvlvlvlv2","I1","l1","v1","v2","v3","II","ll","vv","I2"];
const LOCKER_POOL = ["R1CK","M0RTY","P0RT4L","C1T4D3L","P1CKLE","M33S33KS","SCHW1FTY","S4NCHEZ","SM1TH","G4Z0RP4Z0P"];
const HANDLER_POOL = ["KQ","HF","W8","SX","Rj","nT","pL","qZ","mV","xB","yC","wD"];

function rng(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function genIl() { return pick(IL_POOL) + rng(1000, 99999); }
function genLock() { return pick(LOCKER_POOL) + rng(100, 9999); }

function heavyMath(n) {
  if (Math.random() < 0.6) return String(n);
  const a = rng(10, 200), b = rng(2, 30);
  return `(((${n}+${a})*${b}/${b})-${a})`;
}

function buildTrueVM(payloadStr) {
  const STACK = genIl(), KEY = genIl(), ORDER = genIl(), SALT = genIl();
  const seed = rng(50, 250), saltVal = rng(1, 250);
  
  let out = `local ${STACK}={}local ${KEY}=${seed}local ${SALT}=${saltVal}`;
  
  const chunks = [];
  for (let i = 0; i < payloadStr.length; i += 10) chunks.push(payloadStr.slice(i, i + 10));
  
  const poolVars = [], realOrder = [];
  let realIdx = 0, gIdx = 0;
  const total = chunks.length * 2;
  
  for (let i = 0; i < total; i++) {
    const mem = genIl();
    poolVars.push(mem);
    
    if (realIdx < chunks.length && (Math.random() > 0.4 || total - i === chunks.length - realIdx)) {
      realOrder.push(i + 1);
      const enc = [];
      for (let j = 0; j < chunks[realIdx].length; j++) {
        enc.push((chunks[realIdx].charCodeAt(j) + seed + gIdx * saltVal) % 256);
        gIdx++;
      }
      out += `local ${mem}={${enc.join(',')}}`;
      realIdx++;
    } else {
      const fake = [];
      for (let j = 0; j < rng(3, 12); j++) fake.push(rng(0, 255));
      out += `local ${mem}={${fake.join(',')}}`;
    }
  }
  
  const idxV = genIl(), byteV = genIl();
  out += `local _pool={${poolVars.join(',')}}local ${ORDER}={${realOrder.join(',')}}`;
  // ARREGLO 1: pairs en vez de ipairs (Luau también corta con ipairs en el primer nil)
  out += `local _g=0 for _,${idxV} in pairs(${ORDER})do for _,${byteV} in pairs(_pool[${idxV}])do`;
  out += `table.insert(${STACK},string.char((${byteV}-${KEY}-_g*${SALT})%256))_g=_g+1 end end`;
  out += `local _e=table.concat(${STACK})${STACK}=nil`;
  // ARREGLO 2: EJECUTA el código reconstruido (sin esto no pasa nada)
  out += ` loadstring(_e)()`;
  return out;
}

function buildSingleVM(inner, count) {
  const handlers = [];
  const used = new Set();
  while (handlers.length < count) {
    const name = pick(HANDLER_POOL) + rng(0, 99);
    if (!used.has(name)) { used.add(name); handlers.push(name); }
  }
  
  const real = rng(0, count - 1), DISP = genIl();
  let out = `local lM={}`;
  
  for (let i = 0; i < count; i++) {
    if (i === real) out += `local ${handlers[i]}=function(lM)${inner}end`;
    else out += `local ${handlers[i]}=function(lM)return nil end`;
  }
  
  out += `local ${DISP}={`;
  for (let i = 0; i < count; i++) out += `[${i+1}]=${handlers[i]},`;
  out += `}`;
  
  for (let i = 0; i < count; i++) out += `${DISP}[${i+1}](lM)`;
  
  return out;
}

function obfuscate(source) {
  if (!source) return '--ERROR';

  // Fragmentar "I really like Rick and Morty"
  const SECRET = 'I really like Rick and Morty';
  const fragVars = [];
  let fragCode = '';
  for (const c of SECRET) {
    const v = genIl();
    fragVars.push(v);
    fragCode += `local ${v}=${heavyMath(c.charCodeAt(0))}`;
  }
  fragCode += `local _s=""`;
  for (const v of fragVars) fragCode += `_s=_s..string.char(${v})`;

  // Reemplazar mensaje en el payload
  let payload = source.replace(
    /local _ = \{[\s\S]*?local s = table\.concat\(r\)/,
    `${fragCode}local s=_s`
  );

  // 3 capas VM
  let vm = buildTrueVM(payload);
  for (let i = 0; i < 3; i++) vm = buildSingleVM(vm, rng(2, 4));

  const lock = genLock();
  const header = '--[[ vvmer obfuscator - rick & morty locker pool ]]';

  return `${header}
local ${lock}=function()${vm}end
${lock}()`;
}

module.exports = { obfuscate };
