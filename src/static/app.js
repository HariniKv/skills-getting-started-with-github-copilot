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

      // Reset select to placeholder before adding options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - (details.participants?.length || 0);

        // Build participants header
        const participants = details.participants || [];
        const count = participants.length;
        const participantsHeader = `<p class=\"participants-header\"><strong>Participants</strong> <span class=\"participant-count\">(${count})</span></p>`;

        // Build participants list with delete icon
        let participantsList = `<ul class=\"participants-list\">`;
        if (count === 0) {
          participantsList += `<li class=\"no-participants\">No participants yet</li>`;
        } else {
          participants.forEach(p => {
            participantsList += `<li><span>${p}</span> <span class=\"delete-icon\" title=\"Remove\" data-activity=\"${name}\" data-email=\"${p}\">&#128465;</span></li>`;
          });
        }
        participantsList += `</ul>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHeader}
          ${participantsList}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners for delete icons
      document.querySelectorAll('.delete-icon').forEach(icon => {
        icon.addEventListener('click', async (ev) => {
          const activity = icon.getAttribute('data-activity');
          const email = icon.getAttribute('data-email');
          if (!activity || !email) return;
          try {
            const endpoint = `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`;
            const res = await fetch(endpoint, { method: 'POST' });
            if (!res.ok) {
              const err = await res.json().catch(() => ({ detail: 'Unregister failed' }));
              throw new Error(err.detail || 'Unregister failed');
            }
            const result = await res.json();
            messageDiv.textContent = result.message || 'Participant removed';
            messageDiv.className = "success";
            messageDiv.classList.remove("hidden");
            setTimeout(() => {
              messageDiv.classList.add("hidden");
            }, 4000);
            // Refresh activities
            await fetchActivities();
          } catch (err) {
            messageDiv.textContent = err.message || 'Unregister failed';
            messageDiv.className = "error";
            messageDiv.classList.remove("hidden");
            setTimeout(() => {
              messageDiv.classList.add("hidden");
            }, 4000);
          }
        });
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
        messageDiv.className = "message success";
        signupForm.reset();

        // Refresh activities to update participants list and availability
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
