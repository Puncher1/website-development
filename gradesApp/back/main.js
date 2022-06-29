require("dotenv").config()

const { exit } = require("process")
const webdriver = require("selenium-webdriver")
const { Browser, By, until} = require("selenium-webdriver")
const chrome = require("selenium-webdriver/chrome")
const exec = require("child_process").exec
const prompt = require("prompt-sync")({ sigint: true })
const jsonfile = require("jsonfile")


/**
 * 
 * @param {String} grade 
 */
async function roundGrade(grade) { 
    return new Promise(resolve => {
        let grade_ = parseFloat(grade)
        let roundedGrade
        let noContinue = false
        
        if (isNaN(grade_)) {
            roundedGrade = grade
            noContinue = true
        }

        if (!noContinue) {
            // @ts-ignore
            let gradeDigit = grade_ - parseInt(grade_)

            if (gradeDigit == 0.25) {
                // @ts-ignore
                roundedGrade = (parseInt(grade_) + 0.5).toString()
            }
            else {
                // @ts-ignore
                roundedGrade = (Math.round(grade_ * 2) / 2).toString()
            }
        }

        console.log(`${grade}: ${roundedGrade}`)
        resolve(roundedGrade)
    })   
   
}

class Subject {
    constructor(name, abbr, type, exams, gradeAvgRaw, gradeAvgRound) {
        this.name = name
        this.abbr = abbr
        this.type = type
        this.exams = exams
        this.gradeAvgRaw = gradeAvgRaw
        this.gradeAvgRound = gradeAvgRound
    }
}

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


/**
 * 
 * @param {String} subjectName 
 * @param {String} subjectAbbr 
 */
async function getSubjectType(subjectName, subjectAbbr) {
    return new Promise (resolve => {
        let subjectType = "bm"
        if (["Bereichsübergreifende Projekte", "Elektrotechnik", "Hard- und Softwaretechnik", "Werkstoff- und Zeichnungstechnik", "Sport"].includes(subjectName)) {
            if (subjectAbbr.toLowerCase().includes("spbm")) {
                subjectType = "bm"
            }
            else {
                subjectType = "job"
            }
        }
        resolve(subjectType)
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
        if (mobiledBodyText.includes("Sie haben alle Noten bestätigt.")) {
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
        
            if (["Kurs Notendurchschnitt Bestätigt", ""].includes(subjectRowText)) {
                continue
            }
            subjectRowCount++
        }

        let i = 0
        while (i <= subjectRowCount) {
            let notClicking = false
            let buttonDetail = await driver.findElement(By.xpath(`//*[@id="einzelpr_btn_0_${i}"]`))
                .then(null, function(err) {
                    if (err.name === "NoSuchElementError") {
                        notClicking = true
                    }
                })
            
            if (!notClicking) {
                await buttonDetail.click()
            }

            i++
        }

        subjectRows = []
        let subjectRowCount_ = subjectRowCount
        i = 0
        while (i < subjectRowCount_) {
            let noContinue = false
            let subjectElementTest = await driver.findElement(By.xpath(`//*[@id="uebersicht_bloecke"]/page/div/table/tbody/tr[${i}]/td[4]`))
                .then(null, function(err) {
                    if (err.name === "NoSuchElementError") {
                        subjectRowCount_++
                        noContinue = true
                    }
                })
            
            if (!noContinue) {
                noContinue = false
                let subjectRow = await driver.findElement(By.xpath(`//*[@id="uebersicht_bloecke"]/page/div/table/tbody/tr[${i}]`))
                    .then(null, function(err) {
                        if (err.name === "NoSuchElementError") {
                            subjectRows.push("")
                            noContinue = true
                        }
                    })

                if (!noContinue) {
                    subjectRows.push(subjectRow)
                }
            }

            i++
        }

        let detailRows = []
        i = 3
        while (i <= (subjectRowCount * 3)) {
            let noContinue = false
            try {
                var detailTable = await driver.findElement(By.xpath(`//*[@id="uebersicht_bloecke"]/page/div/table/tbody/tr[${i}]/td/table`))
                var detailTableRows = await detailTable.findElements(By.css("tr"))
            }
            catch(err) {
                if (err.name === "NoSuchElementError") {
                    detailRows.push("")
                    noContinue = true
                }
            }
            
            if (!noContinue) {
                detailRows.push(detailTableRows)
            }

            i += 3
        }
        
        resolve([subjectRows, detailRows])
    })
}


async function manageData(subjectRows, detailRowsList) {
    return new Promise(async resolve => {
        let detailTexts = []
        for (const detailRows of detailRowsList) {

            let detailRowTexts = []
            for (const detailRow of detailRows) {
                let detailRowElements = await detailRow.findElements(By.css("td"))

                let detailRowElementTexts = []
                let skipElements = false
                for (const detailRowElement of detailRowElements) {
                    let detailRowElementText = await getElementText(detailRowElement)

                    if (["Aktueller Durchschnitt:", "Datum"].includes(detailRowElementText)) {
                        skipElements = true
                        break
                    } 

                    detailRowElementTexts.push(detailRowElementText)
                }

                if (skipElements) {
                    skipElements = false
                    continue
                }

                detailRowTexts.push(detailRowElementTexts)

            }

            detailTexts.push(detailRowTexts)
        }

        let subjectTexts = []
        for (const subjectRow of subjectRows) {
            let subjectRowElements = await subjectRow.findElements(By.css("td"))

            let subjectRowElementTexts = []
            for (const subjectRowElement of subjectRowElements) {
                let subjectRowElementText = await getElementText(subjectRowElement)
                subjectRowElementTexts.push(subjectRowElementText)
            }
            subjectTexts.push(subjectRowElementTexts)
        }

        resolve([subjectTexts, detailTexts])
    })
}


async function buildObjects(subjectTexts, detailTexts) {
    return new Promise(async resolve => {
        
        let subjObjects = []
        let zippedSubject = subjectTexts.map(function(e, i) {
            return [e, detailTexts[i]]
        })
        for (const [subjectText, subjectDetails] of zippedSubject) {
            let subjectNameAndAbbr = subjectText[0].split("\n")
            let subjectAbbr = subjectNameAndAbbr[0]
            let subjectName = subjectNameAndAbbr[1]
            let subjectAvgGrade = subjectText[1]
            let subjectType = await getSubjectType(subjectName, subjectAbbr)
            
            let dictExams = {}
            for (const exam of subjectDetails) {
                let examDate = exam[0]
                let examName = exam[1]
                let examGrade = exam[2]
                let examWeight = exam[3]
                let examClassAvg = exam[4]

                dictExams[examName] = {"date": examDate, "grade": examGrade, "weight": examWeight, "classAvg": examClassAvg}
            }
            
            const subj_obj = new Subject(subjectName, subjectAbbr, subjectType, dictExams, subjectAvgGrade, await roundGrade(subjectAvgGrade))
            subjObjects.push(subj_obj)
        }
        
        resolve(subjObjects)
    })

}


async function calcTypeAvg(subjObjects) {
    return new Promise(async resolve => {
        let bmAvg = 0
        let bmAvgRound = 0
        let jobAvg = 0
        let jobAvgRound = 0
    
        let bmCount = 0
        let jobCount = 0
        for (const subjObj of subjObjects) {
            let subjGradeRaw = parseFloat(subjObj.gradeAvgRaw)
            let subjGradeRounded = parseFloat(subjObj.gradeAvgRound)
            
            if (isNaN(subjGradeRaw) || isNaN(subjGradeRounded)) {
                continue
            }

            if (subjObj.type == "bm") {
                bmAvg += subjGradeRaw
                bmAvgRound += subjGradeRounded
                bmCount++
            }
            else {
                jobAvg += subjGradeRaw
                jobAvgRound += subjGradeRounded
                jobCount++
            }
        }
    
        bmAvg /= bmCount
        bmAvg = Math.round((bmAvg + Number.EPSILON) * 100) / 100
        bmAvgRound /= bmCount
        bmAvgRound = Math.round((bmAvgRound + Number.EPSILON) * 10) / 10
    
        jobAvg /= jobCount
        jobAvg = Math.round((jobAvg + Number.EPSILON) * 100) / 100
        jobAvgRound /= jobCount
        jobAvgRound = Math.round((jobAvgRound + Number.EPSILON) * 10) / 10
        

        const bmAvgs = [bmAvg, bmAvgRound]
        const jobAvgs = [jobAvg, jobAvgRound]

        resolve([bmAvgs, jobAvgs])
    })

}


async function main() {

    let driver = await initDriver()
    console.log("after init")

    const upToDate = await eduMobile(driver)
    console.log("after edu mobile: " + upToDate)

    // if (upToDate) {
    //     console.log("UP TO DATE!")
    // }

    await eduMain(driver)
    console.log("after edu main")

    const [subjectRows, detailRows] = await scrapeData(driver)
    console.log("after scrape data")

    const [subjectTexts, detailTexts] = await manageData(subjectRows, detailRows)
    console.log("after manage data")

    const subjObjects = await buildObjects(subjectTexts, detailTexts)
    console.log("after build objects")

    const [[bmAvg, bmAvgRound], [jobAvg, jobAvgRound]] = await calcTypeAvg(subjObjects)

    const dataFile = "./data.json"
    let dataJson = {}
    dataJson["bmAvg"] = [bmAvg.toString(), bmAvgRound.toString()] 
    dataJson["jobAvg"] = [jobAvg.toString(), jobAvgRound.toString()]
    dataJson["subjects"] = {}
    for (const subjObj of subjObjects) {
        dataJson["subjects"][subjObj.abbr] = {"gradeAvgRaw": subjObj.gradeAvgRaw, "gradeAvgRound": subjObj.gradeAvgRound, "exams": subjObj.exams}
    }

    jsonfile.writeFile(dataFile, JSON.stringify(dataJson, null, 2
        ), function(err) {
        if (err) {
            console.log(err)
        }
    })

    jsonfile.readFile(dataFile, function(err, obj) {
        if (err) {
            console.log(err)
        }
        else {
            console.log(obj)
        }
    })

}

main()

// function foo() {
//   document.getElementById("syncBtn").classList.add("rotation");
// } 