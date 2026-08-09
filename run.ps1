param(
    [string]$command
)

$logger = '--logger "junit;LogFileName=TestResults.xml"'

function Invoke-Test([string]$filter = "") {
    if ($filter) {
        Invoke-Expression "dotnet test --filter `"$filter`" $logger"
    } else {
        Invoke-Expression "dotnet test $logger"
    }
    node Scripts/generate-report.js
}

switch ($command) {
    "test"          { Invoke-Test }
    "test-login"    { Invoke-Test "ClassName=SeleniumAutomationDemo.Tests.UI.LoginTests" }
    "test-headless" { $env:HEADLESS = "true"; Invoke-Test }
    "report"        { node Scripts/generate-report.js }
    "clean"         { dotnet clean }
    "build"         { dotnet build }
    "rebuild"       { dotnet clean; dotnet build }
    default {
        Write-Host "Available commands:"
        Write-Host "  test          Run all tests + generate report (visible browser window by default)"
        Write-Host "  test-login    Run just the login tests + generate report"
        Write-Host "  test-headless Run all tests with no visible browser window + generate report"
        Write-Host "  report        Generate dashboard report from the last test run"
        Write-Host "  clean         Clean build output"
        Write-Host "  build         Build project"
        Write-Host "  rebuild       Clean then build"
    }
}
