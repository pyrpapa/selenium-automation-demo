using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;

namespace SeleniumAutomationDemo.Tests.UI;

// NUnit runs base-class [SetUp]/[TearDown] methods automatically around each
// derived fixture's own SetUp/TearDown, so subclasses don't need to call these.
[TestFixture]
public abstract class BaseTest
{
    protected IWebDriver Driver = null!;
    protected string DownloadDirectory = null!;

    [SetUp]
    public void BaseSetUp()
    {
        DownloadDirectory = Path.Combine(Path.GetTempPath(), "selenium-downloads-" + Guid.NewGuid());
        Directory.CreateDirectory(DownloadDirectory);

        var options = new ChromeOptions();

        // Run headless on CI, or locally if HEADLESS=true is set. Left headed by
        // default locally so you can actually watch Selenium drive the browser.
        var runHeadless = Environment.GetEnvironmentVariable("CI") == "true"
            || string.Equals(Environment.GetEnvironmentVariable("HEADLESS"), "true", StringComparison.OrdinalIgnoreCase);
        if (runHeadless)
        {
            options.AddArgument("--headless=new");
        }

        options.AddArgument("--window-size=1280,900");
        options.AddUserProfilePreference("download.default_directory", DownloadDirectory);
        options.AddUserProfilePreference("download.prompt_for_download", false);

        // Selenium Manager (bundled with Selenium.WebDriver 4.6+) automatically
        // downloads a matching chromedriver the first time this runs - no manual
        // driver install required.
        Driver = new ChromeDriver(options);
    }

    [TearDown]
    public void BaseTearDown()
    {
        Driver.Quit();
        Driver.Dispose();

        if (Directory.Exists(DownloadDirectory))
        {
            Directory.Delete(DownloadDirectory, recursive: true);
        }
    }
}
