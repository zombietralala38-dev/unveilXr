// ------------------------------------------------------------
//  Mini Obfuscator - VM Luraph + Anti‑Tamper
// ------------------------------------------------------------

function randomName() {
  return "_" + Math.random().toString(36).substring(2, 8) + Math.floor(Math.random() * 1000);
}

/**
 * Genera las comprobaciones anti‑tamper (típicas de Luraph).
 * Se ejecutan directamente, sin ofuscación pesada.
 */
function buildTamperChecks() {
  const rawTampers = [
    `if math.pi<3.14 or math.pi>3.15 then error("!") end`,
    `if bit32 and bit32.bxor(10,5)~=15 then error("!") end`,
    `if type(tostring)~="function" then error("!") end`,
    `if not string.match("chk","^c.*k$") then error("!") end`,
    `if type(coroutine.create)~="function" then error("!") end`,
    `if type(table.concat)~="function" then error("!") end`,
    `local _tm1=tick() local _tm2=tick() if _tm2<_tm1 then error("!") end`,
    `if math.abs(-10)~=10 then error("!") end`,
    `if gcinfo and gcinfo()<0 then error("!") end`,
    `if type(next)~="function" then error("!") end`,
    `if string.len("a")~=1 then error("!") end`,
    `if type(table.insert)~="function" then error("!") end`,
    `if string.byte("Z",1)~=90 then error("!") end`,
    `if math.floor(-1/10)~=-1 then error("!") end`,
    `if (true and 1 or 2)~=1 then error("!") end`,
    `if type(1)~="number" then error("!") end`,
    `if type(pcall)~="function" then error("!") end`
  ];
  return rawTampers.join(' ');
}

/**
 * Máquina virtual simple (estilo Luraph) sin XOR ni heavy math.
 * - Divide el payload en fragmentos
 * - Mezcla fragmentos reales con falsos en un pool
 * - Los reconstruye mediante `table.concat` y ejecuta con `loadstring`
 */
function buildMiniVM(payloadStr) {
  const STACK = randomName();
  const ORDER = randomName();
  const chunkSize = 10;
  let realChunks = [];
  for (let i = 0; i < payloadStr.length; i += chunkSize)
    realChunks.push(payloadStr.slice(i, i + chunkSize));

  let poolVars = [];
  let realOrder = [];        // índices de los fragmentos reales (1‑based)
  let totalChunks = realChunks.length * 4;
  let currentReal = 0;
  let vmCore = `local ${STACK}={} `;

  for (let i = 0; i < totalChunks; i++) {
    let memName = randomName();
    poolVars.push(memName);

    // Decide si este fragmento es real o falso
    const needsReal = (currentReal < realChunks.length) &&
                      (Math.random() > 0.6 || (totalChunks - i) === (realChunks.length - currentReal));
    if (needsReal) {
      realOrder.push(i + 1);   // este índice en el pool es real
      const chunk = realChunks[currentReal];
      const bytes = chunk.split('').map(c => c.charCodeAt(0));
      vmCore += `local ${memName}={${bytes.join(',')}} `;
      currentReal++;
    } else {
      const fakeBytes = Array.from({length: Math.floor(Math.random() * 25) + 5},
                                   () => Math.floor(Math.random() * 256));
      vmCore += `local ${memName}={${fakeBytes.join(',')}} `;
    }
  }

  // Tabla del pool y orden de reconstrucción
  vmCore += `local _pool={${poolVars.join(',')}} `;
  vmCore += `local ${ORDER}={${realOrder.join(',')}} `;

  const idxVar = randomName();
  const byteVar = randomName();
  vmCore += `for _, ${idxVar} in ipairs(${ORDER}) do `;
  vmCore += `for _, ${byteVar} in ipairs(_pool[${idxVar}]) do `;
  vmCore += `table.insert(${STACK}, string.char(${byteVar})) `;
  vmCore += `end end `;

  vmCore += `local _e = table.concat(${STACK}) ${STACK}=nil `;

  // Ejecutar el payload
  vmCore += `assert(loadstring(_e))() `;

  return vmCore;
}

/**
 * Función principal de ofuscación (mínima).
 */
function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR';

  // Extraer el payload (si es un HttpGet, usamos la URL; si no, el código completo)
  let payload = sourceCode;
  const httpMatch = sourceCode.match(
    /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  );
  if (httpMatch) payload = httpMatch[1];

  // Construir VM y añadir anti‑tamper al principio
  const tamper = buildTamperChecks();
  const vm = buildMiniVM(payload);

  return `${tamper} ${vm}`;
}

module.exports = { obfuscate };
