using OpenQA.Selenium;
using SeleniumAutomationDemo.Config;

namespace SeleniumAutomationDemo.Pages;

public class CheckboxPage
{
    private readonly IWebDriver _driver;

    // Locators
    private IWebElement FirstCheckbox => _driver.FindElements(By.CssSelector("input[type='checkbox']"))[0];
    private IWebElement SecondCheckbox => _driver.FindElements(By.CssSelector("input[type='checkbox']"))[1];

    public CheckboxPage(IWebDriver driver)
    {
        _driver = driver;
    }

    public void Navigate()
    {
        _driver.Navigate().GoToUrl(TestConfig.UiBaseUrl + "/checkboxes");
    }

    public void ClickFirstCheckbox() => FirstCheckbox.Click();

    public void ClickSecondCheckbox() => SecondCheckbox.Click();

    public bool IsFirstChecked() => FirstCheckbox.Selected;

    public bool IsSecondChecked() => SecondCheckbox.Selected;
}
