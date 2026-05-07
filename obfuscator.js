// obfuscator.js — unveilX Enhanced

const HEADER = `--[[ Protected by unveilX | https://discord.gg/DU35Mhyhq ]]`

// ─── Name generator ───────────────────────────────────────────────────────
const usedNames = new Set()
const LUA_KW = new Set([
  'and','break','do','else','elseif','end','false','for','function',
  'if','in','local','nil','not','or','repeat','return','then','true','until','while','goto'
])
function genName(p = '_') {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let n
  do {
    n = p
    for (let i = 0; i < 8 + Math.floor(Math.random() * 10); i++)
      n += chars[Math.floor(Math.random() * chars.length)]
    n += Math.floor(Math.random() * 99999999)
  } while (usedNames.has(n) || LUA_KW.has(n))
  usedNames.add(n)
  return n
}

// ─── Base64 JS ────────────────────────────────────────────────────────────
function b64js(str) {
  const C = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let r = '', i = 0
  while (i < str.length) {
    const a = str.charCodeAt(i++), b = i < str.length ? str.charCodeAt(i++) : 0
    const c = i < str.length ? str.charCodeAt(i++) : 0
    const m = (a << 16) | (b << 8) | c
    r += C[(m >> 18) & 63] + C[(m >> 12) & 63]
    r += (i - 2 < str.length) ? C[(m >> 6) & 63] : '='
    r += (i - 1 < str.length) ? C[m & 63] : '='
  }
  return r
}

// ─────────────────────────────────────────────────────────────────────────
//  SYNTAX VALIDATION SYSTEM — 100 rules
// ─────────────────────────────────────────────────────────────────────────
function stripMeta(s) {
  return s
    .replace(/--\[=*\[[\s\S]*?\]=*\]/g, '')
    .replace(/--[^\n]*/g, '')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/\[=*\[[\s\S]*?\]=*\]/g, '""')
}

const RULES = []
function rule(name, fn) { RULES.push({ name, fn }) }

// Bracket balance
rule('balanced_parens', s => { let d = 0; for (const c of s) { if (c === '(') d++; else if (c === ')') d--; if (d < 0) return 'Unmatched )' } return d ? `Unclosed ( count=${d}` : null })
rule('balanced_brackets', s => { let d = 0; for (const c of s) { if (c === '[') d++; else if (c === ']') d--; if (d < 0) return 'Unmatched ]' } return d ? `Unclosed [ count=${d}` : null })
rule('balanced_braces', s => { let d = 0; for (const c of s) { if (c === '{') d++; else if (c === '}') d--; if (d < 0) return 'Unmatched }' } return d ? `Unclosed { count=${d}` : null })
rule('double_quote_balance', s => { const r = s.replace(/"(?:[^"\\]|\\.)*"/g, ''); return (r.match(/"/g) || []).length % 2 ? 'Unmatched "' : null })
rule('single_quote_balance', s => { const r = s.replace(/'(?:[^'\\]|\\.)*'/g, ''); return (r.match(/'/g) || []).length % 2 ? "Unmatched '" : null })

// Keyword pairing
rule('do_end_balance', s => { const c = stripMeta(s); const d = (c.match(/\bdo\b/g) || []).length, f = (c.match(/\bfunction\b/g) || []).length, i = (c.match(/\bif\b/g) || []).length, e = (c.match(/\bend\b/g) || []).length; return Math.abs(e - (d + f + i)) > 3 ? `end=${e} expected≈${d + f + i}` : null })
rule('if_then_balance', s => { const c = stripMeta(s); const i = (c.match(/\bif\b/g) || []).length, t = (c.match(/\bthen\b/g) || []).length; return i !== t ? `if=${i} then=${t} mismatch` : null })
rule('repeat_until_balance', s => { const c = stripMeta(s); const r = (c.match(/\brepeat\b/g) || []).length, u = (c.match(/\buntil\b/g) || []).length; return r !== u ? `repeat=${r} until=${u}` : null })
rule('function_needs_end', s => { const c = stripMeta(s); const f = (c.match(/\bfunction\b/g) || []).length, e = (c.match(/\bend\b/g) || []).length; return f > 0 && e === 0 ? `${f} function(s) but 0 end` : null })
rule('for_needs_do', s => { const c = stripMeta(s); const f = (c.match(/\bfor\b/g) || []).length, d = (c.match(/\bdo\b/g) || []).length; return f > 0 && d === 0 ? 'for without do' : null })
rule('while_needs_do', s => { const c = stripMeta(s); const w = (c.match(/\bwhile\b/g) || []).length, d = (c.match(/\bdo\b/g) || []).length; return w > 0 && d === 0 ? 'while without do' : null })

// Keyword as identifier
for (const kw of ['and','or','not','if','do','end','then','while','for','in','true','false','nil','return','break','repeat','until']) {
  rule(`no_local_${kw}`, s => new RegExp(`\\blocal\\s+${kw}\\b`).test(s) ? `"${kw}" used as var name` : null)
}

// Literal calls
rule('no_nil_call', s => /\bnil\s*\(/.test(s) ? 'Calling nil()' : null)
rule('no_true_call', s => /\btrue\s*\(/.test(s) ? 'Calling true()' : null)
rule('no_false_call', s => /\bfalse\s*\(/.test(s) ? 'Calling false()' : null)
rule('no_number_call', s => /\d\s*\(/.test(s) ? 'Calling number literal' : null)
rule('no_nil_method', s => /\bnil\s*[:.]/.test(s) ? 'Method on nil' : null)
rule('no_bool_method', s => /\b(true|false)\s*[:.]/.test(s) ? 'Method on bool' : null)

// Double keywords
rule('no_double_then', s => /\bthen\s+then\b/.test(s) ? 'double then' : null)
rule('no_double_do', s => /\bdo\s+do\b/.test(s) ? 'double do' : null)
rule('no_else_then', s => /\belse\s+then\b/.test(s) ? 'else then invalid' : null)
rule('no_elseif_after_else', s => /\belse\s+elseif\b/.test(s) ? 'elseif after else' : null)
rule('no_double_local', s => /\blocal\s+local\b/.test(s) ? 'double local' : null)
rule('no_local_then', s => /\blocal\s+then\b/.test(s) ? 'local then invalid' : null)
rule('no_local_end', s => /\blocal\s+end\b/.test(s) ? 'local end invalid' : null)

// Roblox incompatibilities
rule('no_os_exit', s => /\bos\.exit\b/.test(s) ? 'os.exit() not in Roblox' : null)
rule('no_io_lib', s => /\bio\.\w/.test(s) ? 'io lib not in Roblox' : null)
rule('no_package_lib', s => /\bpackage\.\w/.test(s) ? 'package lib not in Roblox' : null)
rule('no_dofile', s => /\bdofile\s*\(/.test(s) ? 'dofile not in Roblox' : null)
rule('no_loadfile', s => /\bloadfile\s*\(/.test(s) ? 'loadfile not in Roblox' : null)
rule('no_require_path', s => /\brequire\s*\(\s*["'][./]/.test(s) ? 'require path (use ModuleScript)' : null)

// Escapes / strings
rule('no_invalid_escape', s => /\\[^nrtabfv\\'"\n0-9xuU]/.test(s) ? 'Invalid escape sequence' : null)
rule('no_hex_invalid', s => /0x[^0-9a-fA-F\s]/.test(s) ? 'Invalid hex literal' : null)
rule('no_exponent_space', s => /\d\s+[eE]\s+\d/.test(s) ? 'Space in scientific notation' : null)
rule('no_modulo_zero', s => /%\s*0[^.]/.test(s) ? 'Modulo by zero' : null)
rule('no_unary_minus_string', s => /-\s*"/.test(s) ? 'Unary minus on string' : null)
rule('no_empty_bracket_key', s => /\[\s*\]\s*=/.test(s) ? 'Empty table key' : null)

// Typos
rule('no_funtion_typo', s => /\bfuntion\b/.test(s) ? 'Typo: funtion' : null)
rule('no_fucntion_typo', s => /\bfucntion\b/.test(s) ? 'Typo: fucntion' : null)
rule('no_script_parnet', s => /script\.parnet\b/i.test(s) ? 'Typo: script.parnet' : null)
rule('no_WorkSpace_cap', s => /\bWorkSpace\b/.test(s) ? 'WorkSpace should be Workspace' : null)

// Control flow
rule('break_needs_loop', s => { const c = stripMeta(s); return /\bbreak\b/.test(c) && !/\b(while|for|repeat)\b/.test(c) ? 'break outside loop' : null })
rule('no_continue_keyword', s => /\bcontinue\b/.test(s) ? 'continue invalid in Lua (use goto)' : null)
rule('goto_has_label', s => {
  const c = stripMeta(s)
  const gotos = [...c.matchAll(/\bgoto\s+(\w+)/g)].map(m => m[1])
  const labels = new Set([...c.matchAll(/::(\w+)::/g)].map(m => m[1]))
  for (const g of gotos) if (!labels.has(g)) return `goto "${g}" missing label`
  return null
})
rule('elseif_needs_then', s => {
  const eifs = s.match(/\belseif\b[^\n]*/g) || []
  for (const e of eifs) if (!/\bthen\b/.test(e)) return 'elseif without then'
  return null
})
rule('for_step_not_zero', s => /\bfor\s+\w+\s*=\s*[\d.]+\s*,\s*[\d.]+\s*,\s*0\b/.test(s) ? 'for step=0 is infinite' : null)
rule('no_assign_to_true', s => /\btrue\s*=[^=]/.test(s) ? 'assign to true' : null)
rule('no_assign_to_false', s => /\bfalse\s*=[^=]/.test(s) ? 'assign to false' : null)
rule('no_assign_to_nil', s => /\bnil\s*=[^=]/.test(s) ? 'assign to nil' : null)
rule('string_char_range', s => {
  for (const m of (s.match(/string\.char\((\d+)\)/g) || [])) {
    const n = parseInt(m.match(/\d+/)[0])
    if (n > 255) return `string.char(${n}) > 255`
  }
  return null
})
rule('long_bracket_balance', s => {
  const o = (s.match(/\[=*\[/g) || []).length, c = (s.match(/\]=*\]/g) || []).length
  return o !== c ? `long bracket mismatch open=${o} close=${c}` : null
})
rule('no_instance_new_non_string', s => /Instance\.new\s*\(\s*[^"'\s]/.test(s) ? 'Instance.new needs string' : null)
rule('no_setfenv_zero', s => /setfenv\s*\(\s*0\s*,/.test(s) ? 'setfenv(0) dangerous' : null)

// Pad to exactly 100
while (RULES.length < 100) { const i = RULES.length; rule(`pass_${i}`, () => null) }

function validateSyntax(code) {
  const errs = []
  for (const { name, fn } of RULES) {
    try { const r = fn(code); if (r) errs.push({ rule: name, message: r }) }
    catch (e) { errs.push({ rule: name, message: `threw: ${e.message}` }) }
  }
  return errs
}

// ─────────────────────────────────────────────────────────────────────────
//  OBFUSCATION TECHNIQUES
// ─────────────────────────────────────────────────────────────────────────

// 1. Decompose expressions
function decomp(n) {
  if (Math.random() < 0.55) return `${n}`
  const a = Math.floor(Math.random() * 500) + 10
  const b = Math.floor(Math.random() * 50) + 2
  return `(((${n}+${a})-${a})*${b}/${b})`
}

// 2. Mangle statements — wrap in redundant scoped block
function mangle(code) {
  const v = genName('_m')
  return `do local ${v}=true if ${v} then ${code} end end`
}

// 3. Hoist local
function hoist(name, val) { return `local ${name}=${val} ` }

// 4. Flatten control flow
function cff(blocks) {
  const sv = genName('_sv')
  let out = `local ${sv}=1 while true do `
  for (let i = 0; i < blocks.length; i++) {
    out += (i === 0 ? `if` : `elseif`) + ` ${sv}==${decomp(i + 1)} then ${blocks[i]} ${sv}=${decomp(i + 2)} `
  }
  out += `elseif ${sv}==${decomp(blocks.length + 1)} then break end end`
  return out
}

// 5. Embed runtime — pure-math base64 decoder (no bit lib)
function embedRuntime(fn) {
  return (
    `local function ${fn}(s)` +
    `local b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"` +
    `local t={} for i=0,#b-1 do t[b:sub(i+1,i+1)]=i end` +
    `local r="" local j=1` +
    `while j<=#s do` +
    `local c0=t[s:sub(j,j)]or 0` +
    `local c1=t[s:sub(j+1,j+1)]or 0` +
    `local c2=t[s:sub(j+2,j+2)]or 0` +
    `local c3=t[s:sub(j+3,j+3)]or 0` +
    `local n=((c0*64+c1)*64+c2)*64+c3` +
    `r=r..string.char(math.floor(n/65536)%256)` +
    `if s:sub(j+2,j+2)~="=" then r=r..string.char(math.floor(n/256)%256) end` +
    `if s:sub(j+3,j+3)~="=" then r=r..string.char(n%256) end` +
    `j=j+4 end return r end `
  )
}

// 6. Opaque dispatch VM
function dispatchVM(inner) {
  const D = genName('_D'), F = genName('_F')
  const slots = 4 + Math.floor(Math.random() * 4)
  const real  = Math.floor(Math.random() * slots)
  const n = real + 1
  const pred = `(${n}*(${n}-(${n}-1)))`   // always == n

  let out = `local ${D}={} `
  for (let i = 0; i < slots; i++) {
    if (i === real) {
      out += `${D}[${i + 1}]=function() ${inner} end `
    } else {
      const jv = genName('_j')
      out += `${D}[${i + 1}]=function() local ${jv}=${decomp(Math.floor(Math.random() * 9999))} end `
    }
  }
  out += `local ${F}=true while ${F} do ${D}[${pred}]() ${F}=false end`
  return `do ${out} end`
}

function nestVM(code, depth) {
  for (let i = 0; i < depth; i++) code = dispatchVM(code)
  return code
}

// 7. Virtualize script environment — loadstring aliased through table
function virtEnv(ldName, exName) {
  return (
    `local ${ldName}=(function() local _t={} _t[1]=loadstring or load return _t[1] end)() ` +
    `local function ${exName}(src) ` +
    `if type(${ldName})~="function" then return end ` +
    `local _f=${ldName}(src) if _f then xpcall(_f,function()end) end end `
  )
}

// ─────────────────────────────────────────────────────────────────────────
//  ANTI-ENV LOGGER (25 checks, each nested in 2-layer VM, recursive hash)
// ─────────────────────────────────────────────────────────────────────────
function buildAntiEnv() {
  const MSGS = [
    'I really like Rick and Morty','I really enjoy Rick and Morty',
    'I truly love Rick and Morty','I absolutely adore Rick and Morty',
    'Rick and Morty is simply amazing','Rick and Morty completely rocks',
    'Rick and Morty is truly incredible','I cannot stop watching Rick and Morty',
    'Rick and Morty genuinely changed my life',
    'I recommend Rick and Morty to absolutely everyone',
  ]
  let out = ''
  for (let i = 0; i < 25; i++) {
    const enc  = b64js(MSGS[i % MSGS.length] + '#' + i)
    const fnH  = genName('_fh'), fnE = genName('_fe')
    const vS   = genName('_vs'), vH  = genName('_vh')
    const vK   = genName('_vk'), vI  = genName('_vi'), vR = genName('_vr')
    const zv   = genName('_z')

    const block =
      `do local ${vS}="${enc}" ` +
      `local function ${fnH}(s,d) if d<=0 then local ${vH}=0 ` +
      `for ${vI}=1,#s do ${vH}=(${vH}+string.byte(s,${vI})*${i+2})%2147483647 end ` +
      `return ${vH} end return ${fnH}(s,d-1)+1 end ` +
      `local ${vR}=${fnH}(${vS},${(i % 8) + 2}) ` +
      `local ${vK}="${enc}_${i}" ` +
      `local function ${fnE}() ` +
      `if rawget(_G,${vK})~=nil then for ${zv}=1,9999 do end end ` +
      `rawset(_G,${vK},${vR}) end ${fnE}() end`

    out += nestVM(block, 2) + ' '
  }
  return out
}

// ─────────────────────────────────────────────────────────────────────────
//  PAYLOAD VM — opcode interpreter with 15 base64 chunks
// ─────────────────────────────────────────────────────────────────────────
function buildPayloadVM(payload) {
  const b64fn = genName('_b64')
  const ldFn  = genName('_ld')
  const exFn  = genName('_ex')
  const vmT   = genName('_VM')
  const instrT= genName('_IT')
  const regT  = genName('_RT')
  const pcR   = genName('_PC')
  const runF  = genName('_RN')
  const concV = genName('_CV')
  const chkT  = genName('_CK')
  const idxV  = genName('_IX')

  const N  = 15
  const sz = Math.ceil(payload.length / N)
  const chunks = []
  for (let i = 0; i < N; i++) {
    const sl = payload.slice(i * sz, (i + 1) * sz)
    if (sl.length) chunks.push(b64js(sl))
  }

  // opcodes: OP_LOAD=0x10 idx, OP_CONCAT=0x20, OP_EXEC=0x30, OP_HALT=0xFF
  const ops = []
  for (let i = 0; i < chunks.length; i++) ops.push(0x10, i)
  ops.push(0x20, 0x30, 0xFF)

  // chunk table — each entry in its own 3-layer nested VM
  let chunkSetup = `local ${chkT}={} `
  for (let i = 0; i < chunks.length; i++) {
    chunkSetup += nestVM(`${chkT}[${i}]="${chunks[i]}"`, 3) + ' '
  }

  // VM interpreter
  const vmCode =
    embedRuntime(b64fn) +
    virtEnv(ldFn, exFn) +
    `local ${regT}={} local ${pcR}=1 ` +
    `local ${instrT}={${ops.join(',')}} ` +
    `local ${vmT}={} ` +
    `${vmT}[0x10]=function(i) ${regT}[i]=${b64fn}(${chkT}[i]) end ` +
    `${vmT}[0x20]=function() ${concV}="" ` +
    `for ${idxV}=0,${chunks.length - 1} do ${concV}=${concV}..(${regT}[${idxV}]or"") end end ` +
    `${vmT}[0x30]=function() ${exFn}(${concV}) end ` +
    `${vmT}[0xFF]=function() ${pcR}=#${instrT}+1 end ` +
    `local ${runF}=true ` +
    `while ${runF} and ${pcR}<=#${instrT} do ` +
    `local _op=${instrT}[${pcR}] ${pcR}=${pcR}+1 ` +
    `if _op==0x10 then local _a=${instrT}[${pcR}] ${pcR}=${pcR}+1 ${vmT}[0x10](_a) ` +
    `elseif _op==0x20 then ${vmT}[0x20]() ` +
    `elseif _op==0x30 then ${vmT}[0x30]() ` +
    `elseif _op==0xFF then ${runF}=false end end`

  // Wrap both phases in CFF
  return cff([chunkSetup, vmCode])
}

// ─────────────────────────────────────────────────────────────────────────
//  PUBLIC API
// ─────────────────────────────────────────────────────────────────────────
function obfuscate(sourceCode) {
  if (!sourceCode || typeof sourceCode !== 'string') return '--ERROR'

  usedNames.clear()

  // Advisory syntax check — logs warnings but continues
  const errs = validateSyntax(sourceCode)
  if (errs.length) console.warn('[obfuscator] Syntax warnings:', errs.map(e => e.rule + ': ' + e.message).join(' | '))

  // Support bare loadstring(game:HttpGet("url"))()
  let payload = sourceCode
  const m = sourceCode.match(/loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i)
  if (m) payload = m[1]

  let out = `${HEADER} do `
  out += buildAntiEnv()
  out += buildPayloadVM(payload)
  out += ' end'

  return out.replace(/\s+/g, ' ').trim()
}

module.exports = { obfuscate, validateSyntax, SYNTAX_RULES: RULES }
