require("dotenv").config()

const webdriver = require("selenium-webdriver")
const { Browser, By, until} = require("selenium-webdriver")
const chrome = require("selenium-webdriver/chrome")


function initDriver(callback)
{
  let driver = new webdriver.Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(new chrome.Options().headless())
    .build()

  callback(driver)
  
}


/**
 * TODO
 * 
 * @param {CallableFunction} driver 
 */
function eduMobile(driver, callback)
{
  // @ts-ignore
  driver.get(process.env.EDU_MOBILE_URL)

  const pinEntry = driver.findElement(By.xpath('//*[@id="inputPin"]'))
  // @ts-ignore
  pinEntry.sendKeys(process.env.EDU_PIN)

  const pinOkBtn = driver.findElement(By.xpath('/html/body/div/form/input[2]'))
  pinOkBtn.click()

  setTimeout(function () 
  {
    let mobile_body = driver.findElement(By.xpath('/html/body'))
    mobile_body.getText().then(function (mobiledBodyText) 
    {
      let upToDate = false
      if (mobiledBodyText.indexOf("Sie haben alle Noten bestätigt.") == -1)
      {
        upToDate = true
      }

      return upToDate
    })
  }, 5000)
}

/**
 * 
 * @param {webdriver.ThenableWebDriver} driver 
 * @param {boolean} upToDate 
 */
function eduMain(driver, upToDate)
{
  if (upToDate == false)
  {
    console.log("not uptodate")
  }
  else
  {
    console.log("up to date")
  }
}


function main()
{


  
}

main()

// function foo() {
//   document.getElementById("syncBtn").classList.add("rotation");
// } 