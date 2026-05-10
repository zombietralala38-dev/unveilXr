// ------------------------------------------------------------
//  Double VM Obfuscator - VM ofuscada con cadena de bytes
// ------------------------------------------------------------

function randomName() {
  return "_" + Math.random().toString(36).substring(2, 8);
}

/**
 * Anti-tamper checks estilo Luraph (sin matemáticas extras)
 */
function buildTamperChecks() {
  return [
    `if math.pi<3.14 or math.pi>3.15 then error() end`,
    `if bit32 and bit32.bxor(10,5)~=15 then error() end`,
    `if type(tostring)~="function" then error() end`,
    `if not string.match("chk","^c.*k$") then error() end`,
    `if type(coroutine.create)~="function" then error() end`,
    `if type(table.concat)~="function" then error() end`,
    `local _t1=tick() local _t2=tick() if _t2<_t1 then error() end`,
    `if math.abs(-10)~=10 then error() end`,
    `if gcinfo and gcinfo()<0 then error() end`,
    `if type(next)~="function" then error() end`,
    `if string.len("a")~=1 then error() end`,
    `if type(table.insert)~="function" then error() end`,
    `if string.byte("Z",1)~=90 then error() end`,
    `if type(1)~="number" then error() end`,
    `if type(pcall)~="function" then error() end`
  ].join(' ');
}

/**
 * VM personalizada simple que ejecuta bytecodes
 */
function buildCustomVM() {
  const vmCode = `
local function _VM(bytes,consts)
  local stack={}
  local sp=0
  local ip=1
  local push=function(v) sp=sp+1 stack[sp]=v end
  local pop=function() local v=stack[sp] sp=sp-1 return v end
  
  while ip<=#bytes do
    local op=bytes[ip]
    ip=ip+1
    if op==1 then push(consts[bytes[ip]+1]) ip=ip+1
    elseif op==2 then push(nil)
    elseif op==3 then push(true)
    elseif op==4 then push(false)
    elseif op==5 then push(_G[consts[bytes[ip]+1]]) ip=ip+1
    elseif op==6 then _G[consts[bytes[ip]+1]]=pop() ip=ip+1
    elseif op==7 then local a,b=pop(),pop() push(b+a)
    elseif op==8 then local a,b=pop(),pop() push(b-a)
    elseif op==9 then local a,b=pop(),pop() push(b*a)
    elseif op==10 then local a,b=pop(),pop() push(b/a)
    elseif op==11 then local a,b=pop(),pop() push(b==a)
    elseif op==12 then local a,b=pop(),pop() push(b~=a)
    elseif op==13 then local a,b=pop(),pop() push(b<a)
    elseif op==14 then local a,b=pop(),pop() push(b>a)
    elseif op==15 then local a,b=pop(),pop() push(b<=a)
    elseif op==16 then local a,b=pop(),pop() push(b>=a)
    elseif op==17 then if not pop() then ip=bytes[ip]+1 else ip=ip+1 end
    elseif op==18 then ip=bytes[ip]+1
    elseif op==19 then local f=pop() local n=bytes[ip] ip=ip+1 local args={} for i=n,1,-1 do args[i]=pop() end f(unpack(args,1,n))
    elseif op==20 then local f=pop() local n=bytes[ip] ip=ip+1 local args={} for i=n,1,-1 do args[i]=pop() end local r={f(unpack(args,1,n))} for i=1,bytes[ip] do push(r[i]) end ip=ip+1
    elseif op==21 then return
    elseif op==22 then push(-pop())
    elseif op==23 then push(not pop())
    elseif op==24 then local a,b=pop(),pop() push(b%a)
    elseif op==25 then local a,b=pop(),pop() push(b^a)
    elseif op==26 then local a,b=pop(),pop() push(b..a)
    elseif op==27 then push(#pop())
    elseif op==28 then local t=pop() local k=pop() push(t[k])
    elseif op==29 then local t=pop() local k=pop() local v=pop() t[k]=v
    end
  end
end`
  return vmCode;
}

/**
 * Codifica código fuente a bytecodes de la VM personalizada
 */
function encodeToBytecode(sourceCode) {
  const bytes = [];
  const consts = [];
  const constMap = {};
  
  function getConstIdx(val) {
    const key = typeof val + ':' + val;
    if (constMap[key] === undefined) {
      constMap[key] = consts.length;
      consts.push(val);
    }
    return constMap[key];
  }
  
  const tokens = [];
  const tokenRegex = /\s*(--[^\n]*|"[^"]*"|'[^']*'|\d+\.?\d*|[a-zA-Z_]\w*|\.\.\.|[+\-*/%^#=<>]=?|[\(\)\[\]\{\},;:]|\.\.|\.)/g;
  let match;
  while ((match = tokenRegex.exec(sourceCode)) !== null) {
    if (!match[1].startsWith('--')) tokens.push(match[1]);
  }
  
  let pos = 0;
  function peek() { return tokens[pos]; }
  function next() { return tokens[pos++]; }
  
  function emit(op, arg) {
    bytes.push(op);
    if (arg !== undefined) bytes.push(arg);
  }
  
  function isNumber(t) { return !isNaN(t); }
  function isString(t) { return (t.startsWith('"') || t.startsWith("'")); }
  
  const locals = {};
  let localCount = 0;
  
  function parseChunk() {
    while (pos < tokens.length) {
      parseStatement();
    }
    emit(21); // RETURN
  }
  
  function parseStatement() {
    const t = peek();
    if (t === 'local') parseLocal();
    else if (t === 'if') parseIf();
    else if (t === 'while') parseWhile();
    else if (t === 'for') parseFor();
    else if (t === 'repeat') parseRepeat();
    else if (t === 'return') parseReturn();
    else if (t === 'do') parseDo();
    else if (t === 'function') parseFunction();
    else parseAssignOrCall();
  }
  
  function parseAssignOrCall() {
    const name = next();
    if (peek() === '=') {
      next();
      parseExpr();
      emit(6, getConstIdx(name)); // SET_GLOBAL
    } else if (peek() === '(') {
      const idx = getConstIdx(name);
      emit(5, idx); // GET_GLOBAL
      next();
      let args = 0;
      if (peek() !== ')') {
        while (true) {
          parseExpr();
          args++;
          if (peek() === ',') next();
          else break;
        }
      }
      next(); // ')'
      emit(19, args); // CALL_STMT
    } else if (peek() === '[' || peek() === '.') {
      emit(5, getConstIdx(name));
      if (peek() === '.') { next(); emit(1, getConstIdx(next())); }
      else { next(); parseExpr(); next(); }
      emit(28); // GETTABLE
      if (peek() === '=') { next(); parseExpr(); emit(29); } // SETTABLE
    }
  }
  
  function parseExpr() {
    parseOr();
  }
  
  function parseOr() {
    parseAnd();
    while (peek() === 'or') {
      next(); parseAnd();
      // or: a or b = not (not a and not b)
      emit(23); emit(23); // not not
      emit(23); // not
    }
  }
  
  function parseAnd() {
    parseCompare();
    while (peek() === 'and') {
      next(); parseCompare();
      // and
      emit(23); // not
      emit(23); // not
      // simplificado
    }
  }
  
  function parseCompare() {
    parseConcat();
    while (peek() === '==' || peek() === '~=' || peek() === '<' || peek() === '>' || peek() === '<=' || peek() === '>=') {
      const op = next();
      parseConcat();
      if (op === '==') emit(11);
      else if (op === '~=') emit(12);
      else if (op === '<') emit(13);
      else if (op === '>') emit(14);
      else if (op === '<=') emit(15);
      else if (op === '>=') emit(16);
    }
  }
  
  function parseConcat() {
    parseAddSub();
    while (peek() === '..') {
      next(); parseAddSub();
      emit(26);
    }
  }
  
  function parseAddSub() {
    parseMulDiv();
    while (peek() === '+' || peek() === '-') {
      const op = next();
      parseMulDiv();
      if (op === '+') emit(7);
      else emit(8);
    }
  }
  
  function parseMulDiv() {
    parseUnary();
    while (peek() === '*' || peek() === '/' || peek() === '%' || peek() === '^') {
      const op = next();
      parseUnary();
      if (op === '*') emit(9);
      else if (op === '/') emit(10);
      else if (op === '%') emit(24);
      else if (op === '^') emit(25);
    }
  }
  
  function parseUnary() {
    if (peek() === '-' || peek() === 'not' || peek() === '#') {
      const op = next();
      parseUnary();
      if (op === '-') emit(22);
      else if (op === 'not') emit(23);
      else if (op === '#') emit(27);
    } else {
      parsePrimary();
    }
  }
  
  function parsePrimary() {
    const t = next();
    if (isNumber(t)) {
      emit(1, getConstIdx(parseFloat(t)));
    } else if (isString(t)) {
      emit(1, getConstIdx(t.slice(1, -1)));
    } else if (t === 'nil') {
      emit(2);
    } else if (t === 'true') {
      emit(3);
    } else if (t === 'false') {
      emit(4);
    } else if (t === '(') {
      parseExpr();
      next(); // ')'
    } else if (t === '{') {
      emit(1, getConstIdx('__EMPTY_TABLE__'));
      // tablas simplificadas
      if (peek() !== '}') {
        while (pos < tokens.length && peek() !== '}') {
          if (peek() === ',') next();
          parseExpr();
          if (peek() === '=') { next(); parseExpr(); }
        }
      }
      next(); // '}'
    } else {
      emit(5, getConstIdx(t));
      if (peek() === '[') {
        next(); parseExpr(); next();
        emit(28);
      } else if (peek() === '.') {
        next(); emit(1, getConstIdx(next()));
        emit(28);
      }
    }
  }
  
  function parseLocal() { next(); const name = next(); if (peek() === '=') { next(); parseExpr(); } else { emit(2); } emit(6, getConstIdx(name)); }
  function parseIf() { next(); parseExpr(); emit(17, 0); const jmpAddr = bytes.length - 1; next(); parseBlockUntil('elseif', 'else', 'end'); if (peek() === 'else') { next(); bytes[jmpAddr] = bytes.length + 2; emit(18, 0); const jmpEnd = bytes.length - 1; parseBlockUntil('end'); bytes[jmpEnd] = bytes.length; } else if (peek() === 'elseif') { /* simplificado */ } else { bytes[jmpAddr] = bytes.length; } next(); }
  function parseWhile() { const loopStart = bytes.length; next(); parseExpr(); emit(17, 0); const jmpOut = bytes.length - 1; next(); parseBlockUntil('end'); emit(18, loopStart); bytes[jmpOut] = bytes.length; next(); }
  function parseFor() { next(); parseBlockUntil('do'); next(); parseBlockUntil('end'); next(); }
  function parseRepeat() { next(); const blockStart = bytes.length; parseBlockUntil('until'); next(); parseExpr(); emit(17, blockStart); }
  function parseReturn() { next(); if (peek() !== 'end' && peek() !== ';' && pos < tokens.length - 1) { parseExpr(); emit(21); } else { emit(21); } }
  function parseDo() { next(); parseBlockUntil('end'); next(); }
  function parseFunction() { next(); const name = next(); if (peek() === '.') { /* ignorar métodos */ } parseBlockUntil('end'); next(); }
  
  function parseBlockUntil(...stops) {
    while (pos < tokens.length && !stops.includes(peek())) {
      parseStatement();
    }
  }
  
  parseChunk();
  return { bytes, consts: consts.filter(c => c !== '__EMPTY_TABLE__') };
}

/**
 * Construye VM envuelta en byte strings
 */
function buildByteWrappedVM(vmCode, bytecode, consts) {
  const STACK = randomName();
  const POOL = randomName();
  const ORDER = randomName();
  
  // VM personalizada como bytes
  const vmBytes = [];
  for (let i = 0; i < vmCode.length; i++) {
    vmBytes.push(vmCode.charCodeAt(i));
  }
  
  // Bytecode del usuario
  const userBytes = bytecode;
  
  // Combinar todo en un solo payload
  const allBytes = [...vmBytes, ...userBytes];
  
  // Constantes serializadas
  const constsSer = consts.map(c => {
    if (typeof c === 'string') return `"${c}"`;
    return c;
  }).join(',');
  
  // Chunk falso de bytes
  const chunkSize = 10;
  const realChunks = [];
  for (let i = 0; i < allBytes.length; i += chunkSize) {
    realChunks.push(allBytes.slice(i, i + chunkSize));
  }
  
  const totalChunks = realChunks.length * 3;
  const poolVars = [];
  const realOrder = [];
  
  for (let i = 0; i < realChunks.length; i++) {
    const idx = Math.floor(Math.random() * totalChunks) + 1;
    if (!realOrder.includes(idx)) realOrder.push(idx);
  }
  
  let vmFinal = `local ${STACK}="" local ${POOL}={} `;
  
  for (let i = 0; i < totalChunks; i++) {
    if (realOrder.includes(i + 1)) {
      const realIdx = realOrder.indexOf(i + 1);
      vmFinal += `${POOL}[${i + 1}]={${realChunks[realIdx].join(',')}} `;
    } else {
      const fakeSize = Math.floor(Math.random() * 20) + 5;
      const fakeBytes = [];
      for (let j = 0; j < fakeSize; j++) fakeBytes.push(Math.floor(Math.random() * 256));
      vmFinal += `${POOL}[${i + 1}]={${fakeBytes.join(',')}} `;
    }
  }
  
  vmFinal += `local ${ORDER}={${realOrder.join(',')}} `;
  const idx = randomName();
  const bt = randomName();
  
  vmFinal += `for _,${idx} in ipairs(${ORDER}) do for _,${bt} in ipairs(${POOL}[${idx}]) do ${STACK}=${STACK}..string.char(${bt}) end end `;
  
  // Separar VM y bytecode del usuario
  vmFinal += `local _vmEnd=${vmBytes.length} `;
  vmFinal += `local _vmStr=${STACK}:sub(1,_vmEnd) `;
  vmFinal += `local _userStr=${STACK}:sub(_vmEnd+1) `;
  
  // Cargar VM
  vmFinal += `local _load=loadstring or load `;
  vmFinal += `local _VM=_load(_vmStr)() `;
  
  // Procesar bytecodes del usuario
  vmFinal += `local _userBytes={} `;
  vmFinal += `for _,${bt} in ipairs({_userStr:byte(1,-1)}) do table.insert(_userBytes,${bt}) end `;
  vmFinal += `_VM(_userBytes,{${constsSer}}) `;
  
  return vmFinal;
}

function obfuscate(sourceCode) {
  if (!sourceCode) return '--ERROR';
  
  const tamper = buildTamperChecks();
  const vmCode = buildCustomVM();
  const { bytes, consts } = encodeToBytecode(sourceCode);
  const finalVM = buildByteWrappedVM(vmCode, bytes, consts);
  
  return `${tamper};${finalVM}`;
}

module.exports = { obfuscate };
