const HEADER = `--[[ this code it's protected by Seak obfuscator ]]`
const ANTI_ENV_LOGGER_CODE = `local p=game.Players.LocalPlayer local c=p and p.Character local anim=c and c:FindFirstChild("Animate") local dummy=Instance.new("LocalScript") local ok,bad=false,false if anim and pcall(function()return anim:IsA("LocalScript")end)then ok=true end if not pcall(function()return dummy:IsA("LocalScript") print("https://r.mtdv.me/blog/posts/obfuscaiton-methods-") twhile true do end end`
const MINIFY = true

const rndString = (l) => { let s = ""; const c = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_"; for (let i = 0; i < l; i++) s += c[Math.floor(Math.random() * c.length)]; return s }
const rndName = () => "_" + rndString(8)

// Devuelve una expresión matemática compleja válida en Lua (para asignaciones)
const heavyMath = (n) => {
  if (Math.random() < 0.7) return n.toString();
  let a = Math.floor(Math.random() * 3000) + 500;
  let b = Math.floor(Math.random() * 50) + 2;
  let c = Math.floor(Math.random() * 800) + 10;
  let d = Math.floor(Math.random() * 20) + 2;
  return `(((((${n}+${a})*${b})/${b})-${a})+((${c}*${d})/${d})-${c})`;
}

// Devuelve un número literal (para string.char y otros lugares críticos)
const litNum = (n) => n.toString();

const junkLine = () => {
  const r = Math.random();
  if (r < 0.2) return `local ${rndName()}=${heavyMath(Math.floor(Math.random() * 999))}`;
  if (r < 0.35) return `local ${rndName()}=string.char(${litNum(Math.floor(Math.random() * 255))})`;
  if (r < 0.5) return `if not(${heavyMath(1)}==${heavyMath(1)}) then local x=1 end`;
  if (r < 0.7) return `if type(nil)=="number" then while true do local ${rndName()}=1 end end`;
  if (r < 0.85) return `do local ${rndName()}={} ${rndName()}["_"]=1 ${rndName()}=nil end`;
  return `if type(math.pi)=="string" then while true do end end`;
}
const junkArray = (c) => { let a = []; for (let i = 0; i < c; i++) a.push(junkLine()); return a }

const applyCFF = (b) => {
  const s = rndName();
  let l = `local ${s}=${heavyMath(1)} while true do `;
  for (let i = 0; i < b.length; i++) {
    if (i === 0) l += `if ${s}==${heavyMath(1)} then ${b[i]} ${s}=${heavyMath(2)} `;
    else l += `elseif ${s}==${heavyMath(i + 1)} then ${b[i]} ${s}=${heavyMath(i + 2)} `;
  }
  l += `elseif ${s}==${heavyMath(b.length + 1)} then break end end `;
  return l;
}

const pickHandlers = (c) => {
  let u = new Set(), r = [];
  while (r.length < c) {
    let n = rndName() + Math.floor(Math.random() * 99);
    if (!u.has(n)) { u.add(n); r.push(n); }
  }
  return r;
}

// CORREGIDO: string.char con números literales
const runtimeString = (s) => {
  let nums = s.split('').map(c => litNum(c.charCodeAt(0)));
  return `string.char(${nums.join(',')})`;
}

function buildLuraphLikeVM(payloadStr) {
  const STACK = rndName(), KEY = rndName(), ORDER = rndName(), VM_STATE = rndName();
  const OP1 = "op1", OP2 = "op2", OP3 = "op3", OP4 = "op4", OP5 = "op5", OP6 = "op6", OP7 = "op7", OP8 = "op8";
  let seed = Math.floor(Math.random() * 200) + 50;
  let vmCore = `local _pool={} local ${STACK}={} local ${VM_STATE}={pc=1,${OP1}=0,${OP2}=0,${OP3}=0,${OP4}=0,${OP5}=0,${OP6}=0,${OP7}=0,${OP8}=0} local ${KEY}=${heavyMath(seed)} `;
  const chunkSize = 10;
  let realChunks = [];
  for (let i = 0; i < payloadStr.length; i += chunkSize) realChunks.push(payloadStr.slice(i, i + chunkSize));
  let realOrder = [], totalChunks = realChunks.length * 4, currentReal = 0, globalIndex = 0;
  for (let i = 0; i < totalChunks; i++) {
    if (currentReal < realChunks.length && (Math.random() > 0.6 || (totalChunks - i) === (realChunks.length - currentReal))) {
      realOrder.push(i + 1);
      let chunk = realChunks[currentReal], enc = [];
      for (let j = 0; j < chunk.length; j++) {
        let e = chunk.charCodeAt(j) ^ ((seed + globalIndex) & 0xFF);
        enc.push(litNum(e));  // número literal
        globalIndex++;
      }
      vmCore += `_pool[${litNum(i + 1)}]={${enc.join(',')}} `;
      currentReal++;
    } else {
      let fake = [];
      for (let j = 0; j < Math.floor(Math.random() * 25) + 5; j++) fake.push(litNum(Math.floor(Math.random() * 255)));
      vmCore += `_pool[${litNum(i + 1)}]={${fake.join(',')}} `;
    }
  }
  vmCore += `local ${ORDER}={${realOrder.map(n => litNum(n)).join(',')}} `;
  const idxVar = rndName(), byteVar = rndName();
  vmCore += `local _gIdx=0 for _,${idxVar} in ipairs(${ORDER}) do for _,${byteVar} in ipairs(_pool[${idxVar}]) do `;
  vmCore += `table.insert(${STACK}, string.char(bit32.bxor(${byteVar}, (${KEY} + _gIdx) % 256))) _gIdx=_gIdx+1 end end `;
  vmCore += `local _e = table.concat(${STACK}) ${STACK}=nil `;
  vmCore += `local function vm_step() ${VM_STATE}.pc=${VM_STATE}.pc+1 end `;
  vmCore += `local function vm_setop(a,b,c,d,e,f,g,h) ${VM_STATE}.${OP1}=a ${VM_STATE}.${OP2}=b ${VM_STATE}.${OP3}=c ${VM_STATE}.${OP4}=d ${VM_STATE}.${OP5}=e ${VM_STATE}.${OP6}=f ${VM_STATE}.${OP7}=g ${VM_STATE}.${OP8}=h end `;
  vmCore += `getgenv()[${runtimeString("assert")}](getgenv()[${runtimeString("loadstring")}](_e))() `;
  return vmCore;
}

function buildSingleVM(innerCode, handlerCount) {
  const handlers = pickHandlers(handlerCount);
  const realIdx = Math.floor(Math.random() * handlerCount);
  const DISPATCH = rndName();
  let out = `local lM={} `;
  for (let i = 0; i < handlers.length; i++) {
    if (i === realIdx) out += `local ${handlers[i]}=function(lM) local lM=lM; ${junkArray(3).join(' ')} ${innerCode} end `;
    else out += `local ${handlers[i]}=function(lM) local lM=lM; ${junkArray(2).join(' ')} return nil end `;
  }
  out += `local ${DISPATCH}={`;
  for (let i = 0; i < handlers.length; i++) out += `[${heavyMath(i + 1)}]=${handlers[i]},`;
  out += `} `;
  let execBlocks = [];
  for (let i = 0; i < handlers.length; i++) execBlocks.push(`${DISPATCH}[${heavyMath(i + 1)}](lM)`);
  out += applyCFF(execBlocks);
  return out;
}

function applyAll1000Mejoras(code) {
  let c = code;
  c = `local _t1=os.clock() local _d1=pcall(function() debug.getinfo(1) end) if os.clock()-_t1>0.001 or not _d1 then while true do end end ` + c;
  c = `local _bp1=pcall(function() local a={} getmetatable(a).__add=function() end a+a end) if _bp1 then while true do end end ` + c;
  c = `local _h1=debug.gethook() if _h1 then while true do end end ` + c;
  c = `local _tr1=pcall(function() debug.sethook(function() end, "l") end) if _tr1 then while true do end end ` + c;
  c = `local _int31=pcall(function() local a=1234567890 a=a+a end) if _int31 then while true do end end ` + c;
  c = `local _int2d1=pcall(function() local a=0x2d a=a end) if _int2d1 then while true do end end ` + c;
  c = `local _trap1=pcall(function() local a=1/0 end) if _trap1 then while true do end end ` + c;
  c = `local _single1=pcall(function() debug.sethook(function() end, "c") end) if _single1 then while true do end end ` + c;
  c = `local _hwbp1=pcall(function() local a=1 a=a+1 end) if _hwbp1 then while true do end end ` + c;
  c = `local _mem1=pcall(function() local a={} a[1]=1 end) if _mem1 then while true do end end ` + c;
  c = `local _api1=pcall(function() getgenv().print end) if _api1 then while true do end end ` + c;
  c = `local _iat1=pcall(function() table.insert end) if _iat1 then while true do end end ` + c;
  c = `local _eat1=pcall(function() string.char end) if _eat1 then while true do end end ` + c;
  c = `local _dbgp1=pcall(function() debug.getregistry() end) if _dbgp1 then while true do end end ` + c;
  c = `local _nt1=pcall(function() game:GetService("RunService") end) if _nt1 then while true do end end ` + c;
  c = `local _heap1=pcall(function() collectgarbage() end) if _heap1 then while true do end end ` + c;
  c = `local _veh1=pcall(function() error("test") end) if _veh1 then while true do end end ` + c;
  c = `local _seh1=pcall(function() x=1/0 end) if _seh1 then while true do end end ` + c;
  c = `local _vec1=pcall(function() local a={} setmetatable(a,a) end) if _vec1 then while true do end end ` + c;
  c = `local _exc1=pcall(function() local a=nil a() end) if _exc1 then while true do end end ` + c;
  c = `local _ill1=pcall(function() local a=1<<32 end) if _ill1 then while true do end end ` + c;
  c = `local _df1=pcall(function() local a={} a=a+1 end) if _df1 then while true do end end ` + c;
  c = `local _so1=pcall(function() local a={} for i=1,1e9 do a[i]=i end end) if _so1 then while true do end end ` + c;
  c = `local _hc1=pcall(function() local a=1 a=a+a end) if _hc1 then while true do end end ` + c;
  c = `local _gp1=pcall(function() local a=getmetatable(1) end) if _gp1 then while true do end end ` + c;
  c = `local _mouse=false local _conn=game:GetService("UserInputService").InputBegan:Connect(function() _mouse=true _conn:Disconnect() end) game:GetService("RunService").Stepped:Wait() if not _mouse then while true do end end ` + c;
  c = `local _wnd=game:GetService("GuiService"):GetScreenResolution() if _wnd.X<800 or _wnd.Y<600 then while true do end end ` + c;
  c = `local _disk=game:GetService("Workspace"):GetFullName() if #_disk<10 then while true do end end ` + c;
  c = `local _ram=game:GetService("Stats"):GetTotalMemory() if _ram<1000000 then while true do end end ` + c;
  c = `local _cpu=game:GetService("Stats"):GetServerStats().Cores.Value if _cpu<2 then while true do end end ` + c;
  c = `local _up=game:GetService("Stats"):GetServerStats().Uptime.Value if _up<60 then while true do end end ` + c;
  c = `local _pp=game:GetService("ProcessService"):GetProcessId() if _pp<1000 then while true do end end ` + c;
  c = `local _fs=game:GetService("Workspace"):FindFirstChild("Terrain") if not _fs then while true do end end ` + c;
  c = `local _reg=pcall(function() game:GetService("HttpService"):GetAsync("https://google.com") end) if not _reg then while true do end end ` + c;
  c = `local _wt=game:GetService("CoreGui"):FindFirstChild("RobloxGui") if not _wt then while true do end end ` + c;
  c = `local _pn=game:GetService("Players").LocalPlayer.Name if #_pn<3 then while true do end end ` + c;
  c = `local _dll=pcall(function() game:GetService("HttpService"):GetAsync("http://127.0.0.1") end) if _dll then while true do end end ` + c;
  c = `local _att=pcall(function() game:GetService("RunService").RenderStepped:Wait() end) if not _att then while true do end end ` + c;
  c = `local _trace1=pcall(function() debug.traceback() end) if _trace1 then while true do end end ` + c;
  c = `local _prof=pcall(function() game:GetService("Profiler"):Start() end) if _prof then while true do end end ` + c;
  c = `local _dumps=pcall(function() string.dump(function() end) end) if _dumps then while true do end end ` + c;
  c = `local _heapsc=pcall(function() collectgarbage("count") end) if _heapsc then while true do end end ` + c;
  const polyKey = rndName();
  c = `local ${polyKey}=math.random(10000,99999) ` + c.replace(/math\.random/g, `${polyKey}+math.random`);
  c = `local _order={} for _i=1,10 do _order[_i]=_i end for _i=10,2,-1 do local j=math.random(_i) _order[_i],_order[j]=_order[j],_order[_i] end ` + c;
  c = `local _opaque = (math.sin(1)^2 + math.cos(1)^2 == 1) ` + c;
  c = `local _jumpTable = {${Array.from({length:50},()=>heavyMath(Math.floor(Math.random()*100))).join(',')}} ` + c;
  c = `local _switch = ${heavyMath(Math.floor(Math.random()*50))} ` + c;
  c = `if debug and debug.getinfo then debug.getinfo = nil end ` + c;
  c = `if debug and debug.getregistry then debug.getregistry = nil end ` + c;
  c = `if string.dump then local _oldDump=string.dump string.dump=function() return nil end end ` + c;
  c = `local _chk1=0 for _i=1,100 do _chk1=(_chk1+_i)%256 end if _chk1~=0 then while true do end end ` + c;
  c = `local _crc1=0 for _i=1,1000 do _crc1=bit32.bxor(_crc1,_i) end if _crc1~=123 then while true do end end ` + c;
  c = `local _cset={} for _i=32,126 do _cset[_i]=string.char(_i) end ` + c.replace(/string\.char\(/g, '_cset[').replace(/\)/g, ']');
  c = `local _xorKey=math.random(1,255) local function _dx(s) local r="" for i=1,#s do r=r..string.char(bit32.bxor(string.byte(s,i),_xorKey)) end return r end ` + c;
  c = `local _mt1={__index=function() return nil end, __newindex=function() end, __call=function() return nil end} setmetatable(_G,_mt1) ` + c;
  c = `local _checkSum=0 local _fn=function() _checkSum=_checkSum+1 end if _checkSum~=0 then while true do end end ` + c;
  c = `local _oldLoad=loadstring loadstring=function(s) return _oldLoad(_dx(s)) end ` + c;
  c = `local _c1 = ${heavyMath(1)} local _c2 = ${heavyMath(2)} local _c3 = ${heavyMath(3)} ` + c;
  return c;
}

function buildSecureVM(payloadStr) {
  let combined = `${ANTI_ENV_LOGGER_CODE} ${payloadStr}`;
  let vm = buildLuraphLikeVM(combined);
  for (let i = 0; i < 35; i++) vm = buildSingleVM(vm, Math.floor(Math.random() * 3) + 3);
  vm = applyAll1000Mejoras(vm);
  return vm;
}

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR';
  let payload = "";
  const match = sourceCode.match(/loadstring\s*\(\s*game\s*:\s*HttpGet\s*\(\s*["']([^"']+)["']\s*\)\s*\)\s*\(\s*\)/i);
  if (match) payload = `loadstring(game:HttpGet("${match[1]}"))()`;
  else payload = sourceCode;
  const finalVM = buildSecureVM(payload);
  const junk = junkArray(80).join(' ');
  if (MINIFY) return `${HEADER}\n${junk}\n${finalVM}`.replace(/\n/g, ' ').replace(/  +/g, ' ');
  return `${HEADER}\n${junk}\n${finalVM}`;
}

module.exports = { obfuscate };
