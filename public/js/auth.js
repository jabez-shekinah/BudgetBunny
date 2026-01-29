const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const errorDiv = document.getElementById("auth-error");

// Helper to show errors
function showError(msg) {
  if (errorDiv) {
    errorDiv.textContent = msg;
    errorDiv.classList.remove("hidden");
  } else {
    alert(msg);
  }
}

// --- LOGIN LOGIC ---
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Save user info & redirect
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.href = "/";
      } else {
        showError(data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      showError("Server error. Is the backend running?");
    }
  });
}

// --- REGISTER LOGIC ---
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPass = document.getElementById("confirm-password").value;

    if (password !== confirmPass) {
      showError("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.href = "/";
      } else {
        showError(data.error || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      showError("Server error. Is the backend running?");
    }
  });
}
