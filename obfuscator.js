/*
 * VVMER PRO OBFUSCATOR – ANTI-TAMPER FUERTE
 * Sin anti-debugger conflictivo
 * Ofuscación de strings inteligente + protecciones múltiples
 */

const HEADER = `--[[ VVMER PRO | Heavy Anti-Tamper | No Conflicts ]]`

const usedNames = new Set()
const stringPool = new Map()

function genName(prefix = '') {
  let name
  do {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'
    name = prefix
    const len = 8 + Math.floor(Math.random() * 12)
    for (let i = 0; i < len; i++) {
      name += chars[Math.floor(Math.random() * chars.length)]
    }
    name += Math.floor(Math.random() * 999999)
  } while (usedNames.has(name))
  usedNames.add(name)
  return name
}

// Matemática pesada balanceada
function heavyMath(n) {
  if (Math.random() < 0.08) return n.toString()
  const ops = [
    () => {
      const a = Math.floor(Math.random() * 100) + 10
      const b = Math.floor(Math.random() * 10) + 2
      return `(((${n}+${a}-${a})*${b})/${b})`
    },
    () => {
      const a = Math.floor(Math.random() * 50) + 5
      const b = Math.floor(Math.random() * 50) + 5
      return `((${n}*(${a}+${b}))/(${a}+${b}))`
    },
    () => {
      const a = Math.floor(Math.random() * 30) + 3
      return `((${n}*${a})/${a})`
    },
    () => {
      const a = Math.floor(Math.random() * 100)
      const b = Math.floor(Math.random() * 100)
      return `((${n}+${a}-${b})+${b}-${a})`
    }
  ]
  return ops[Math.floor(Math.random() * ops.length)]()
}

// Ofuscación de strings con replacements aleatorios
function obfuscateString(s, index) {
  const parts = []
  for (let i = 0; i < s.length; i++) {
    const char = s[i]
    const code = char.charCodeAt(0)
    
    // Opciones variadas de ofuscación
    const methods = [
      () => heavyMath(code),
      () => `(${code}+${Math.floor(Math.random() * 50)}-${Math.floor(Math.random() * 50)})`,
      () => `string.byte(${JSON.stringify(char)})`,
      () => {
        const a = Math.floor(Math.random() * 200)
        const b = code - a
        return `(${a}+${b})`
      }
    ]
    
    parts.push(methods[Math.floor(Math.random() * methods.length)]())
  }
  
  return `string.char(${parts.join(',')})`
}

// Tabla de strings ofuscados
function buildStringTable(strings) {
  const tableVar = genName('strTab')
  let tableCode = `local ${tableVar} = {}\n`
  
  strings.forEach((str, idx) => {
    const obf = obfuscateString(str, idx)
    tableCode += `${tableVar}[${idx}] = ${obf}\n`
  })
  
  return { variable: tableVar, code: tableCode }
}

// Anti-tamper: Validación de código
function buildAntiTamper() {
  const checks = []
  
  // Check 1: Verificar que funciones globales no fueron reemplazadas
  const check1Var = genName('check')
  checks.push(`
local ${check1Var} = true
if type(string.char) ~= 'function' then ${check1Var} = false end
if type(string.byte) ~= 'function' then ${check1Var} = false end
if type(table.concat) ~= 'function' then ${check1Var} = false end
if type(math.floor) ~= 'function' then ${check1Var} = false end
if ${check1Var} == false then
  local ${genName('err')} = string.char(${heavyMath(101)},${heavyMath(114)},${heavyMath(114)},${heavyMath(111)},${heavyMath(114)})
  error(${genName('err')})
end
  `)
  
  // Check 2: Anti-modificación de metatable
  const check2Var = genName('mtCheck')
  checks.push(`
local ${check2Var} = {}
setmetatable(${check2Var}, {__metatable = false})
if getmetatable(${check2Var}) ~= false then
  error(string.char(${heavyMath(84)},${heavyMath(97)},${heavyMath(109)},${heavyMath(112)},${heavyMath(101)},${heavyMath(114)},${heavyMath(101)},${heavyMath(100)}))
end
  `)
  
  // Check 3: Integridad de math library
  const check3Var = genName('mathCheck')
  checks.push(`
local ${check3Var} = math.pi
if ${check3Var} < 3.14 or ${check3Var} > 3.15 then
  error(string.char(${heavyMath(77)},${heavyMath(97)},${heavyMath(116)},${heavyMath(104)}))
end
  `)
  
  return checks.join('\n')
}

// Generador de código junk matemático
function generateMathJunk(lines) {
  let junk = ''
  const operators = ['+', '-', '*', '/']
  
  for (let i = 0; i < lines; i++) {
    const type = Math.random()
    
    if (type < 0.3) {
      const v = genName('junk_var')
      const nums = [
        Math.floor(Math.random() * 10000),
        Math.floor(Math.random() * 10000),
        Math.floor(Math.random() * 10000)
      ]
      const op1 = operators[Math.floor(Math.random() * operators.length)]
      const op2 = operators[Math.floor(Math.random() * operators.length)]
      junk += `local ${v} = ${heavyMath(nums[0])} ${op1} ${heavyMath(nums[1])} ${op2} ${heavyMath(nums[2])}\n`
    } else if (type < 0.6) {
      const v = genName('loop_var')
      const n = Math.floor(Math.random() * 5) + 1
      junk += `for ${v} = 1, ${heavyMath(n)} do local _${genName('x')} = ${heavyMath(Math.random() * 100)} end\n`
    } else {
      const v = genName('cond_var')
      junk += `if ${heavyMath(1)} == ${heavyMath(1)} then local ${v} = ${heavyMath(42)} end\n`
    }
  }
  
  return junk
}

// Ejecución segura del código
function buildExecutor(originalCode) {
  const executor = genName('exec')
  const funcVar = genName('fn')
  const resultVar = genName('result')
  
  // Escapar el código correctamente
  const escapedCode = originalCode
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
  
  return `
local ${executor} = function()
  local ${funcVar}, ${resultVar} = loadstring(${JSON.stringify(originalCode)})
  if ${funcVar} then
    return ${funcVar}()
  else
    error(${resultVar})
  end
end

local ${genName('success')}, ${genName('result')} = pcall(${executor})
  `
}

// Constructor principal
function obfuscate(sourceCode, options = {}) {
  if (!sourceCode) return '-- ERROR: No code'
  
  usedNames.clear()
  stringPool.clear()
  
  // Extraer URL si existe
  let isLoadstring = false
  const urlMatch = sourceCode.match(/loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i)
  
  if (urlMatch) {
    isLoadstring = true
  }
  
  // Construcción del código ofuscado
  let result = `${HEADER}\n`
  
  // Anti-tamper fuerte
  result += buildAntiTamper()
  result += '\n'
  
  // Junk matemático
  result += generateMathJunk(options.junkLines || 200)
  result += '\n'
  
  // Ejecución
  if (isLoadstring && urlMatch) {
    const url = urlMatch[1]
    const escapedUrl = url.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    result += `loadstring(game:HttpGet(${JSON.stringify(escapedUrl)}))()\n`
  } else {
    // Ejecutar código directo
    result += `local ${genName('main')} = function()\n`
    result += sourceCode + '\n'
    result += `end\n`
    result += `${genName('main')}()\n`
  }
  
  return result
}

module.exports = { obfuscate, genName, heavyMath }
