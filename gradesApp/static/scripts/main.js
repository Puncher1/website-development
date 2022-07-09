let foo = function() {
    console.log("foo")
    let data = {"getData": "grades"}
    fetch("http://localhost:5000", {         // origin: https://www.andrin-s.net
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    }).then(async res => {
        let rawResponse = await res.json()
        console.log("Request complete! Responese: ", rawResponse)
    })
} 

function load() {
    console.log("hello")
    document.getElementById("syncBtn").addEventListener("click", foo, false)
}

window.onload = load