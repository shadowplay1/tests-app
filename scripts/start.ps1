Write-Output "Starting dev server..."

$process = Start-Process -FilePath npx -ArgumentList "next dev" -NoNewWindow -PassThru
$processID = $process.Id

Wait-Process -Id $processID
$exitCode = $process.ExitCode

Write-Host "Process exited with code $exitCode. Press Enter to exit the script."
$null = Read-Host
