/*
 * VVMER OBFUSCATOR – SINTAXIS LIMPIA, 20% MATH CODE
 * Sin ; sueltos, todo balanceado.
 * Las matemáticas son parte del cifrado de strings.
 */

const HEADER = `--[[ this code itw protected by unveilX | https://discord.gg/DU35Mhyhq ]]`

const usedNames = new Set()
function genName(prefix = '') {
  let name
  do {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'
    name = prefix
    const len = 6 + Math.floor(Math.random() * 8)
    for (let i = 0; i < len; i++) name += chars[Math.floor(Math.random() * chars.length)]
    name += Math.floor(Math.random() * 99999)
  } while (usedNames.has(name))
  usedNames.add(name)
  return name
}

// Matemática pesada balanceada (nunca rompe paréntesis)
function heavyMath(n) {
  // 20% del total será math code → dejamos solo un 10% sin ofuscar
  if (Math.random() < 0.1) return n.toString()
  const a = Math.floor(Math.random() * 61) + 9
  const b = Math.floor(Math.random() * 17) + 5
  const c = Math.floor(Math.random() * 7) + 1
  // Siempre evalúa a n: (((n+a-a)*b/b)+c-c)  perfectamente balanceado
  return `(((${n}+${a}-${a})*${b}/${b})+${c}-${c})`
}

// Cifrado dinámico de strings: cada carácter se ofusca con heavyMath
function runtimeString(s) {
  return `string.char(${s.split('').map(c => heavyMath(c.charCodeAt(0))).join(',')})`
}

// Junk matemático que nunca causa errores
function generateMathJunk(lines) {
  let junk = ''
  for (let i = 0; i < lines; i++) {
    const r = Math.random()
    if (r < 0.4) {
      const v = genName('m_')
      junk += `local ${v} = ${heavyMath(Math.floor(Math.random() * 9999))} * ${heavyMath(Math.floor(Math.random() * 100) + 1)} `
    } else if (r < 0.7) {
      junk += `if ${heavyMath(1)} == ${heavyMath(1)} then local ${genName('op_')} = ${heavyMath(42)} end `
    } else {
      junk += `for _ = 1, ${heavyMath(1)} do local ${genName('lp_')} = math.sqrt(${heavyMath(144)}) end `
    }
  }
  return junk
}

// Anti-debug limpio (sin ; sueltos)
function buildEnvScan() {
  const start = genName('tstart')
  const tb = genName('tb')
  return `if debug and debug.getinfo then while true do end end
if getgc then while true do end end
local ${start} = os.clock()
local function ${tb}() if os.clock() - ${start} > 3 then while true do end end end
${tb}()`
}

// Integridad básica del entorno
function integrityCheck() {
  const checkStr = runtimeString('A')
  return `if string.byte(${checkStr}) ~= 65 then while true do end end
if type(table.concat) ~= 'function' then while true do end end
if math.pi < 3.14 or math.pi > 3.15 then while true do end end`
}

// VM Core que interpreta bytecode personalizado
function buildVM(payloadUrl) {
  // Escapar comillas en URL
  const safeUrl = payloadUrl.replace(/"/g, '\\"')
  
  const pool = [runtimeString('game'), runtimeString('HttpGet'), `"${safeUrl}"`]
  
  // Opcodes: 0 = push_const, 1 = get_global, 2 = call, 3 = loadstring, 4 = assert_call, 5 = return
  const bytecode = [
    0,0, 1,0,    // push "game", get global game
    0,1, 1,1,    // push "HttpGet", get global HttpGet
    0,2,          // push URL
    2,2,          // call(HttpGet, 2 args) -> string
    3,            // loadstring
    4,0,          // assert_call(0 args)
    5
  ]

  const pc = genName('pc')
  const sp = genName('sp')
  const stack = genName('stk')
  const state = genName('state')
  const op = genName('op')
  const idx = genName('idx')
  const name = genName('name')
  const func = genName('func')
  const args = genName('args')
  const str = genName('str')
  const fn = genName('fn')
  const nargs = genName('nargs')
  const _i = genName('_i')

  // Construir VM sin espacios extras ni saltos de línea que rompan sintaxis
  const vmCode = `local ${pc} = 1
local ${sp} = 0
local ${stack} = {}
local ${state} = 0
local _pool = {${pool.join(',')}}
local _bytecode = {${bytecode.join(',')}}
while true do
  if ${state} == 0 then
    local ${op} = _bytecode[${pc}]
    ${pc} = ${pc} + 1
    if ${op} == 0 then
      local ${idx} = _bytecode[${pc}]
      ${pc} = ${pc} + 1
      ${sp} = ${sp} + 1
      ${stack}[${sp}] = _pool[${idx} + 1]
    elseif ${op} == 1 then
      local ${idx} = _bytecode[${pc}]
      ${pc} = ${pc} + 1
      local ${name} = _pool[${idx} + 1]
      ${sp} = ${sp} + 1
      ${stack}[${sp}] = getfenv()[${name}]
    elseif ${op} == 2 then
      local ${nargs} = _bytecode[${pc}]
      ${pc} = ${pc} + 1
      local ${func} = ${stack}[${sp} - ${nargs}]
      local ${args} = {}
      local ${_i} = 1
      while ${_i} <= ${nargs} do
        ${args}[${_i}] = ${stack}[${sp} - ${nargs} + ${_i}]
        ${_i} = ${_i} + 1
      end
      ${stack}[${sp} - ${nargs}] = ${func}(unpack(${args}))
      ${sp} = ${sp} - ${nargs}
    elseif ${op} == 3 then
      local ${str} = ${stack}[${sp}]
      ${sp} = ${sp} - 1
      local ${fn} = loadstring(${str})
      ${sp} = ${sp} + 1
      ${stack}[${sp}] = ${fn}
    elseif ${op} == 4 then
      local ${fn} = ${stack}[${sp}]
      ${sp} = ${sp} - 1
      ${fn}()
    elseif ${op} == 5 then
      break
    end
    ${state} = 1
  elseif ${state} == 1 then
    if ${pc} > #_bytecode then
      ${state} = 2
    else
      ${state} = 0
    end
  elseif ${state} == 2 then
    break
  end
end`

  return vmCode
}

function obfuscate(sourceCode) {
  if (!sourceCode) return '-- ERROR'

  let url = null
  const match = sourceCode.match(/loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i)
  if (match) {
    url = match[1]
  } else {
    // Si no es una URL, encodificar el código fuente directamente
    url = sourceCode.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  }

  const scanner = buildEnvScan()
  const integrity = integrityCheck()
  const vm = buildVM(url)
  const mathJunk = generateMathJunk(150)

  const finalCode = `${HEADER}
${scanner}
${integrity}
${mathJunk}
${vm}`
  
  return finalCode
}

module.exports = { obfuscate }
