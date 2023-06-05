Write-Output "[1/2] Installing Node.js..."
Write-Host ""

if (!(Test-Path -Path "C:\Program Files\nodejs\node.exe")) {
    $url = "https://nodejs.org/dist/v14.17.0/node-v14.17.0-x64.msi"
    $installerPath = "$env:TEMP\node_installer.msi"

    Invoke-WebRequest -Uri $url -OutFile $installerPath

    Start-Process msiexec.exe -Wait -ArgumentList "/i $installerPath /quiet"

    $nodePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";C:\Program Files\nodejs"
    [System.Environment]::SetEnvironmentVariable("Path", $nodePath, "Machine")
}

Write-Output "[2/2] Installing dependencies..."
Write-Host ""

Start-Process npm -ArgumentList "install" -NoNewWindow -Wait
Start-Process npx -ArgumentList "husky install" -NoNewWindow -Wait

Copy-Item ".\.env.example" ".\.env"

Write-Output "Done!"
Write-Output "Now fill in all the fields in the new '.env' file."

Write-Host ""

Write-Output "Run 'scripts/start.ps1' file to launch the development server, or"

Write-Output "Press Enter to exit the script."
$null = Read-Host
