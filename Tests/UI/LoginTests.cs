using SeleniumAutomationDemo.Pages;

namespace SeleniumAutomationDemo.Tests.UI;

[TestFixture]
public class LoginTests : BaseTest
{
    private LoginPage _loginPage = null!;

    [SetUp]
    public void SetUp()
    {
        _loginPage = new LoginPage(Driver);
    }

    [Test]
    public void SuccessfulLogin()
    {
        _loginPage.Navigate();
        _loginPage.Login("tomsmith", "SuperSecretPassword!");
        Assert.That(_loginPage.IsLoginSuccessful(), Is.True);
    }

    [Test]
    public void FailedLoginWithBadPassword()
    {
        _loginPage.Navigate();
        _loginPage.Login("tomsmith", "wrongpassword");
        Assert.That(_loginPage.IsLoginFailed(), Is.True);
    }

    [Test]
    public void FailedLoginWithBadUsername()
    {
        _loginPage.Navigate();
        _loginPage.Login("wronguser", "SuperSecretPassword!");
        Assert.That(_loginPage.IsLoginFailed(), Is.True);
    }
}
