using OpenQA.Selenium;
using SeleniumAutomationDemo.Config;

namespace SeleniumAutomationDemo.Pages;

public class FileUploadPage
{
    private readonly IWebDriver _driver;

    private IWebElement FileInput => _driver.FindElement(By.Id("file-upload"));
    private IWebElement UploadButton => _driver.FindElement(By.Id("file-submit"));
    private IWebElement UploadedHeading => _driver.FindElement(By.TagName("h3"));

    public FileUploadPage(IWebDriver driver)
    {
        _driver = driver;
    }

    public bool UploadFileSuccess()
    {
        _driver.Navigate().GoToUrl(TestConfig.UiBaseUrl + "/upload");
        // Unlike Playwright's SetInputFilesAsync, Selenium just SendKeys the path
        // straight into the hidden <input type="file">, which browsers accept
        // without ever opening a real OS file picker.
        var uploadFilePath = Path.Combine(AppContext.BaseDirectory, "Files", "test.txt");
        FileInput.SendKeys(uploadFilePath);
        UploadButton.Click();
        return UploadedHeading.Text == "File Uploaded!";
    }

    public bool UploadFileFailure()
    {
        _driver.Navigate().GoToUrl(TestConfig.UiBaseUrl + "/upload");
        var missingFilePath = Path.Combine(AppContext.BaseDirectory, "Files", "notexist.txt");
        try
        {
            // ChromeDriver reads the file from disk to transmit it (needed for
            // remote/grid setups), so a path that doesn't exist locally throws
            // here instead of failing later on submit.
            FileInput.SendKeys(missingFilePath);
            UploadButton.Click();
            return false; // if we get here, no exception was thrown
        }
        catch (WebDriverException)
        {
            return true; // expected - ChromeDriver rejects a nonexistent path
        }
    }
}
