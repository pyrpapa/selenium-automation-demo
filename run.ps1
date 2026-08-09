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
}

switch ($command) {
    "test"        { Invoke-Test }
    "test-login"  { Invoke-Test "ClassName=SeleniumAutomationDemo.Tests.UI.LoginTests" }
    "test-headless" { $env:HEADLESS = "true"; Invoke-Test }
    "clean"       { dotnet clean }
    "build"       { dotnet build }
    "rebuild"     { dotnet clean; dotnet build }
    default {
        Write-Host "Available commands:"
        Write-Host "  test          Run all tests (visible browser window by default)"
        Write-Host "  test-login    Run just the login tests"
        Write-Host "  test-headless Run all tests with no visible browser window"
        Write-Host "  clean         Clean build output"
        Write-Host "  build         Build project"
        Write-Host "  rebuild       Clean then build"
    }
}
