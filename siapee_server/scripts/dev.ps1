$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverDir = Join-Path $scriptDir '..'
$serverDir = Resolve-Path $serverDir
$env:PORT = "4001"
$env:HOST = "127.0.0.1"
Set-Location $serverDir
Write-Host "Starting dev server on http://$env:HOST:$env:PORT in $serverDir"
npm run dev