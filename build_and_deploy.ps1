$ErrorActionPreference = "Stop"

Write-Host "Instalando dependencias de sorteo..."
Push-Location sorteo
npm ci --prefer-offline
npm run build
Pop-Location

Write-Host "Instalando dependencias de live-feed..."
Push-Location live-feed
npm ci --prefer-offline
npm run build
Pop-Location

Write-Host "Instalando dependencias de subasta-silenciosa..."
Push-Location subasta-silenciosa
npm ci --prefer-offline
npm run build
Pop-Location

Write-Host "Construyendo dist_final..."
if (Test-Path dist_final) { Remove-Item -Recurse -Force dist_final }
New-Item -ItemType Directory -Force -Path dist_final | Out-Null

Copy-Item index.html dist_final/
Copy-Item index.css dist_final/
Copy-Item script.js dist_final/
Copy-Item CNAME dist_final/ -ErrorAction SilentlyContinue

if (Test-Path assets) { Copy-Item -Recurse assets dist_final/ }
if (Test-Path SVG) { Copy-Item -Recurse SVG dist_final/ }
if (Test-Path robots.txt) { Copy-Item robots.txt dist_final/ }
if (Test-Path sitemap.xml) { Copy-Item sitemap.xml dist_final/ }

New-Item -ItemType Directory -Force -Path dist_final/sorteo | Out-Null
Copy-Item -Recurse sorteo/dist/* dist_final/sorteo/

New-Item -ItemType Directory -Force -Path dist_final/live-feed | Out-Null
Copy-Item -Recurse live-feed/dist/* dist_final/live-feed/

New-Item -ItemType Directory -Force -Path dist_final/subasta-silenciosa | Out-Null
Copy-Item -Recurse subasta-silenciosa/dist/* dist_final/subasta-silenciosa/

if (Test-Path curso-maleki) { 
    # Usar robocopy para excluir node_modules
    robocopy curso-maleki dist_final/curso-maleki /E /XD node_modules .git /NFL /NDL /NJH /NJS /nc /ns /np
}
if (Test-Path sitio-prueba) { 
    robocopy sitio-prueba dist_final/sitio-prueba /E /XD node_modules .git /NFL /NDL /NJH /NJS /nc /ns /np
}
if (Test-Path nueva_version) { 
    robocopy nueva_version dist_final/nueva_version /E /XD node_modules .git /XF *.log /NFL /NDL /NJH /NJS /nc /ns /np
}

Write-Host "Desplegando en Firebase Hosting..."
firebase deploy --only hosting --project estudio-precinto
Write-Host "¡Despliegue completado con éxito!"
