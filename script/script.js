// ===== Configuration =====
const API_URL = `${window.location.protocol}//${window.location.hostname}:5002/api`;

// ===== UI Helpers (Toast & Modal) =====
function showToast(message, type = 'info') {
  const container = document.querySelector('.toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast-box ${type}`;
  toast.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background:none;border:none;color:#555;cursor:pointer;font-size:16px;">&times;</button>
    `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function createToastContainer() {
  const div = document.createElement('div');
  div.className = 'toast-container';
  document.body.appendChild(div);
  return div;
}

function showConfirm(message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
        <div class="modal-card">
            <h3>Confirmation</h3>
            <p>${message}</p>
            <div class="modal-actions">
                <button class="modal-btn cancel">Cancel</button>
                <button class="modal-btn confirm">Confirm</button>
            </div>
        </div>
    `;
  document.body.appendChild(overlay);

  overlay.querySelector('.cancel').onclick = () => overlay.remove();
  overlay.querySelector('.confirm').onclick = () => {
    overlay.remove();
    onConfirm();
  };
}

function showPrompt(message, defaultValue = "", onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
        <div class="modal-card">
            <h3>Input Required</h3>
            <p>${message}</p>
            <input type="number" id="prompt-input" value="${defaultValue}" style="width:100%; padding:10px; margin-bottom:20px; border:1px solid #ccc; border-radius:5px;">
            <div class="modal-actions">
                <button class="modal-btn cancel">Cancel</button>
                <button class="modal-btn confirm">Confirm</button>
            </div>
        </div>
    `;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('input');
  input.focus();

  overlay.querySelector('.cancel').onclick = () => overlay.remove();
  overlay.querySelector('.confirm').onclick = () => {
    const value = input.value;
    overlay.remove();
    if (value) onConfirm(value);
  };
}

// ===== Helper Functions (DOM) =====
function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return document.querySelectorAll(selector);
}

// ===== Navbar Status =====


// ===== Signup Logic =====
const signupForm = $("form[action='#']");
if (signupForm && window.location.pathname.includes("signup.html")) {
  signupForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = $("#name").value;
    const email = $("#email").value;
    const password = $("#password").value;

    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: name,
          email,
          password,
          phone: "0000000000" // Placeholder phone
        })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("gaariyaari_user", JSON.stringify(data));
        localStorage.setItem("gaariyaari_token", data.token);
        showToast("Signup successful! Redirecting...", "success");
        setTimeout(() => window.location.href = "index.html", 1500);
      } else {
        showToast(data.message || "Signup failed", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Something went wrong. Is the server running?", "error");
    }
  });
}

// ===== Login Logic =====
const loginForm = $(".form-container form");
if (loginForm && window.location.pathname.includes("login.html")) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = $("#email").value;
    const password = $("#password").value;

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("gaariyaari_user", JSON.stringify(data));
        localStorage.setItem("gaariyaari_token", data.token);
        showToast("Login successful!", "success");
        setTimeout(() => window.location.href = "index.html", 1000);
      } else {
        showToast(data.message || "Login failed", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Something went wrong. Is the server running?", "error");
    }
  });
}



// ===== Find Ride Logic =====


// ===== Shared Variables =====
let rideResults;
let findForm;

// ===== Initialize =====
document.addEventListener("DOMContentLoaded", () => {
  // Initialize shared variables
  findForm = $(".ride-search-form");
  rideResults = $(".ride-results");

  if (findForm && rideResults) {
    findForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      await searchRides();
    });

    // Load initial rides on page load (optional)
    // window.addEventListener('load', searchRides);
  }

  // ===== Access Control Logic =====
  const token = localStorage.getItem("gaariyaari_token");
  const protectedPages = ["offer-ride.html", "find-ride.html", "profile.html"];
  const currentPage = window.location.pathname.split("/").pop();

  // 1. Redirect if on protected page without token
  if (protectedPages.includes(currentPage) && !token) {
    window.location.href = "login.html";
    return;
  }

  // 2. Navbar & Link Visibility
  updateNavbar(token);
  updateProtectedLinks(token);

  // ===== Profile Logic =====
  if (currentPage === "profile.html") {
    loadProfile();
  }

  // ===== Signup Logic =====
  const signupForm = $("form[action='#']");
  if (signupForm && window.location.pathname.includes("signup.html")) {
    console.log("Signup form found");
    signupForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      console.log("Signup submit clicked");

      const name = $("#name").value;
      const email = $("#email").value;
      const password = $("#password").value;

      try {
        const res = await fetch(`${API_URL}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: name,
            email,
            password,
            phone: "0000000000" // Placeholder phone
          })
        });

        const data = await res.json();
        console.log("Signup response:", data);

        if (res.ok) {
          localStorage.setItem("gaariyaari_user", JSON.stringify(data));
          localStorage.setItem("gaariyaari_token", data.token);
          alert("Signup successful!");
          window.location.href = "index.html";
        } else {
          alert(data.message || "Signup failed");
        }
      } catch (err) {
        console.error(err);
        alert("Something went wrong. Is the server running?");
      }
    });
  }

  // ===== Login Logic =====
  const loginForm = $(".form-container form");
  if (loginForm && window.location.pathname.includes("login.html")) {
    console.log("Login form found");
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      console.log("Login submit clicked");

      const email = $("#email").value;
      const password = $("#password").value;

      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
          localStorage.setItem("gaariyaari_user", JSON.stringify(data));
          localStorage.setItem("gaariyaari_token", data.token);
          window.location.href = "index.html";
        } else {
          alert(data.message || "Login failed");
        }
      } catch (err) {
        console.error(err);
        alert("Something went wrong. Is the server running?");
      }
    });
  }

  // ===== Offer Ride Logic =====
  // ===== Offer Ride Logic =====
  const offerForm = $(".ride-form.offer-form");
  if (offerForm) {
    offerForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const token = localStorage.getItem("gaariyaari_token");
      if (!token) {
        showToast("Please login to offer a ride", "error");
        setTimeout(() => window.location.href = "login.html", 1500);
        return;
      }

      const rideData = {
        city: $("#city").value,
        pickup: $("#pickup").value,
        destination: $("#destination").value,
        datetime: $("#datetime").value,
        seats_available: $("#seats").value,
        cost: $("#cost").value,
        vehicle_type: $("#vehicle-type").value,
        vehicle_name: $("#vehicle-name").value,
        vehicle_number: $("#vehicle-number").value
      };

      try {
        const res = await fetch(`${API_URL}/rides`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(rideData)
        });

        const data = await res.json();

        if (res.ok) {
          showToast("Ride posted successfully!", "success");
          offerForm.reset();
        } else {
          showToast(data.message || "Failed to post ride", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Error connecting to server", "error");
      }
    });
  }

  // ===== Find Ride Logic =====
  if (findForm && rideResults) {
    findForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      await searchRides();
    });
  }
});

// ===== Global Functions =====

// ===== Make Functions Global =====
window.searchRides = searchRides;
window.bookRide = bookRide;
// Other functions will be attached where they are defined or here if needed
// But let's attach them explicitly at the end of the file or ensure they are global.
// For now, let's fix searchRides first.

async function searchRides() {
  const city = $("#city").value;
  const pickup = $("#pickup").value;
  const destination = $("#destination").value;
  const date = $("#date").value;

  let query = `?`;
  if (city) query += `city=${city}&`;
  if (pickup) query += `pickup=${pickup}&`;
  if (destination) query += `destination=${destination}&`;
  if (date) query += `date=${date}&`;

  try {
    const res = await fetch(`${API_URL}/rides${query}`);
    const rides = await res.json();

    if (rides.length === 0) {
      rideResults.innerHTML = "<p>No rides found. Try different search.</p>";
    } else {
      let html = "<h2>Available Rides</h2>";
      rides.forEach(r => {
        html += `
          <div class="booking-card" style="border:1px solid #ddd; padding:10px; margin-bottom:10px; border-radius:5px;">
            <p><strong>Driver:</strong> ${r.driver_id ? r.driver_id.full_name : 'Unknown'}</p>
            <p><strong>Vehicle:</strong> ${r.vehicle_type || 'Car'} - ${r.vehicle_name || 'N/A'} (${r.vehicle_number || 'N/A'})</p>
            <p><strong>Pickup:</strong> ${r.pickup}</p>
            <p><strong>Drop:</strong> ${r.destination}</p>
            <p><strong>Date & Time:</strong> ${new Date(r.datetime).toLocaleString()}</p>
            <p><strong>Seats Available:</strong> ${r.seats_available}</p>
            <p><strong>Cost per Seat:</strong> PKR ${r.cost}</p>
            <button onclick="bookRide('${r._id}')" style="background-color: #00b4db; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: 600; margin-top: 10px; transition: 0.3s;">Request Ride</button>
          </div>`;
      });
      rideResults.innerHTML = html;
    }
  } catch (err) {
    console.error(err);
    if (rideResults) rideResults.innerHTML = "<p>Error fetching rides.</p>";
  }
}

// Note: We use showPrompt which is callback based
function bookRide(rideId) {
  const token = localStorage.getItem("gaariyaari_token");
  if (!token) {
    showToast("Please login to book a ride", "error");
    setTimeout(() => window.location.href = "login.html", 1500);
    return;
  }

  showPrompt("How many seats to book?", "1", async (seats) => {
    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ride_id: rideId,
          seats_booked: parseInt(seats)
        })
      });

      const data = await res.json();

      if (res.ok) {
        showToast("Booking successful!", "success");
        if (typeof searchRides === 'function') searchRides();
      } else {
        showToast(data.message || "Booking failed", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error connecting to server", "error");
    }
  });
}

// ===== Helper: Update Navbar based on Token =====
function updateNavbar(token) {
  const authLink = $(".auth-link");
  const user = JSON.parse(localStorage.getItem("gaariyaari_user"));

  if (token && user) {
    // Extract Initials (First letter of first name)
    const initials = user.full_name ? user.full_name.charAt(0) : "U";

    authLink.textContent = initials;
    authLink.href = "profile.html";
    authLink.className = "user-icon"; // Apply new class, replace old classes
    authLink.title = `Profile (${user.full_name})`; // Tooltip

    // Remove login-btn class if present
    authLink.classList.remove('login-btn');
    authLink.classList.remove('auth-link'); // Remove default link style if it conflicts
  } else {
    authLink.textContent = "Login";
    authLink.href = "login.html";
    authLink.className = "auth-link"; // Reset class
  }
}

// ===== Helper: Show/Hide Protected Links based on Role =====
function updateProtectedLinks(token) {
  const user = JSON.parse(localStorage.getItem("gaariyaari_user"));
  const role = user ? user.role : null;

  const offerLink = $("a[href='offer-ride.html']");
  const findLink = $("a[href='find-ride.html']");

  // Reset displays first
  if (offerLink && offerLink.closest("li")) offerLink.closest("li").style.display = "none";
  if (findLink && findLink.closest("li")) findLink.closest("li").style.display = "none";

  if (token && role) {
    if (role === 'driver') {
      if (offerLink) offerLink.closest("li").style.display = "block";
    } else if (role === 'passenger') {
      if (findLink) findLink.closest("li").style.display = "block";
    }
  }
}

// ===== Helper: Logout =====
function logout() {
  localStorage.removeItem("gaariyaari_user");
  localStorage.removeItem("gaariyaari_token");
  showToast("Logged out successfully", "info");
  setTimeout(() => window.location.href = "index.html", 1000);
}

// ===== Helper: Load Profile Data =====
async function loadProfile() {
  // Create user object and token reference
  const user = JSON.parse(localStorage.getItem("gaariyaari_user"));
  const token = localStorage.getItem("gaariyaari_token");

  if (!user || !token) return;

  // Fill Basic Info
  $("#profile-name").textContent = user.full_name;
  $("#profile-email").textContent = user.email;
  $("#profile-role").textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  $("#profile-phone").textContent = user.phone || "N/A";

  // Add Logout & Switch Role Buttons
  const profileInfo = $(".profile-info");

  // Clear any existing buttons to avoid duplicates on re-render
  const existingBtns = profileInfo.querySelectorAll("button");
  existingBtns.forEach(btn => btn.remove());

  const btnContainer = document.createElement("div");
  btnContainer.style.marginTop = "15px";
  btnContainer.style.display = "flex";
  btnContainer.style.gap = "10px";

  const logoutBtn = document.createElement("button");
  logoutBtn.textContent = "Logout";
  logoutBtn.style.backgroundColor = "#ff4444";
  logoutBtn.style.padding = "8px 15px";
  logoutBtn.style.border = "none";
  logoutBtn.style.borderRadius = "5px";
  logoutBtn.style.color = "white";
  logoutBtn.style.cursor = "pointer";
  logoutBtn.onclick = logout;

  const switchBtn = document.createElement("button");
  const targetRole = user.role === 'passenger' ? 'driver' : 'passenger';
  switchBtn.textContent = `Switch to ${targetRole.charAt(0).toUpperCase() + targetRole.slice(1)}`;
  switchBtn.style.backgroundColor = "#00b4db";
  switchBtn.style.padding = "8px 15px";
  switchBtn.style.border = "none";
  switchBtn.style.borderRadius = "5px";
  switchBtn.style.color = "white";
  switchBtn.style.cursor = "pointer";
  switchBtn.onclick = () => switchRole(targetRole);

  btnContainer.appendChild(switchBtn);
  btnContainer.appendChild(logoutBtn);
  profileInfo.appendChild(btnContainer);

  const container = $("#user-bookings");
  container.innerHTML = "<p>Loading...</p>";

  try {
    if (user.role === 'passenger') {
      const res = await fetch(`${API_URL}/bookings/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const bookings = await res.json();

      if (bookings.length === 0) {
        container.innerHTML = "<p>No bookings found.</p>";
      } else {
        // Filter Bookings
        const activeBookings = bookings.filter(b => ['pending', 'confirmed'].includes(b.status));
        const historyBookings = bookings.filter(b => ['completed', 'declined', 'cancelled'].includes(b.status));

        let html = "";

        // ACTIVE BOOKINGS
        html += "<h3>Active Bookings</h3>";
        if (activeBookings.length === 0) html += "<p>No active bookings.</p>";
        else {
          activeBookings.forEach(b => {
            const ride = b.ride_id || {};
            const driver = ride.driver_id || {};
            let statusColor = b.status === 'confirmed' ? 'green' : 'orange';

            html += `
                <div class="booking-card" style="border:1px solid #ddd; padding:10px; margin-bottom:10px; border-radius:5px; background: white;">
                    <p><strong>Ride:</strong> ${ride.pickup || 'Unknown'} to ${ride.destination || 'Unknown'}</p>
                    <p><strong>Date:</strong> ${ride.datetime ? new Date(ride.datetime).toLocaleString() : 'N/A'}</p>
                    <p><strong>Vehicle:</strong> ${ride.vehicle_type || 'N/A'} - ${ride.vehicle_name || ''} (${ride.vehicle_number || ''})</p>
                    <p><strong>Driver:</strong> ${driver.full_name || 'Unknown'}</p>
                    <p><strong>Status:</strong> <span style="color:${statusColor}; font-weight:bold;">${b.status.toUpperCase()}</span></p>
                    
                    <div style="margin-top:5px;">
                        ${b.status === 'confirmed' ? `<button onclick="completeBooking('${b._id}')" style="background:#28a745; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer; margin-right:5px;">Complete Ride</button>` : ''}
                        <button onclick="cancelBooking('${b._id}')" style="background:orange; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer;">Cancel Booking</button>
                    </div>
                </div>`;
          });
        }

        // HISTORY
        html += "<h3 style='margin-top:20px; color:#666;'>Ride History</h3>";
        if (historyBookings.length === 0) html += "<p>No history.</p>";
        else {
          historyBookings.forEach(b => {
            const ride = b.ride_id || {};
            let statusColor = b.status === 'completed' ? 'green' : 'red';

            html += `
                <div class="booking-card" style="border:1px solid #eee; padding:10px; margin-bottom:10px; border-radius:5px; background: #f9f9f9; opacity: 0.8;">
                    <p><strong>Ride:</strong> ${ride.pickup || 'Unknown'} to ${ride.destination || 'Unknown'}</p>
                    <p><strong>Date:</strong> ${ride.datetime ? new Date(ride.datetime).toLocaleString() : 'N/A'}</p>
                    <p><strong>Status:</strong> <span style="color:${statusColor}; font-weight:bold;">${b.status.toUpperCase()}</span></p>
                </div>`;
          });
        }

        container.innerHTML = html;
      }
    } else if (user.role === 'driver') {
      // 1. Fetch My Offered Rides
      const ridesRes = await fetch(`${API_URL}/rides/my-rides`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const rides = await ridesRes.json();

      // 2. Fetch Incoming Requests (Bookings)
      const reqRes = await fetch(`${API_URL}/bookings/driver/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const requests = await reqRes.json();

      let html = "";

      // --- SECTION 1: INCOMING REQUESTS (Pending Bookings) ---
      const pendingRequests = requests.filter(r => r.status === 'pending');
      html += "<h3>Incoming Requests</h3>";
      if (pendingRequests.length > 0) {
        pendingRequests.forEach(req => {
          const ride = req.ride_id || {};
          const passenger = req.passenger_id || {};
          html += `
          <div class="booking-card" style="border:1px solid #ffcc00; padding:10px; margin-bottom:10px; border-radius:5px; background: #fffbe6;">
              <p><strong>Request From:</strong> ${passenger.full_name} (${passenger.phone || passenger.email})</p>
              <p><strong>Ride:</strong> ${ride.pickup} to ${ride.destination}</p>
              <p><strong>Seats Requested:</strong> ${req.seats_booked}</p>
              <div style="margin-top:10px;">
                  <button onclick="updateBookingStatus('${req._id}', 'confirmed')" style="background:green; color:white; border:none; padding:5px 10px; margin-right:5px; cursor:pointer; border-radius:3px;">Accept</button>
                  <button onclick="updateBookingStatus('${req._id}', 'declined')" style="background:red; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:3px;">Decline</button>
              </div>
          </div>`;
        });
      } else {
        html += "<p>No pending requests.</p>";
      }

      // --- SECTION 2: ACTIVE RIDES ---
      const activeRides = rides.filter(r => r.status === 'active');
      html += "<h3 style='margin-top:20px;'>My Active Rides</h3>";
      if (activeRides.length === 0) {
        html += "<p>No active rides.</p>";
      } else {
        activeRides.forEach(r => {
          // Check for confirmed bookings for this ride to show "Complete" button
          const hasConfirmed = requests.some(req =>
            req.ride_id && req.ride_id._id === r._id && req.status === 'confirmed'
          );

          html += `
                <div class="booking-card" style="border:1px solid #ddd; padding:10px; margin-bottom:10px; border-radius:5px; background: white;">
                    <p><strong>Route:</strong> ${r.pickup} to ${r.destination}</p>
                    <p><strong>Date:</strong> ${new Date(r.datetime).toLocaleString()}</p>
                    <p><strong>Vehicle:</strong> ${r.vehicle_type} - ${r.vehicle_name}</p>
                    <p><strong>Seats Available:</strong> ${r.seats_available}</p>
                    <p><strong>Cost:</strong> PKR ${r.cost}</p>
                    <div style="margin-top:10px;">
                        ${hasConfirmed ? `<button onclick="completeRide('${r._id}')" style="background:#28a745; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer; margin-right:5px;">Complete Ride</button>` : ''}
                        <button onclick="deleteRide('${r._id}')" style="background:#dc3545; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer;">Delete Ride</button>
                    </div>
                </div>`;
        });
      }

      // --- SECTION 3: RIDE HISTORY (Unified) ---
      // 3a. History Rides (Completed/Cancelled by Driver)
      const historyRides = rides.filter(r => ['completed', 'cancelled'].includes(r.status));
      const mappedHistoryRides = historyRides.map(r => ({
        type: 'RIDE',
        date: new Date(r.datetime),
        data: r,
        status: r.status
      }));

      // 3b. History Bookings (Completed/Cancelled/Declined with Passenger)
      const historyBookings = requests.filter(req => ['completed', 'cancelled', 'declined'].includes(req.status));
      const mappedHistoryBookings = historyBookings.map(req => ({
        type: 'BOOKING',
        date: new Date(req.updatedAt || req.ride_id.datetime), // Use update time or ride time
        data: req,
        status: req.status
      }));

      // 3c. Combine & Sort
      const combinedHistory = [...mappedHistoryRides, ...mappedHistoryBookings];
      combinedHistory.sort((a, b) => b.date - a.date); // Newest first

      html += "<h3 style='margin-top:20px; color:#666;'>History</h3>";
      if (combinedHistory.length === 0) {
        html += "<p>No history.</p>";
      } else {
        combinedHistory.forEach(item => {
          if (item.type === 'RIDE') {
            // It's a Driver's Ride
            const r = item.data;
            let statusColor = r.status === 'completed' ? 'green' : 'red';
            html += `
                <div class="booking-card" style="border:1px solid #ccc; padding:10px; margin-bottom:10px; border-radius:5px; background: #f0f0f0; opacity:0.9;">
                    <p style="font-size:0.9em; color:#555;">[MY RIDE]</p>
                    <p><strong>Route:</strong> ${r.pickup} to ${r.destination}</p>
                    <p><strong>Date:</strong> ${new Date(r.datetime).toLocaleString()}</p>
                    <p><strong>Status:</strong> <span style="color:${statusColor}; font-weight:bold;">${r.status.toUpperCase()}</span></p>
                </div>`;
          } else {
            // It's a Passenger Booking
            const req = item.data;
            const ride = req.ride_id || {};
            const passenger = req.passenger_id || {};
            let statusColor = req.status === 'completed' ? 'green' : 'red';
            let statusLabel = req.status.toUpperCase();
            if (req.status === 'cancelled') statusLabel = "CANCELLED BY PASSENGER";

            html += `
                <div class="booking-card" style="border:1px solid #ccc; padding:10px; margin-bottom:10px; border-radius:5px; background: #f0f0f0; opacity:0.9;">
                    <p style="font-size:0.9em; color:#555;">[PASSENGER ACTIVITY]</p>
                    <p><strong>Action:</strong> ${passenger.full_name} (${passenger.phone || passenger.email})</p>
                    <p><strong>Ride:</strong> ${ride.pickup} to ${ride.destination}</p>
                    <p><strong>Status:</strong> <span style="color:${statusColor}; font-weight:bold;">${statusLabel}</span></p>
                </div>`;
          }
        });
      }

      container.innerHTML = html;
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Error loading data.</p>";
  }
}

// ===== Helper: Switch Role =====
function switchRole(newRole) {
  const token = localStorage.getItem("gaariyaari_token");

  showConfirm(`Are you sure you want to switch to ${newRole}?`, async () => {
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("gaariyaari_user", JSON.stringify(data));
        localStorage.setItem("gaariyaari_token", data.token);
        showToast(`Role switched to ${newRole}`, "success");
        setTimeout(() => location.reload(), 1000);
      } else {
        showToast(data.message || "Failed to switch role", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error switching role", "error");
    }
  });
}

// ===== Helper: Update Booking Status (Driver) =====
function updateBookingStatus(bookingId, status) {
  const token = localStorage.getItem("gaariyaari_token");

  showConfirm(`Are you sure you want to ${status} this request?`, async () => {
    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        showToast(`Booking ${status}`, "success");
        loadProfile(); // Refresh list
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to update status", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating status", "error");
    }
  });
}

// ===== Helper: Delete Ride (Driver) =====
function deleteRide(rideId) {
  const token = localStorage.getItem("gaariyaari_token");

  showConfirm("Are you sure you want to delete this ride? This will cancel all bookings.", async () => {
    try {
      const res = await fetch(`${API_URL}/rides/${rideId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        showToast("Ride deleted", "info");
        loadProfile();
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to delete ride", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error deleting ride", "error");
    }
  });
}

// ===== Helper: Complete Ride (Driver) =====
function completeRide(rideId) {
  const token = localStorage.getItem("gaariyaari_token");

  showConfirm("Mark this ride as completed?", async () => {
    try {
      const res = await fetch(`${API_URL}/rides/${rideId}/complete`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        showToast("Ride completed!", "success");
        loadProfile();
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to complete ride", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error completing ride", "error");
    }
  });
}

// ===== Helper: Complete Booking (Passenger) =====
function completeBooking(bookingId) {
  const token = localStorage.getItem("gaariyaari_token");

  showConfirm("Mark this ride as completed?", async () => {
    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/complete`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        showToast("Ride completed!", "success");
        loadProfile();
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to complete booking", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error completing booking", "error");
    }
  });
}

// ===== Make Global for HTML onclick attributes =====
window.logout = logout;
window.switchRole = switchRole;
window.cancelBooking = cancelBooking;
window.updateBookingStatus = updateBookingStatus;
window.searchRides = searchRides;
window.bookRide = bookRide;
window.deleteRide = deleteRide;
window.completeRide = completeRide;
window.completeBooking = completeBooking;
