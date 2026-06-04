const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('page.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src/app/(dashboard)/[userId]');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('force-dynamic')) {
        // find last import
        const lines = content.split('\n');
        let lastImportIdx = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import ')) {
                lastImportIdx = i;
            }
        }
        if (lastImportIdx !== -1) {
            lines.splice(lastImportIdx + 1, 0, '\nexport const dynamic = \'force-dynamic\'\n');
            fs.writeFileSync(file, lines.join('\n'), 'utf8');
            console.log('Added force-dynamic to', file);
        } else {
             console.log('No import found in', file);
        }
    } else {
        console.log('Already dynamic:', file);
    }
});
