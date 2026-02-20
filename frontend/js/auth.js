document.addEventListener("DOMContentLoaded", () => {

    if (document.getElementById("loginForm")) {
        document.getElementById("loginForm")
            .addEventListener("submit", function (e) {
                e.preventDefault();

                fetch("../api/login.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: "username=" + username.value +
                        "&password=" + password.value
                })
                    .then(res => res.text())
                    .then(data => {
                        if (data.includes("successful")) {
                            window.location = "game.html";
                        } else {
                            message.innerText = data;
                        }
                    });
            });
    }

});
