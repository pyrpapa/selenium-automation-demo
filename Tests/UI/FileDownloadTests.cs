using SeleniumAutomationDemo.Pages;

namespace SeleniumAutomationDemo.Tests.UI;

[TestFixture]
public class FileDownloadTests : BaseTest
{
    private FileDownloadPage _fileDownloadPage = null!;

    [SetUp]
    public void SetUp()
    {
        _fileDownloadPage = new FileDownloadPage(Driver, DownloadDirectory);
    }

    [Test]
    public void UploadedFileAppearsOnDownloadPageAndDownloads()
    {
        var sourceFile = Path.Combine(AppContext.BaseDirectory, "Files", "test.txt");
        _fileDownloadPage.UploadFile(sourceFile);

        _fileDownloadPage.Navigate();
        Assert.That(_fileDownloadPage.IsFileLinkVisible("test.txt"), Is.True);

        var downloadedPath = _fileDownloadPage.ClickFileAndVerifyDownload("test.txt", TimeSpan.FromSeconds(10));
        Assert.That(downloadedPath, Is.Not.Empty);
        Assert.That(File.Exists(downloadedPath), Is.True);
    }
}
