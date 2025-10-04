document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const loginForm = document.getElementById("login-form");
  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");
  const userSection = document.getElementById("user-section");
  const userAvatar = document.getElementById("user-avatar");

  let currentUser = null;

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons if logged in
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li>
                        <span class="participant-email">${email}</span>
                        ${
                          currentUser
                            ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>`
                            : ""
                        }
                      </li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
          ${
            currentUser
              ? `<form class="signup-form-card" data-activity="${name}">
                  <input type="email" placeholder="Student email" required />
                  <button type="submit">Register</button>
                </form>`
              : ""
          }
        `;

        activitiesList.appendChild(activityCard);
      });

      // Add event listeners
      if (currentUser) {
        document.querySelectorAll(".delete-btn").forEach((button) => {
          button.addEventListener("click", handleUnregister);
        });
        document
          .querySelectorAll(".signup-form-card")
          .forEach((form) => {
            form.addEventListener("submit", handleSignup);
          });
      }
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle signup from activity card
  async function handleSignup(event) {
    event.preventDefault();
    const form = event.target;
    const activity = form.getAttribute("data-activity");
    const email = form.querySelector("input[type='email']").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        form.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle login form submission
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = loginForm.username.value;
    const password = loginForm.password.value;

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (response.ok) {
        currentUser = username;
        updateUIForLogin();
        fetchActivities();
        loginForm.style.display = "none";
        loginForm.reset();
      } else {
        alert(result.detail || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred during login.");
    }
  });

  // Handle logout
  logoutButton.addEventListener("click", async () => {
    try {
      await fetch("/logout");
      currentUser = null;
      updateUIForLogout();
      fetchActivities();
    } catch (error) {
      console.error("Logout error:", error);
    }
  });

  // Show/hide login form
  loginButton.addEventListener("click", () => {
    loginForm.style.display =
      loginForm.style.display === "block" ? "none" : "block";
  });

  function updateUIForLogin() {
    userSection.style.display = "flex";
    userAvatar.textContent = currentUser.charAt(0).toUpperCase();
    loginButton.style.display = "none";
    logoutButton.style.display = "block";
    signupForm.style.display = "none"; // Hide main signup form
  }

  function updateUIForLogout() {
    userSection.style.display = "none";
    loginButton.style.display = "block";
    logoutButton.style.display = "none";
    signupForm.style.display = "block"; // Show main signup form
  }

  // Check initial login state
  async function checkLoginStatus() {
    try {
      const response = await fetch("/user");
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          currentUser = data.user;
          updateUIForLogin();
        }
      }
    } catch (error) {
      console.error("Error checking login status:", error);
    } finally {
      fetchActivities();
    }
  }

  // Initialize app
  checkLoginStatus();
});

