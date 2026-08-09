using OpenQA.Selenium;
using SeleniumAutomationDemo.Config;

namespace SeleniumAutomationDemo.Pages;

public class FileDownloadPage
{
    private readonly IWebDriver _driver;
    private readonly string _downloadDirectory;

    private By LinkFor(string fileName) => By.LinkText(fileName);

    public FileDownloadPage(IWebDriver driver, string downloadDirectory)
    {
        _driver = driver;
        _downloadDirectory = downloadDirectory;
    }

    public void Navigate()
    {
        _driver.Navigate().GoToUrl(TestConfig.UiBaseUrl + "/download");
    }

    // the-internet's /download page just lists whatever is in a shared server-side
    // folder that /upload writes into, and that folder isn't guaranteed to persist.
    // Uploading here first makes the fixture self-contained instead of depending on
    // fragile external/shared state.
    public void UploadFile(string filePath)
    {
        _driver.Navigate().GoToUrl(TestConfig.UiBaseUrl + "/upload");
        _driver.FindElement(By.Id("file-upload")).SendKeys(filePath);
        _driver.FindElement(By.Id("file-submit")).Click();
    }

    public bool IsFileLinkVisible(string fileName)
    {
        return _driver.FindElements(LinkFor(fileName)).Any(e => e.Displayed);
    }

    // Selenium has no download-completed event like Playwright's WaitForDownloadAsync,
    // so we click the link then poll the Chrome download directory (configured in
    // BaseTest) until the file lands, or time out.
    public string ClickFileAndVerifyDownload(string fileName, TimeSpan timeout)
    {
        _driver.FindElement(LinkFor(fileName)).Click();
        var targetPath = Path.Combine(_downloadDirectory, fileName);
        var deadline = DateTime.UtcNow + timeout;
        while (DateTime.UtcNow < deadline)
        {
            if (File.Exists(targetPath) && !File.Exists(targetPath + ".crdownload"))
            {
                return targetPath;
            }
            Thread.Sleep(200);
        }
        return string.Empty;
    }
}
