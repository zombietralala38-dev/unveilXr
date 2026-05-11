// ------------------------------------------------------------
//  Seak Obfuscator - v8 FINAL (mejor que Luraph/Moonveil/CodeVault)
// ------------------------------------------------------------
const HEADER = `--[[ this code it's protected by Seak obfuscator ]]`;

// --- Anti‑env logger original (mensaje árabe, bucle infinito) ---
const ANTI_ENV_LOGGER_CODE = `local p=game.Players.LocalPlayer local c=p and p.Character local anim=c and c:FindFirstChild("Animate") local dummy=Instance.new("LocalScript") local ok,bad=false,false if anim and pcall(function()return anim:IsA("LocalScript")end)then ok=true end if not pcall(function()return dummy:IsA("LocalScript") print("https://r.mtdv.me/blog/posts/obfuscaiton-methods-") twhile true do end end`;

// ===================== UTILIDADES =====================
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

function runtimeString(str) {
  return `string.char(${str.split('').map(c => heavyMath(c.charCodeAt(0))).join(',')})`;
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

function generateJunkArray(count = 100) {
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

// ===================== VM CON BYTECODE REAL =====================
function buildOpcodeVM(payloadStr) {
  const bytes = [];
  for (let i = 0; i < payloadStr.length; i++) bytes.push(payloadStr.charCodeAt(i));

  const opcodes = [];
  for (const byte of bytes) {
    opcodes.push(1, byte);        // PUSH_BYTE
  }
  opcodes.push(2);               // CONCAT
  opcodes.push(3);               // LOAD
  opcodes.push(4);               // CALL
  opcodes.push(5);               // RETURN

  const key = Math.floor(Math.random() * 200) + 50;
  const encOpcodes = opcodes.map((v, idx) => (v ^ ((key + idx) & 0xFF))).join(',');

  const STACK = randomName(), IP = randomName(), CODE = randomName(), OP = randomName();
  const loader = randomName(), fn = randomName();

  let vm = `
    local ${CODE} = {${encOpcodes}}
    local ${STACK} = {}
    local ${IP} = 1
    local _key = ${key}
    while true do
      local ${OP} = bit32.bxor(${CODE}[${IP}], (_key + ${IP} - 1) % 256)
      ${IP} = ${IP} + 1
      if ${OP} == 1 then
        local b = bit32.bxor(${CODE}[${IP}], (_key + ${IP} - 1) % 256)
        table.insert(${STACK}, string.char(b))
        ${IP} = ${IP} + 1
      elseif ${OP} == 2 then
        local ${loader} = table.concat(${STACK})
        ${STACK} = {}
        table.insert(${STACK}, ${loader})
      elseif ${OP} == 3 then
        local src = ${STACK}[1]
        local ${fn}, err = loadstring(src)
        if not ${fn} then return end
        ${STACK} = { ${fn} }
      elseif ${OP} == 4 then
        local f = ${STACK}[1]
        f()
      elseif ${OP} == 5 then
        break
      end
    end
  `;

  let blocks = vm.split(';').filter(s => s.trim().length > 0).map(s => s.trim());
  return applyCFF(blocks);
}

// ===================== ANTI‑DEBUG SIN DETECCIÓN DE STUDIO =====================
const ANTI_DEBUG_CODE = `
  -- Anti hook
  local hookOk = pcall(function()
    debug.sethook(function() end, "c")
    debug.sethook(nil)
  end)
  if not hookOk then while true do end end

  -- Silenciar loggers
  local origPrint, origWarn, origError = print, warn, error
  print = function() end
  warn = function() end
  error = function() end
`;

// ===================== ANTI‑TAMPER POR INTEGRIDAD =====================
function generateIntegrityCheck(payloadStr) {
  const part = payloadStr.substring(0, Math.min(payloadStr.length, 20));
  const hash = part.split('').reduce((a,c) => a + c.charCodeAt(0), 0);
  const checkVar = randomName(), calcVar = randomName();
  return `
    local ${checkVar} = ${runtimeString(part)}
    local ${calcVar} = 0
    for i = 1, #${checkVar} do
      ${calcVar} = ${calcVar} + string.byte(${checkVar}, i)
    end
    if ${calcVar} ~= ${hash} then
      while true do end
    end
  `;
}

// ===================== VM MULTI‑HANDLER (SEÑUELOS) =====================
function pickHandlers(count) {
  const used = new Set();
  const result = [];
  while (result.length < count) {
    const name = randomName() + Math.floor(Math.random() * 99);
    if (!used.has(name)) { used.add(name); result.push(name); }
  }
  return result;
}

function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount);
  const realIdx = Math.floor(Math.random() * handlerCount);
  const DISPATCH = randomName();
  let out = `local lM={} `;
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx)
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunkArray(5).join(' ')} ${innerCode} end `;
    else
      out += `local ${handlers[i]}=function(lM) local lM=lM; ${generateJunkArray(3).join(' ')} return nil end `;
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

// ===================== CONSTRUIR VM BLINDADA FINAL =====================
function buildSecureVM(payloadStr) {
  // 1. Unir anti‑env logger original, anti‑debug y el payload
  const combined = `${ANTI_ENV_LOGGER_CODE} ${ANTI_DEBUG_CODE} ${payloadStr}`;

  // 2. VM de bytecode real (todo junto)
  let vm = buildOpcodeVM(combined);

  // 3. Check de integridad sobre el código combinado
  vm += generateIntegrityCheck(combined);

  // 4. Capas adicionales de VM con señuelos (25 capas)
  for (let i = 0; i < 25; i++) {
    vm = buildSingleVM(vm, Math.floor(Math.random() * 2) + 3);
  }

  return vm;
}

// ===================== OFUSCADOR PRINCIPAL =====================
function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR';

  // Extraer payload (si hay loadstring con HttpGet)
  let payload = "";
  const isLoadstringRegex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i;
  const match = sourceCode.match(isLoadstringRegex);
  if (match) {
    payload = `loadstring(game:HttpGet("${match[1]}"))()`;
  } else {
    payload = sourceCode;
  }

  const finalVM = buildSecureVM(payload);
  const junk = generateJunkArray(150).join(' ');

  return `${HEADER}\n${junk}\n${finalVM}`;
}

module.exports = { obfuscate };
