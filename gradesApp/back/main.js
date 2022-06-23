require("dotenv").config()

const webdriver = require("selenium-webdriver")
const { Browser, By, until} = require("selenium-webdriver")
const chrome = require("selenium-webdriver/chrome")


async function timeout(ms) {
  return new Promise(res => setTimeout(res, ms))
}


async function initDriver() {

  return new Promise(resolve => {
    console.log("init")
    let driver = new webdriver.Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(new chrome.Options().headless())
    .build()

    resolve(driver)
  })

}


/**
 * TODO
 * 
 * @param {webdriver.WebDriver} driver 
 */
async function eduMobile(driver) {

  return new Promise(async resolve => {
    
    // @ts-ignore
    driver.get(process.env.EDU_MOBILE_URL)

    const pinEntry = await driver.findElement(By.xpath('//*[@id="inputPin"]'))
    // @ts-ignore
    await pinEntry.sendKeys(process.env.EDU_PIN)
  
    const pinOkBtn = await driver.findElement(By.xpath('/html/body/div/form/input[2]'))
    await pinOkBtn.click()

    let mobileBody = await driver.findElement(By.xpath('/html/body'))
    var upToDate = false

    await mobileBody.getText().then(function(mobiledBodyText) {
      console.log(mobiledBodyText)

      if (mobiledBodyText.includes("Sie haben alle Noten bestätigt."))
      {
        console.log("if statement")
        upToDate = true
      }
    })
    
    resolve(upToDate)
  })
}


function eduMobileGetBody(driver) {


}


/**
 * 
 * @param {webdriver.ThenableWebDriver} driver 
 */
function eduMain(driver) {

}

async function main() {
  
  let driver = await initDriver()
  console.log("after init")
  let upToDate = await eduMobile(driver)
  
  console.log("after edu mobile: " + upToDate)
  if (upToDate == false)
  {
    console.log("not uptodate")
  }
  else
  {
    console.log("up to date")
  }

}

main()

// function foo() {
//   document.getElementById("syncBtn").classList.add("rotation");
// } 