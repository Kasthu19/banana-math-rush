document.addEventListener("DOMContentLoaded", () => {
    const message = document.getElementById("message");

    // Login Form Handler
    if (document.getElementById("loginForm")) {
        document.getElementById("loginForm").addEventListener("submit", function (e) {
            e.preventDefault();

            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            fetch("../backend/api/login.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
            })
                .then(res => res.json())
                .then(data => {
                    if (data.status === "success") {
                        localStorage.setItem('username', data.username);
                        window.location.href = "index.html";
                    } else {
                        message.innerText = data.message;
                        message.className = "error";
                    }
                })
                .catch(err => {
                    message.innerText = "Connection error. Please try again.";
                    message.className = "error";
                });
        });

        // Check for success message from registration
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('msg')) {
            message.innerText = urlParams.get('msg');
            message.className = "success";
        }
    }

    // Register Form Handler
    if (document.getElementById("registerForm")) {
        document.getElementById("registerForm").addEventListener("submit", function (e) {
            e.preventDefault();

            const username = document.getElementById("username").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            if (password !== confirmPassword) {
                message.innerText = "Passwords do not match!";
                message.className = "error";
                return;
            }

            fetch("../backend/api/register.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
            })
                .then(res => res.json())
                .then(data => {
                    if (data.status === "success") {
                        // Redirect to login with success message
                        window.location.href = `login.html?msg=${encodeURIComponent(data.message)}`;
                    } else {
                        message.innerText = data.message;
                        message.className = "error";
                    }
                })
                .catch(err => {
                    message.innerText = "Connection error. Please try again.";
                    message.className = "error";
                });
        });
    }
});
