using OpenQA.Selenium;
using SeleniumAutomationDemo.Config;

namespace SeleniumAutomationDemo.Pages;

public class DragAndDropPage
{
    private readonly IWebDriver _driver;
    private readonly IJavaScriptExecutor _js;

    // Columns
    public IWebElement ColumnA => _driver.FindElement(By.Id("column-a"));
    public IWebElement ColumnB => _driver.FindElement(By.Id("column-b"));
    public string ColumnAHeaderText => ColumnA.FindElement(By.TagName("header")).Text;
    public string ColumnBHeaderText => ColumnB.FindElement(By.TagName("header")).Text;

    public DragAndDropPage(IWebDriver driver)
    {
        _driver = driver;
        _js = (IJavaScriptExecutor)driver;
    }

    public void Navigate()
    {
        _driver.Navigate().GoToUrl(TestConfig.UiBaseUrl + "/drag_and_drop");
    }

    // the-internet's drag-and-drop page listens for native HTML5 drag events
    // (dragstart/drop/dragend). Selenium's Actions.DragAndDrop only synthesizes
    // mouse events, which this page ignores, so real HTML5 drag/drop has to be
    // simulated by dispatching those events via JS - unlike Playwright's
    // DragToAsync, which handles this natively.
    private const string DragDropScript = @"
        function fireEvent(node, type, dataTransfer) {
            var event = new Event(type, { bubbles: true, cancelable: true });
            event.dataTransfer = dataTransfer;
            node.dispatchEvent(event);
        }
        var source = arguments[0];
        var target = arguments[1];
        var dataTransfer = {
            data: {},
            setData: function(k, v) { this.data[k] = v; },
            getData: function(k) { return this.data[k]; }
        };
        fireEvent(source, 'dragstart', dataTransfer);
        fireEvent(target, 'drop', dataTransfer);
        fireEvent(source, 'dragend', dataTransfer);
    ";

    public void DragColumnAOntoColumnB()
    {
        _js.ExecuteScript(DragDropScript, ColumnA, ColumnB);
    }
}
