using SeleniumAutomationDemo.Pages;

namespace SeleniumAutomationDemo.Tests.UI;

[TestFixture]
public class CheckboxTests : BaseTest
{
    private CheckboxPage _checkboxPage = null!;

    [SetUp]
    public void SetUp()
    {
        _checkboxPage = new CheckboxPage(Driver);
        _checkboxPage.Navigate();
    }

    [Test]
    public void FirstCheckboxStartsUnchecked()
    {
        Assert.That(_checkboxPage.IsFirstChecked(), Is.False);
    }

    [Test]
    public void SecondCheckboxStartsChecked()
    {
        Assert.That(_checkboxPage.IsSecondChecked(), Is.True);
    }

    [Test]
    public void TogglingFirstCheckboxChecksIt()
    {
        _checkboxPage.ClickFirstCheckbox();
        Assert.That(_checkboxPage.IsFirstChecked(), Is.True);
    }

    [Test]
    public void TogglingSecondCheckboxUnchecksIt()
    {
        _checkboxPage.ClickSecondCheckbox();
        Assert.That(_checkboxPage.IsSecondChecked(), Is.False);
    }
}
