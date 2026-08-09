using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;
using SeleniumAutomationDemo.Config;

namespace SeleniumAutomationDemo.Pages;

public class BasicAuthPage
{
    private readonly IWebDriver _driver;
    private readonly WebDriverWait _wait;

    public BasicAuthPage(IWebDriver driver)
    {
        _driver = driver;
        _wait = new WebDriverWait(driver, TestConfig.DefaultWaitTimeout);
    }

    public bool BasicAuthSuccess()
    {
        _driver.Navigate().GoToUrl("https://admin:admin@the-internet.herokuapp.com/basic_auth");
        try
        {
            var text = _wait.Until(d => d.FindElement(By.TagName("p")).Text);
            return text.Contains("Congratulations");
        }
        catch (WebDriverTimeoutException)
        {
            return false;
        }
    }

    // With bad credentials the page never renders the success text - the browser
    // either blocks on a native basic-auth prompt or the server just returns a bare
    // 401 - so "failure" here means we never see the success message in time.
    public bool BasicAuthFailure()
    {
        try
        {
            _driver.Navigate().GoToUrl("https://wronguser:wrongpass@the-internet.herokuapp.com/basic_auth");
            var text = _wait.Until(d => d.FindElement(By.TagName("p")).Text);
            return !text.Contains("Congratulations");
        }
        catch (WebDriverException)
        {
            return true;
        }
    }
}
