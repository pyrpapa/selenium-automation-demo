# Selenium Automation Demo

[![Selenium Tests](https://github.com/pyrpapa/selenium-automation-demo/actions/workflows/tests.yml/badge.svg)](https://github.com/pyrpapa/selenium-automation-demo/actions/workflows/tests.yml)

**Live dashboard:** [pyrpapa.github.io/selenium-automation-demo](https://pyrpapa.github.io/selenium-automation-demo/) — rebuilt automatically on every push to `master`.

A small UI test automation project using Selenium WebDriver, built as a Selenium
counterpart to [playwright-automation-demo](https://github.com/pyrpapa/playwright-automation-demo) — same Page Object
Model structure and the same target site ([the-internet.herokuapp.com](https://the-internet.herokuapp.com)), so
you can compare how the two tools solve the same problems.

## Tech Stack
- **C# / .NET 10**
- **Selenium WebDriver 4** — browser automation
- **NUnit** — test framework
- **Chrome** — the only browser wired up so far (via Selenium Manager, see below)

## Project Structure
```
selenium-automation-demo/
├── .github/workflows/
│   └── tests.yml    # CI pipeline
├── Config/          # Test configuration (base URL, default wait timeout)
├── Pages/           # Page Object Models for each demo page
├── Files/           # Sample file used by upload/download tests
├── Scripts/
│   └── generate-report.js  # builds the HTML dashboard from JUnit results
├── dashboard/       # generated dashboard (history.json is committed to gh-pages by CI)
└── Tests/UI/
    ├── BaseTest.cs        # Creates/quits the ChromeDriver around every test
    ├── LoginTests.cs
    ├── CheckboxTests.cs
    ├── BasicAuthTests.cs
    ├── DragAndDropTests.cs
    ├── FileUploadTests.cs
    └── FileDownloadTests.cs
```

## Setup
1. Install the [.NET SDK](https://dotnet.microsoft.com/download) (10.0 or later) and Google Chrome.
2. Restore dependencies:
```powershell
dotnet restore
```
That's it — no separate driver download step. Selenium 4.6+ ships **Selenium
Manager**, which detects your installed Chrome version and downloads a matching
`chromedriver` automatically the first time a test runs.

## Running Tests
```powershell
# All tests (opens a visible Chrome window so you can watch it work)
dotnet test

# Run headless (no visible window - useful in CI or when you just want speed)
$env:HEADLESS = "true"; dotnet test

# A single test class
dotnet test --filter "ClassName=SeleniumAutomationDemo.Tests.UI.LoginTests"

# A single test
dotnet test --filter "Name=SuccessfulLogin"
```

## Using the Run Script
```powershell
.\run.ps1 test           # Run all tests + generate dashboard, visible browser
.\run.ps1 test-headless   # Run all tests + generate dashboard, no visible browser
.\run.ps1 test-login      # Run just the login tests + generate dashboard
.\run.ps1 report          # Regenerate the dashboard from the last test run
.\run.ps1 clean           # Clean build artifacts
.\run.ps1 build           # Build project
.\run.ps1 rebuild         # Clean then build
```

The dashboard is written to `dashboard/index.html` — open it in a browser to see
a pass/fail breakdown per suite, error details for failures, and a run-history
trend chart.

> **Note:** If you get a script execution error, run this first:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

## What Each Test Covers (and where Selenium differs from Playwright)
- **Login** — success/failure via form fill + submit. Straightforward in both tools.
- **Checkboxes** — reading/toggling checkbox state (`.Selected` vs Playwright's `IsCheckedAsync`).
- **Basic Auth** — credentials embedded in the URL. Selenium has no built-in way to
  intercept the native auth dialog on failure, so the failure case relies on the
  success text never appearing in time.
- **Drag and Drop** — the demo page uses native HTML5 drag events, which
  `Actions.DragAndDrop` does **not** trigger (a well-known Selenium gap). This
  project works around it by dispatching `dragstart`/`drop`/`dragend` events via
  JavaScript. Playwright's `DragToAsync` handles this natively, no workaround needed.
- **File Upload** — Selenium `SendKeys` writes the path directly into the hidden
  `<input type="file">`, so no OS file dialog ever opens. Uploading a path that
  doesn't exist throws from ChromeDriver itself (it reads the file from disk to
  transmit it), which is different from Playwright's `FileNotFoundException`.
- **File Download** — Selenium has no download-completed event. `BaseTest`
  configures Chrome to save downloads into a per-test temp directory, and
  `FileDownloadPage` polls that directory until the file shows up (or times out).
  Playwright instead exposes `WaitForDownloadAsync` as a first-class API.

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/tests.yml`) runs automatically on every push to `master` and on every pull request targeting `master` (plus manual triggers via `workflow_dispatch`):

1. Restores dependencies and builds (Chrome is preinstalled on `ubuntu-latest`; Selenium Manager fetches a matching chromedriver automatically)
2. Pulls the previous run's `history.json` down from `gh-pages` (if any), so the dashboard's pass/fail trend chart spans runs instead of resetting every time
3. Runs the full test suite headless (`dotnet test`) with the JUnit logger
4. Builds the consolidated HTML dashboard via `Scripts/generate-report.js`
5. Uploads the dashboard as a workflow artifact (retained 30 days)
6. On pushes to `master`, publishes the dashboard to GitHub Pages at [pyrpapa.github.io/selenium-automation-demo](https://pyrpapa.github.io/selenium-automation-demo/), so that link always reflects the most recent run
7. Fails the workflow (and badge) if any test failed, even though the dashboard step still runs so failures are visible on the live page

**One-time setup required:** GitHub Pages must be enabled for this repo before the live link works — `Settings → Pages → Source: Deploy from a branch → gh-pages → / (root)`. The `gh-pages` branch is created automatically the first time the workflow runs on `master`.

## Notes
- Only Chrome is wired up right now (`ChromeDriver` in `BaseTest.cs`). Adding
  Firefox/Edge just means swapping in `FirefoxDriver`/`EdgeDriver` — Selenium
  Manager handles those drivers too.
