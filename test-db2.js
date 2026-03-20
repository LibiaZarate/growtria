import fs from 'fs';
const content = fs.readFileSync('server.ts', 'utf8');

const regex = /db\.prepare\(`?([\s\S]+?)`?\)\.(run|get|all)\(([\s\S]+?)\)/g;
let match;
while ((match = regex.exec(content)) !== null) {
  const query = match[1];
  const qCount = (query.match(/\?/g) || []).length;
  const argsStr = match[3];

  // count commas that are at top level
  let commas = 0;
  let depth = 0;
  for (let i = 0; i < argsStr.length; i++) {
    if (argsStr[i] === '(' || argsStr[i] === '[' || argsStr[i] === '{') depth++;
    if (argsStr[i] === ')' || argsStr[i] === ']' || argsStr[i] === '}') depth--;
    if (argsStr[i] === ',' && depth === 0) commas++;
  }
  let argsCount = argsStr.trim() ? commas + 1 : 0;

  if (qCount !== argsCount) {
    console.log('MISMATCH FOUND!!!');
    console.log('Query:', query.slice(0, 100).replace(/\s+/g, ' '));
    console.log('? count:', qCount, 'Args count:', argsCount);
    console.log('Args provided:', argsStr.trim());
    console.log('---');
  }
}
