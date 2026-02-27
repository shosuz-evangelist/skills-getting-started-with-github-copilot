function renderActivityCard(activity, name) {
  const card = document.createElement('div');
  card.className = 'activity-card';

  const spotsLeft = activity.max_participants - activity.participants.length;

  card.innerHTML = `
    <h4>${name}</h4>
    <p>${activity.description}</p>
    <p><strong>Schedule:</strong> ${activity.schedule}</p>
    <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
    <div class="participants-section">
      <h4>Participants</h4>
      <ul class="participants-list">
        ${
          activity.participants && activity.participants.length > 0
            ? activity.participants.map(p => `
                <li style="list-style-type:none;display:flex;align-items:center;gap:0.5em;">
                  <span>${p}</span>
                  <span class="delete-participant" title="Remove" data-activity="${name}" data-email="${p}" style="cursor:pointer;color:#ef4444;font-size:1.1em;">&#128465;</span>
                </li>
              `).join('')
            : '<li style="list-style-type:none;"><em>No participants yet</em></li>'
        }
      </ul>
    </div>
  `;

  // 削除アイコンのイベントリスナーを追加
  setTimeout(() => {
    card.querySelectorAll('.delete-participant').forEach(icon => {
      icon.addEventListener('click', function(e) {
        const activityName = this.getAttribute('data-activity');
        const email = this.getAttribute('data-email');
        unregisterParticipant(activityName, email);
      });
    });
  }, 0);

  return card;
}

function unregisterParticipant(activityName, email) {
  fetch(`/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`, {
    method: 'DELETE',
  })
    .then(res => {
      if (!res.ok) throw new Error('Failed to unregister');
      return res.json();
    })
    .then(() => {
      loadActivities();
    })
    .catch(() => {
      alert('Failed to unregister participant.');
    });
}
document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = renderActivityCard(details, name);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // 参加登録後にリストを更新
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
