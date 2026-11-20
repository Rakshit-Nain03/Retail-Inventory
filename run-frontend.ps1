$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot 'frontend-angular')
Write-Host 'Starting original Angular frontend...' -ForegroundColor Cyan
if (-not (Test-Path '.\package.json')) { throw 'frontend-angular package.json not found.' }
if (-not (Test-Path '.\node_modules')) { npm install }
npm start
