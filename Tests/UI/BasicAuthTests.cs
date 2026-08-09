using SeleniumAutomationDemo.Pages;

namespace SeleniumAutomationDemo.Tests.UI;

[TestFixture]
public class BasicAuthTests : BaseTest
{
    private BasicAuthPage _basicAuthPage = null!;

    [SetUp]
    public void SetUp()
    {
        _basicAuthPage = new BasicAuthPage(Driver);
    }

    [Test]
    public void SuccessfulBasicAuth()
    {
        Assert.That(_basicAuthPage.BasicAuthSuccess(), Is.True);
    }

    [Test]
    public void FailedBasicAuth()
    {
        Assert.That(_basicAuthPage.BasicAuthFailure(), Is.True);
    }
}
