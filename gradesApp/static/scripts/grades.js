let syncWithCode = function() {
    let code = document.getElementById("code-input").value
    let data = {"request": {"type": "set", "data":  ["code", code]}}
    fetch("http://localhost:5000/grades", {             // origin: https://www.andrin-s.net/grades
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    }).then(async res => {
        let rawResponse = await res.json()
        if (rawResponse["status"] == "ok") {
            let grades = rawResponse["data"]
            console.log(grades)
        }
        else if (rawResponse["status"] == "failed") {
            document.getElementById("syncIcon").className = "ms-Icon ms-Icon--Cancel syncIcon"
        }
        document.getElementById("codeModal").style.display = "none"
        document.getElementById("container").className = "container"
        syncBtn.disabled = false
        syncBtn.className = "syncBtn"

    })

}

let sync = function() {
    document.getElementById("syncIcon").className = "ms-Icon ms-Icon--Sync syncIcon rotation"
    var syncBtn = document.getElementById("syncBtn")
    syncBtn.disabled = true
    syncBtn.className = "syncBtn-disabled syncBtn-blockedCursor"

    let data = {"request": {"type": "get", "data":  "grades"}}
    fetch("http://localhost:5000/grades", {             // origin: https://www.andrin-s.net/grades
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    }).then(async res => {
        let rawResponse = await res.json()
        if (rawResponse["status"] == "true") {
            console.log("code needed")
            document.getElementById("codeModal").style.display = "block"
            document.getElementById("container").className = "container not-focused"
            syncBtn.disabled = true
            syncBtn.className = "syncBtn-disabled"
        }
        else if (rawResponse["status"] == "false") {
            console.log("no code needed")
            let grades = rawResponse["data"]
            console.log(grades)
        }

        else if (rawResponse["status"] == "failed") {
            document.getElementById("syncIcon").className = "ms-Icon ms-Icon--Cancel syncIcon"
            syncBtn.disabled = false
            syncBtn.className = "syncBtn"
        }

    })
}

function checkForUpdate() {
    let data = {"request": {"type": "get", "data":  "update_needed"}}
    fetch("http://localhost:5000/grades", {             // origin: https://www.andrin-s.net/login
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    }).then(async res => {
        var syncBtn = document.getElementById("syncBtn")
        let rawResponse = await res.json()
        if (rawResponse["status"] == "true") {
            document.getElementById("syncIcon").className = "ms-Icon ms-Icon--Sync syncIcon"
            syncBtn.disabled = false
            syncBtn.className = "syncBtn"
        }
        else if (rawResponse["status"] == "false") {
            document.getElementById("syncIcon").className = "ms-Icon ms-Icon--CheckMark syncIcon"
        }
        else if (rawResponse["status"] == "failed") {
            document.getElementById("syncIcon").className = "ms-Icon ms-Icon--Cancel syncIcon"
            syncBtn.disabled = false
            syncBtn.className = "syncBtn"
        }

    })
}


function closeCodeModal() {
    let codeModal = document.getElementById("codeModal")
    codeModal.style.display = "none"
}

/**
 * Load function.
 * To add things which should be made at first (e.g. event listeners).
 */ 
 function load() {
    document.getElementById("syncBtn").addEventListener("click", sync, false)
    document.getElementById("sendBtn")
    checkForUpdate()
}

window.onload = load