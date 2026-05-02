const HEADER = `--[[ this code its protected by unveilX | https://discord.gg/DU35Mhyhq ]]`

const usedNames = new Set()
function genName(prefix = '') {
  let name
  do {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'
    name = prefix
    const len = 5 + Math.floor(Math.random() * 8)
    for (let i = 0; i < len; i++) name += chars[Math.floor(Math.random() * chars.length)]
    name += Math.floor(Math.random() * 99999)
  } while (usedNames.has(name))
  usedNames.add(name)
  return name
}

// Solo 5% de envoltura matemática
function lightMath(n) {
  if (Math.random() < 0.95) return n.toString()
  const a = Math.floor(Math.random() * 21) + 4
  const b = Math.floor(Math.random() * 7) + 2
  return `((${n}+${a}-${a})*${b}/${b})`
}

function runtimeString(s) {
  return `string.char(${s.split('').map(c => lightMath(c.charCodeAt(0))).join(',')})`
}

// VM de una sola capa con dispatch y flujo de control falso
function buildSingleVM(innerCode) {
  const handlerCount = Math.floor(Math.random() * 4) + 3
  const handlers = []
  const used = new Set()
  const bases = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  while (handlers.length < handlerCount) {
    const base = bases[Math.floor(Math.random() * bases.length)]
    const name = base + Math.floor(Math.random() * 99)
    if (!used.has(name)) { used.add(name); handlers.push(name) }
  }

  const realIdx = Math.floor(Math.random() * handlerCount)
  const DISPATCH = genName('d')
  let out = `local lM={} `
  for (let i = 0; i < handlers.length; i++) {
    const junkAssign = `local ${genName('v')}=${lightMath(Math.floor(Math.random()*1000))} `
    if (i === realIdx) {
      out += `local ${handlers[i]}=function(lM) ${junkAssign} ${innerCode} end `
    } else {
      out += `local ${handlers[i]}=function(lM) ${junkAssign} return nil end `
    }
  }
  out += `local ${DISPATCH}={} `
  for (let i = 0; i < handlers.length; i++) {
    out += `${DISPATCH}[${lightMath(i+1)}]=${handlers[i]} `
  }

  const stateVar = genName('s')
  out += `local ${stateVar}=${lightMath(1)} `
  out += `while true do `
  out += `if ${stateVar}==${lightMath(1)} then ${DISPATCH}[${lightMath(realIdx+1)}](lM) ${stateVar}=${lightMath(2)} `
  for (let i = 1; i < handlers.length; i++) {
    const fakeBlock = `local ${genName('f')}=${lightMath(i)} `
    out += `elseif ${stateVar}==${lightMath(i+1)} then ${fakeBlock} ${stateVar}=${lightMath(i+2)} `
  }
  out += `else break end end `
  return `do ${out} end`
}

// VM anidada mínima (2 capas) para sellar cada parte
function buildMinimalNestedVM(innerCode) {
  let vm = buildSingleVM(innerCode)
  for (let i = 0; i < 2; i++) vm = buildSingleVM(vm)
  return vm
}

// Divide en 20 partes selladas y las guarda en una tabla
function build20PartVMs(payload) {
  const partLength = Math.ceil(payload.length / 20)
  const parts = []
  for (let i = 0; i < 20; i++) {
    parts.push(payload.slice(i * partLength, (i + 1) * partLength))
  }

  const tableName = genName('_parts')   // Tabla que contendrá todas las partes
  let vmCode = `local ${tableName} = {} `

  for (let i = 0; i < parts.length; i++) {
    const encoded = parts[i].length > 0 ? runtimeString(parts[i]) : '""'
    // Guardamos directamente en la tabla
    const inner = `${tableName}[${lightMath(i+1)}] = ${encoded}`
    // Cada asignación va envuelta en su VM sellada
    vmCode += buildMinimalNestedVM(inner) + ' '
  }

  // Combinamos las partes desde la tabla
  const combinedVar = genName('_combined')
  const idxVar = genName('_i')
  let combiner = `local ${combinedVar} = {} `
  combiner += `for ${idxVar}=1,20 do ${combinedVar}[${idxVar}] = ${tableName}[${idxVar}] end `
  combiner += `${tableName} = nil `
  combiner += `local _payload = table.concat(${combinedVar}) `

  // Ejecución final con pcall dentro de una VM sellada
  const execInner = `
    local _ok, _err = pcall(function()
      local _f = loadstring(_payload)
      if _f then _f() end
    end)
    if not _ok then end
  `
  const execVM = buildMinimalNestedVM(execInner) // lo metemos en otra VM para ofuscar

  return vmCode + ' ' + combiner + ' ' + execVM
}

// Envoltorio final con pcall exterior y el clásico "break end"
function wrapWithBreakEnd(code) {
  const state = genName('_x')
  return `
do
  local ${state} = 1
  while true do
    if ${state} == 1 then
      pcall(function()
        ${code}
      end)
      ${state} = 2
    else
      break
    end
  end
end`
}

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'

  // Detectar si es una URL de loadstring+HttpGet o código directo
  let payload = ""
  const regex = /loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i
  const match = sourceCode.match(regex)
  if (match) {
    payload = match[1]  // solo la URL
  } else {
    payload = sourceCode
  }

  const mainVM = build20PartVMs(payload)
  const final = wrapWithBreakEnd(mainVM)

  let result = `${HEADER}\n${final}`
  // Todo en una línea, sin romper comentarios
  result = result.replace(/\s+/g, " ").trim()
  return result
}

module.exports = { obfuscate }
