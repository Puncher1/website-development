let sync = function() {
    document.getElementById("syncIcon").className = "ms-Icon ms-Icon--Sync syncIcon rotation"
    document.getElementById("syncBtn").disabled = true

    let data = {"request": {"type": "get", "data":  "grades"}}
    fetch("http://localhost:5000/grades", {             // origin: https://www.andrin-s.net/login
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    }).then(async res => {
        let rawResponse = await res.json()
        if (rawResponse["status"] == "true") {
            console.log("code needed")
            let code = "9876"
            let data = {"request": {"type": "set", "data":  ["code", code]}}
            fetch("http://localhost:5000/grades", {             // origin: https://www.andrin-s.net/login
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(data)
            }).then(async res => {
                let rawResponse = await res.json()
                let grades = rawResponse["data"]
                console.log(grades)
            })
        }
        else if (rawResponse["status"] == "false") {
            console.log("no code needed")
            let grades = rawResponse["data"]
            console.log(grades)
        }
        document.getElementById("syncIcon").className = "ms-Icon ms-Icon--CheckMark syncIcon"

    })
}

function checkForUpdate() {
    let data = {"request": {"type": "get", "data":  "update_needed"}}
    fetch("http://localhost:5000/grades", {             // origin: https://www.andrin-s.net/login
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    }).then(async res => {
        let rawResponse = await res.json()
        if (rawResponse["status"] == "true") {
            document.getElementById("syncIcon").className = "ms-Icon ms-Icon--Sync syncIcon"
            document.getElementById("syncBtn").disabled = false
        }
        else if (rawResponse["status"] == "false") {
            document.getElementById("syncIcon").className = "ms-Icon ms-Icon--CheckMark syncIcon"
        }

    })
}


/**
 * Load function.
 * To add things which should be made at first (e.g. event listeners).
 */ 
 function load() {
    document.getElementById("syncBtn").addEventListener("click", sync, false)
    checkForUpdate()
}

window.onload = load