using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;
using SeleniumAutomationDemo.Config;

namespace SeleniumAutomationDemo.Pages;

public class LoginPage
{
    private readonly IWebDriver _driver;
    private readonly WebDriverWait _wait;

    // Element Library
    private IWebElement UsernameField => _driver.FindElement(By.Id("username"));
    private IWebElement PasswordField => _driver.FindElement(By.Id("password"));
    private IWebElement LoginButton => _driver.FindElement(By.CssSelector("button[type='submit']"));

    public LoginPage(IWebDriver driver)
    {
        _driver = driver;
        _wait = new WebDriverWait(driver, TestConfig.DefaultWaitTimeout);
    }

    // Actions
    public void Navigate()
    {
        _driver.Navigate().GoToUrl(TestConfig.UiBaseUrl + "/login");
    }

    public void Login(string username, string password)
    {
        UsernameField.Clear();
        UsernameField.SendKeys(username);
        PasswordField.Clear();
        PasswordField.SendKeys(password);
        LoginButton.Click();
    }

    public bool IsLoginSuccessful() => IsFlashMessageVisible(".flash.success");

    public bool IsLoginFailed() => IsFlashMessageVisible(".flash.error");

    private bool IsFlashMessageVisible(string cssSelector)
    {
        try
        {
            return _wait.Until(d => d.FindElement(By.CssSelector(cssSelector)).Displayed);
        }
        catch (WebDriverTimeoutException)
        {
            return false;
        }
    }
}
