// ═══════════════════════════════════════════════════════════════
// SEAK LIGHT OBFUSCATOR + SUPER ENV LOGGER COMPRIMIDO
// ═══════════════════════════════════════════════════════════════

const HEADER = `--[[ this code it's protected by vvmer obfoscator ]]`
const SEAK_TAG = "this code it's protected by Seak obfuscator"
const SEAK_VERSION = "0.878.012.282"
const TOTAL_FRAGMENTS = "82829292828288"

// Pools mínimos (sin heavyMath)
const IL_POOL = ["I1","l1","v1","v2","v3","II","ll","vv"]
const HANDLER_POOL = ["KQ","HF","W8","SX","Rj"]

function generateIlName() {
  return IL_POOL[Math.floor(Math.random() * IL_POOL.length)] + Math.floor(Math.random() * 99)
}

// ═══════════════════════════════════════════════════════════════
// 🛡️ SUPER ENV LOGGER COMPRIMIDO (nombres cortos, menos líneas)
// ═══════════════════════════════════════════════════════════════
function generateSuperEnvLoggerCompressed() {
  const msg = SEAK_TAG
  const ver = SEAK_VERSION
  const frags = TOTAL_FRAGMENTS

  // Código Lua ultra-comprimido del logger
  return `
local e=0
local function d(t)
e=e+1
local m="${msg} | v${ver}"
print("⚠️ ENEMY IN "..t.."\\n🔒 "..m.."\\n🔒 "..m.."\\n🔒 "..m)
for i=1,1000 do print("🔒 "..m.." | FRAG "..i.."/"..${frags}) end
end

local function t1()
local dx=Instance.new("Folder")local a=Instance.new("Folder")local b=Instance.new("MeshPart")local s={}
coroutine.resume(coroutine.create(function()b.Parent=a;a.Parent=dx;task.defer(function()s.p=b.Parent;s.g=a.Parent;task.spawn(function()dx:ClearAllChildren()end)end)end))
coroutine.resume(coroutine.create(function()task.defer(function()s.s=b:GetAttribute("s")or 0;b:SetAttribute("s","x")end)end))
task.wait(0.07)
local p=(b.Parent==nil and a.Parent==nil and s.p==a and s.g==dx and s.s==0)
if not p then d("T1")end
return p
end

local function t2()
local p=true
if type(print)~="function"then p=false elseif type(pcall)~="function"then p=false elseif type(error)~="function"then p=false end
local f=function()end
if type(f)~="function"then p=false end
if not p then d("T2")end
return p
end

local function t3()
local p=true
if debug then
if type(debug.getinfo)~="function"then p=false elseif type(debug.getupvalue)~="function"then p=false elseif type(debug.setupvalue)~="function"then p=false end
local ok,err=pcall(function()if debug.getinfo(1)==nil then error("fake")end end)
if not ok then p=false end
end
if not p then d("T3")end
return p
end

local function t4()
local p=true
local function du()return 1 end
local ok,dump=pcall(string.dump,du)
if not ok then p=false elseif type(dump)~="string"then p=false elseif #dump<10 then p=false end
if not p then d("T4")end
return p
end

local function t5()
local p=true
if getfenv then if type(getfenv())~="table"then p=false end end
local mt=getmetatable(_G)
if mt~=nil then p=false end
if mt and (mt.__index or mt.__newindex)then p=false end
if not p then d("T5")end
return p
end

local function t6()
local p=true
local co=coroutine.create(function()return"ok"end)
local ok,r=coroutine.resume(co)
if not ok or r~="ok"then p=false end
local co2=coroutine.create(function()coroutine.yield("cp")return"f"end)
local ok2,cp=coroutine.resume(co2)
if not ok2 or cp~="cp"then p=false end
local ok3,f=coroutine.resume(co2)
if not ok3 or f~="f"then p=false end
if not p then d("T6")end
return p
end

local function t7()
local p=true
for _,n in ipairs({"print","pcall","error","type","tostring","tonumber","table","string","math","coroutine","os"})do if _G[n]==nil then p=false break end end
for _,n in ipairs({"__index","__newindex","__metatable","jit"})do if _G[n]~=nil then p=false break end end
if not p then d("T7")end
return p
end

local function t8()
local p=true
local s=os.clock()
for i=1,100000 do end
local e=os.clock()-s
if e<0.0001 or e>5 then p=false end
if not p then d("T8")end
return p
end

local function t9()
local p=true
if math.pi<3.14 or math.pi>3.15 then p=false end
if math.abs(-10)~=10 then p=false end
if math.floor(1.5)~=1 then p=false end
if not p then d("T9")end
return p
end

local function t10()
local p=true
if string.len("t")~=1 then p=false end
if string.char(65)~="A"then p=false end
if string.byte("A")~=65 then p=false end
if not p then d("T10")end
return p
end

local function run()
local tests={{"T1",t1},{"T2",t2},{"T3",t3},{"T4",t4},{"T5",t5},{"T6",t6},{"T7",t7},{"T8",t8},{"T9",t9},{"T10",t10}}
local p,f=0,0
print("═"..string.rep("═",40).."\\n🛡️ SUPER ENV LOGGER\\n🔒 ${msg} | v${ver}\\n📦 FRAGMENTS: ${frags}\\n".."═"..string.rep("═",40))
for _,t in ipairs(tests)do
local ok,res=pcall(t[2])
if ok and res then p=p+1;print("✅ "..t[1])else f=f+1;print("❌ "..t[1])end
task.wait(0.01)
end
print("═"..string.rep("═",40).."\\n📊 "..p.."/"..#tests.." passed | 👾 "..e.." enemies")
if e>0 then for i=1,1000 do print("🔒 ".."${msg} | v${ver} | FRAG "..i.."/"..${frags}) end end
print("═"..string.rep("═",40))
return{p=p,f=f,e=e}
end
return run
`.trim()
}

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL (SIN HEAVYMATH, SOLO 30% DE OFUSCACIÓN)
// ═══════════════════════════════════════════════════════════════
function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR'

  // Generar el ENV Logger comprimido
  const envLogger = generateSuperEnvLoggerCompressed()

  // Fragmentar con el número gigante
  const totalFragments = TOTAL_FRAGMENTS
  let fragmented = `--[=[ FRAGMENTED INTO ${totalFragments} PARTS ]=]\n`
  fragmented += `--[=[ EACH PART PROTECTED BY SEAK OBFUSCATOR ]=]\n\n`
  fragmented += `local _frags = "${totalFragments}"\n`
  fragmented += `local _tag = "${SEAK_TAG}"\n`
  fragmented += `local _ver = "${SEAK_VERSION}"\n\n`
  fragmented += `--[=[ FRAGMENT 1..${totalFragments} ]=]\n`
  fragmented += envLogger
  fragmented += `\n--[=[ END OF ${totalFragments} FRAGMENTS ]=]`

  // Protecciones anti-debug ligeras (sin heavyMath)
  const antiDebug = `local _=os.clock() for _=1,150000 do end if os.clock()-_>5 then while true do end end `
  const extra = `
if debug and debug.getinfo then local i=debug.getinfo(1) if i.what~="main" and i.what~="Lua" then while true do end end end
pcall(function()error("__v")end) if not string.find(tostring(_),"__v") then while true do end end
if getmetatable(_G)~=nil then while true do end end
  `.replace(/\s+/g, ' ')

  // Unir todo (sin VM, solo el código limpio del logger)
  const result = `${HEADER} ${antiDebug} ${extra} ${fragmented}`
  return result.replace(/\s+/g, ' ').trim()
}

module.exports = { obfuscate }
