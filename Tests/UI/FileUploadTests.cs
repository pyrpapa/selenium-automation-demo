using SeleniumAutomationDemo.Pages;

namespace SeleniumAutomationDemo.Tests.UI;

[TestFixture]
public class FileUploadTests : BaseTest
{
    private FileUploadPage _fileUploadPage = null!;

    [SetUp]
    public void SetUp()
    {
        _fileUploadPage = new FileUploadPage(Driver);
    }

    [Test]
    public void UploadingAnExistingFileSucceeds()
    {
        Assert.That(_fileUploadPage.UploadFileSuccess(), Is.True);
    }

    [Test]
    public void UploadingAMissingFileFails()
    {
        Assert.That(_fileUploadPage.UploadFileFailure(), Is.True);
    }
}
