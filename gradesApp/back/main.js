require("dotenv").config()

const webdriver = require("selenium-webdriver")
const { Browser, By} = require("selenium-webdriver")
const chrome = require("selenium-webdriver/chrome")

function initDriver()
{
  let driver = new webdriver.Builder()
    .forBrowser(Browser.CHROME)
    // .setChromeOptions(new chrome.Options().headless())
    .build()

  return driver
}


/**
 * TODO
 * 
 * @param {webdriver.ThenableWebDriver} driver 
 */
function eduMobile(driver)
{
  driver.get(process.env.EDU_MOBILE_URL)

  const pinEntry = driver.findElement(By.xpath('//*[@id="inputPin"]'))
  pinEntry.sendKeys(process.env.EDU_PIN)

  const pinOkBtn = driver.findElement(By.xpath('/html/body/div/form/input[2]'))
  pinOkBtn.click()


  try {
    var mobile_body = driver.findElement(By.xpath('/html/body')).getText()

  } catch {
    var mobile_body = driver.findElement(By.xpath('/html/body')).getText()
  }

  console.log(mobile_body)
}



function main()
{
  driver = initDriver()
  eduMobile(driver)

}

function foo() {
  document.getElementById("syncBtn").classList.add("rotation");
} 

main()