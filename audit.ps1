$files = Get-ChildItem -Path src\lib\actions -Filter *.ts -Recurse

Write-Host "=== SCANNING FOR N+1 QUERIES (await inside loops) ==="
foreach ($file in $files) {
    $content = Get-Content $file.FullName
    $inLoop = $false
    for ($i = 0; $i -lt $content.Length; $i++) {
        $line = $content[$i]
        if ($line -match "for\s*\(.*of\s" -or $line -match "\.map\s*\(") {
            $inLoop = $true
        }
        if ($line -match "^\s*\}\s*$" -or $line -match "^\s*\}\)\s*$") {
            # Basic heuristic to exit loop
            $inLoop = $false 
        }
        if ($inLoop -and $line -match "await\s+(prisma|db\.)") {
            Write-Host "Potential N+1 Query in $($file.Name) line $($i+1): $line"
        }
    }
}

Write-Host "`n=== SCANNING FOR IDOR VULNERABILITIES (update/delete without org check) ==="
foreach ($file in $files) {
    $content = Get-Content $file.FullName | Out-String
    if ($content -match "update\(\{" -or $content -match "delete\(\{") {
        if ($content -notmatch "organizationId" -and $content -notmatch "orgCtx") {
            Write-Host "Potential IDOR (No org check) in $($file.Name)"
        }
    }
}

Write-Host "`n=== SCANNING FOR MISSING CACHE INVALIDATION ==="
foreach ($file in $files) {
    $content = Get-Content $file.FullName | Out-String
    if ($content -match "(update|insert|delete|create)" -and $content -notmatch "revalidatePath") {
        Write-Host "Mutation without revalidatePath in $($file.Name)"
    }
}
