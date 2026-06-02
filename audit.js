const fs = require('fs');
const path = require('path');

const ACTIONS_DIR = path.join(__dirname, 'src/lib/actions');
const API_DIR = path.join(__dirname, 'src/app/api');

function findMissingAuth() {
  const files = fs.readdirSync(ACTIONS_DIR).filter(f => f.endsWith('.ts'));
  const issues = [];
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(ACTIONS_DIR, file), 'utf-8');
    const funcRegex = /export\s+async\s+function\s+(\w+)\s*\(/g;
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      const funcName = match[1];
      const funcStart = match.index;
      // find the end of the function body roughly
      let openBraces = 0;
      let funcBodyStart = content.indexOf('{', funcStart);
      let i = funcBodyStart;
      if (i === -1) continue;
      
      openBraces = 1;
      i++;
      while (i < content.length && openBraces > 0) {
        if (content[i] === '{') openBraces++;
        if (content[i] === '}') openBraces--;
        i++;
      }
      const funcBody = content.substring(funcStart, i);
      
      const hasAuth = funcBody.includes('auth()') || funcBody.includes('await auth()') || funcBody.includes('getSession');
      
      if (!hasAuth && funcName !== 'verifyPaymentWebhook' && funcName !== 'getPaymentForPublicPage' && funcName !== 'verifyPaymentWebhook' && funcName !== 'authenticateTenant') {
        issues.push(`${file} -> ${funcName}`);
      }
    }
  }
  return issues;
}

function findMissingTryCatchOrRawThrows() {
  const files = fs.readdirSync(ACTIONS_DIR).filter(f => f.endsWith('.ts'));
  const issues = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(ACTIONS_DIR, file), 'utf-8');
    const funcRegex = /export\s+async\s+function\s+(\w+)\s*\(/g;
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      const funcName = match[1];
      const funcStart = match.index;
      let openBraces = 0;
      let funcBodyStart = content.indexOf('{', funcStart);
      let i = funcBodyStart;
      if (i === -1) continue;
      
      openBraces = 1;
      i++;
      while (i < content.length && openBraces > 0) {
        if (content[i] === '{') openBraces++;
        if (content[i] === '}') openBraces--;
        i++;
      }
      const funcBody = content.substring(funcStart, i);
      
      if (!funcBody.includes('try {')) {
        issues.push(`No try-catch: ${file} -> ${funcName}`);
      } else if (funcBody.includes('throw new Error') && !funcBody.includes('success: false')) {
        issues.push(`Throws raw error instead of returning object: ${file} -> ${funcName}`);
      }
    }
  }
  return issues;
}

console.log("Missing auth():\n", findMissingAuth());
console.log("\nTry/catch or throw issues:\n", findMissingTryCatchOrRawThrows());
