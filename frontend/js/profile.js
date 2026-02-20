fetch("../api/profile.php")
    .then(res => res.json())
    .then(data => {
        document.getElementById("stats").innerHTML =
            "Total Games: " + data.games +
            "<br>Highest Score: " + data.highest;
    });
