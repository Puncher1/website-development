require("dotenv").config()

const webdriver = require("selenium-webdriver")
const { Browser, By, until} = require("selenium-webdriver")
const chrome = require("selenium-webdriver/chrome")
const exec = require("child_process").exec
const prompt = require("prompt-sync")({ sigint: true })

/**
 * TODO
 * @param {webdriver.WebElement} element 
 */
async function getElementText(element) {
  return new Promise(async resolve => {
    await element.getText().then(function(elementText) {
      resolve(elementText)
    })

  })

}


async function timeout(ms) {
  return new Promise(res => setTimeout(res, ms))
}


async function initDriver() {

  return new Promise(resolve => {
    console.log("init")
    let driver = new webdriver.Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(new chrome.Options()
      .headless()
      .windowSize({width: 1920, height: 1080}))
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
    await driver.get(process.env.EDU_MOBILE_URL)

    const pinEntry = await driver.findElement(By.xpath('//*[@id="inputPin"]'))
    // @ts-ignore
    await pinEntry.sendKeys(process.env.EDU_PIN)
  
    const pinOkBtn = await driver.findElement(By.xpath('/html/body/div/form/input[2]'))
    await pinOkBtn.click()

    let mobileBody = await driver.findElement(By.xpath('/html/body'))
    let upToDate = false

    let mobiledBodyText = await getElementText(mobileBody)
    console.log(mobiledBodyText)
    if (mobiledBodyText.includes("Sie haben alle Noten bestätigt."))
    {
      console.log("if statement")
      upToDate = true
    }
    
    resolve(upToDate)
  })
}



/**
 * 
 * @param {webdriver.ThenableWebDriver} driver 
 */
async function eduMain(driver) {

  return new Promise(async resolve => {

    // @ts-ignore
    await driver.get(process.env.EDU_URL)

    let otpNeeded = true
  
    let otpButton = await driver.findElement(By.xpath('//*[@id="form-container"]/div[5]/div/a/span'))
      .then(null, function(err) {
        if (err.name === "NoSuchElementError") {
          otpNeeded = false

        }
      })
    
    if (otpNeeded) {
      // @ts-ignore
      await otpButton.click()
    }
    let usernameEntry = await driver.findElement(By.xpath('//*[@id="form-holder"]/div/form/div[1]/input'))
    // @ts-ignore
    await usernameEntry.sendKeys(process.env.EDU_USERNAME)

    let passwordEntry = await driver.findElement(By.xpath('//*[@id="form-holder"]/div/form/div[2]/input'))
    // @ts-ignore
    await passwordEntry.sendKeys(process.env.EDU_PASSWORD)

    let loginButton = await driver.findElement(By.xpath('//*[@id="form-actions"]/div/button'))
    await loginButton.click()

    if (otpNeeded) {
      exec('"C:/Users/andri/AppData/Local/authy/Authy Desktop.exe"',
        function (error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
            }
        });

      const otpInput = prompt("Please enter OTP: ")
      console.log(otpInput)

      let optEntry = await driver.findElement(By.xpath('//*[@id="form-holder"]/div/form/div[1]/input'))
      await optEntry.sendKeys(otpInput)
      
      let optButton = await driver.findElement(By.xpath('//*[@id="form-actions"]/div/button'))
      await optButton.click()

    }
    
    let gradesButton = await driver.findElement(By.xpath('//*[@id="menu21311"]'))
    console.log("before grades button")
    await gradesButton.click()
    console.log("after grades button")

    resolve(null)
  })

}


async function scrapeData(driver) {
  return new Promise(async resolve => {
    let gradesTable = await driver.findElement(By.xpath('//*[@id="uebersicht_bloecke"]/page/div/table'))
    let subjectRows = await gradesTable.findElements(By.css('tr'))
    
    let subjectRowCount = 0
    for (const subjectRow of subjectRows) {
      let subjectRowText = await getElementText(subjectRow)

    }

  })
  
}


async function main() {
  
  let driver = await initDriver()
  console.log("after init")
  let upToDate = await eduMobile(driver)
  
  console.log("after edu mobile: " + upToDate)
  await eduMain(driver)
  await scrapeData(driver)

  // if (upToDate == false)
  // {
  //   console.log("not uptodate")
  // }
  // else
  // {
  //   console.log("up to date")
  // }

}

main()

// function foo() {
//   document.getElementById("syncBtn").classList.add("rotation");
// } 