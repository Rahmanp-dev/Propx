const fs = require('fs');
const path = require('path');

const ACTIONS_DIR = path.join(__dirname, 'src/lib/actions');

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
      
      const hasAuth = funcBody.includes('auth()') || funcBody.includes('await auth()') || funcBody.includes('getOrgContext') || funcBody.includes('getSession') || funcBody.includes('tenant-auth');
      
      const ignoredFuncs = ['verifyPaymentWebhook', 'getPaymentForPublicPage', 'authenticateTenant', 'authenticate', 'handleSignOut', 'registerOrganization', 'uploadSubscriptionProof', 'verifyPaymentProof'];
      
      if (!hasAuth && !ignoredFuncs.includes(funcName)) {
        issues.push(`${file} -> ${funcName}`);
      }
    }
  }
  return issues;
}

console.log("Missing auth():\n", findMissingAuth());
