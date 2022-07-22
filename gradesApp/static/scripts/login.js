let login = function () {
    let user = document.getElementById("user").value
    let pw = document.getElementById("pw").value

    let isUserEmpty = false
    let isPwEmpty = false
    if (user == "") {
        document.getElementById("user").style.borderColor = "#9c0606"
        isUserEmpty = true
    }
    else {
        document.getElementById("user").style.borderColor = "#1c215e"
    }
    if (pw == "") {
        document.getElementById("pw").style.borderColor = "#9c0606"
        isPwEmpty = true
    }
    else {
        document.getElementById("pw").style.borderColor = "#1c215e"
    }

    if (isUserEmpty || isPwEmpty) {
        document.getElementById("login-failed").innerHTML = "This field is required."
    }
    else {
        document.getElementById("submitBtn").disabled = true
        document.getElementById("loading-dots").style.display = "block"
        document.getElementById("login-failed").innerHTML = ""
        document.getElementById("user").style.borderColor = "#1c215e"
        document.getElementById("pw").style.borderColor = "#1c215e"
    
        let data = {"request": {"type": "set", "data":  {"username": user, "password": pw}}}
        fetch("http://localhost:5000/login", {             // origin: https://www.andrin-s.net/login
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(data)
        }).then(async res => {
            let rawResponse = await res.json()
            document.getElementById("submitBtn").disabled = false
            document.getElementById("loading-dots").style.display = "none"
            if (rawResponse["status"] == "invalid") {
                document.getElementById("login-failed").innerHTML = "Invalid username or password."
                document.getElementById("user").style.borderColor = "#9c0606"
                document.getElementById("pw").style.borderColor = "#9c0606"
            }
            else if (rawResponse["status"] == "ok") {
                document.getElementById("login-failed").innerHTML = ""
                document.getElementById("user").style.borderColor = "#1c215e"
                document.getElementById("pw").style.borderColor = "#1c215e"
                window.location.replace("http://localhost:5000/grades")
            }
    
        })
    }
}


/**
 * Load function.
 * To add things which should be made at first (e.g. event listeners).
 */ 
function load() {
    document.getElementById("submitBtn").addEventListener("click", login, false)
}

window.onload = load