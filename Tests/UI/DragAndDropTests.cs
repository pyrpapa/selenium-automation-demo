using SeleniumAutomationDemo.Pages;

namespace SeleniumAutomationDemo.Tests.UI;

[TestFixture]
public class DragAndDropTests : BaseTest
{
    private DragAndDropPage _dragAndDropPage = null!;

    [SetUp]
    public void SetUp()
    {
        _dragAndDropPage = new DragAndDropPage(Driver);
        _dragAndDropPage.Navigate();
    }

    [Test]
    public void DraggingColumnAOntoColumnBSwapsHeaders()
    {
        Assert.That(_dragAndDropPage.ColumnAHeaderText, Is.EqualTo("A"));
        Assert.That(_dragAndDropPage.ColumnBHeaderText, Is.EqualTo("B"));

        _dragAndDropPage.DragColumnAOntoColumnB();

        Assert.That(_dragAndDropPage.ColumnAHeaderText, Is.EqualTo("B"));
        Assert.That(_dragAndDropPage.ColumnBHeaderText, Is.EqualTo("A"));
    }
}
