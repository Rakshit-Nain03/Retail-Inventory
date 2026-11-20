$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
Write-Host 'Starting Retail Inventory backend...' -ForegroundColor Cyan
Write-Host 'Checking MySQL settings in src/main/resources/application.properties.' -ForegroundColor Yellow
if (-not (Test-Path '.\mvnw.cmd')) { throw 'mvnw.cmd not found. Run this script from the project root.' }
& .\mvnw.cmd clean spring-boot:run
