const fs = require('fs');
const path = require('path');

const dir = './src/lib/actions';
const files = fs.readdirSync(dir);

files.forEach(file => {
    if (file.endsWith('.ts')) {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Find all revalidatePath(...) calls
        const regex = /revalidatePath\([^)]+\)/g;
        let modified = false;
        
        content = content.replace(regex, (match) => {
            if (match === "revalidatePath('/', 'layout')" || match === "revalidatePath('/',\"layout\")") {
                return match;
            }
            modified = true;
            return "revalidatePath('/', 'layout')";
        });

        // Some files might now have multiple consecutive revalidatePath('/', 'layout')
        // Clean up duplicates (basic approach)
        if (modified) {
            const lines = content.split('\n');
            const newLines = [];
            let lastWasReval = false;
            
            for (let i = 0; i < lines.length; i++) {
                const isReval = lines[i].includes("revalidatePath('/', 'layout')");
                if (isReval) {
                    if (!lastWasReval) {
                        newLines.push(lines[i]);
                        lastWasReval = true;
                    }
                } else {
                    newLines.push(lines[i]);
                    if (lines[i].trim() !== '') {
                        lastWasReval = false;
                    }
                }
            }
            
            fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
            console.log(`Updated cache invalidation in ${file}`);
        }
    }
});
