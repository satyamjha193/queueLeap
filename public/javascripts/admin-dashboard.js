// ==============================
// 📡 Initialize Socket.IO

const socket = io();
const adminId = document.body.dataset.adminId;

if (adminId && adminId.trim() !== "") {
  // console.log("✅ Joining admin room:", adminId);
  socket.emit("joinAdminRoom", adminId);
} else {
  console.error("❌ Admin ID missing in <body data-admin-id>");
}

// ==============================
// 📊 Live Summary Card Stats
// ==============================
socket.on("queueStatsUpdate", ({ estimatedWait, peopleInQueue, tokensServed }) => {
  const currentTokenEl = document.getElementById("currentToken");
  const servedEl = document.getElementById("tokensServed");
  const queueEl = document.getElementById("usersInQueue");

  if (queueEl) queueEl.textContent = peopleInQueue ?? "--";
  if (servedEl && typeof tokensServed === "number") servedEl.textContent = tokensServed;

  if (currentTokenEl) {
    currentTokenEl.textContent = peopleInQueue > 0 ? tokensServed + 1 : "None";
  }
});

// ==============================
// 🎯 Token Events: Now / Completed
// ==============================
socket.on("tokenUpdate", ({ type, message }) => {
  const currentTokenEl = document.getElementById("currentToken");
  const servedEl = document.getElementById("tokensServed");
  const queueNameEl = document.querySelector(".queue-name");
  const tokenNum = message.match(/\d+/)?.[0];

  if (type === "now" && currentTokenEl && tokenNum) {
    currentTokenEl.textContent = tokenNum;

    const firstCard = document.querySelector(".scroll-box .card");
    if (firstCard) {
      const name = firstCard.querySelector(".name")?.childNodes[0]?.textContent?.trim() || "User";
      if (queueNameEl) {
        queueNameEl.innerHTML = `${name} <span class="status">Now Serving</span>`;
        queueNameEl.classList.remove("fade-out");
      }
    }
  }

  if (type === "completed" && servedEl && tokenNum) {
    servedEl.textContent = tokenNum;

    if (queueNameEl) {
      const nameOnly = queueNameEl.textContent.split(" ")[0];
      queueNameEl.innerHTML = `${nameOnly} <span class="status served">Served</span>`;
      queueNameEl.classList.remove("fade-out");

      setTimeout(() => {
        queueNameEl.classList.add("fade-out");
      }, 3500);
    }
  }
});

// ==============================
// ⏭️ Current Waiting Token Update
// ==============================
socket.on("currentWaitingTokenUpdate", async ({ tokenId }) => {
  const container = document.getElementById("nextTokenContainer");
  const queueNameDiv = document.querySelector(".queue-name");

  if (tokenId) {
    container.innerHTML = `
      <form id="nextTokenForm" action="/admin/serve/${tokenId}" method="POST">
        <button type="submit" class="next-btn" data-aos="zoom-in" data-aos-delay="100">
          <i class="fas fa-forward"></i> Next Token
        </button>
      </form>
    `;

    try {
      const res = await fetch(`/api/token/${tokenId}`);
      const token = await res.json();

      if (token && token.fullName && queueNameDiv) {
        queueNameDiv.innerHTML = `${token.fullName} <span class="status">Now Serving</span>`;
      }
    } catch (err) {
      console.error("Failed to load token full name:", err);
    }
  } else {
    container.innerHTML = `
      <button class="next-btn disabled" disabled style="background: #ccc; cursor: not-allowed;" data-aos="zoom-in" data-aos-delay="100">
        <i class="fas fa-ban"></i> No Token to Serve
      </button>
    `;
    if (queueNameDiv) queueNameDiv.innerHTML = "No user is currently being served";
  }
});


// 📊 Chart.js Token Bar Chart
// ==============================

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("queueChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const labels = JSON.parse(document.getElementById("chart-labels").textContent);
  const bookedData = JSON.parse(document.getElementById("chart-booked").textContent);
  const servedData = JSON.parse(document.getElementById("chart-served").textContent);

  const queueChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Tokens Booked',
          data: bookedData,
          backgroundColor: 'rgba(34,197,94,0.7)',
          borderRadius: 6
        },
        {
          label: 'Tokens Served',
          data: servedData,
          backgroundColor: 'rgba(59,130,246,0.7)',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.raw} tokens`
          }
        },
        legend: { display: true }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      },
      animation: {
        duration: 1200,
        easing: 'easeOutQuart'
      }
    }
  });

  const currentAdminId = document.body.dataset.adminId;
  const socket = io();

  // 🧠 Join admin room
  if (currentAdminId) {
    socket.emit("joinAdminRoom", currentAdminId);
  }

  // 🔁 Real-time Chart Update
  socket.on("queueChartStatusUpdate", ({ adminId: incomingId, tokensServed, peopleInQueue }) => {
    if (incomingId !== currentAdminId) return;

    const today = new Date().toLocaleDateString("en-IN", { weekday: "short" });
    const todayIndex = queueChart.data.labels.findIndex(label => label === today);
    if (todayIndex === -1) return;

    queueChart.data.datasets[0].data[todayIndex] = peopleInQueue;
    queueChart.data.datasets[1].data[todayIndex] = tokensServed;
    queueChart.update();
  });

  // 👇 Optional: Legacy support
  socket.on("queueStatsUpdate", ({ tokensServed, peopleInQueue }) => {
    queueChart.data.datasets[0].data[6] = peopleInQueue;
    queueChart.data.datasets[1].data[6] = tokensServed;
    queueChart.update();
  });
});



















// ==============================
socket.on("queueUpdate", (tokens) => {
  const scrollBox = document.querySelector(".scroll-box");
  if (!scrollBox) return;

  const queueHeader = document.querySelector(".queue-header span");
  if (queueHeader) {
    queueHeader.innerText = `${tokens.length} Users in Queue`;
  }

  scrollBox.innerHTML = "";

  tokens.forEach((token, idx) => {
    const card = document.createElement("div");
    card.className = "card" + (idx === 0 ? " active" : "");

    let statusLabel = "";
    if (token.status === "completed") {
      statusLabel = `<span class="status served">Served</span>`;
    } else if (idx === 0) {
      statusLabel = `<span class="status now">Now Serving</span>`;
    } else {
      statusLabel = `<span class="status waiting">Waiting</span>`;
    }

    card.innerHTML = `
      <div class="user-info">
        <div class="avatar ${token.status === 'completed' ? 'red' : (idx === 0 ? 'green' : 'yellow')}">
          ${token.fullName?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div class="details">
          <div class="name">
            ${token.fullName || 'User'} ${statusLabel}
          </div>
          <div class="info"><i class="fas fa-phone-alt"></i> ${token.phoneNumber}</div>
          <div class="info"><i class="far fa-clock"></i> Booked at ${new Date(token.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
      <div class="trash" onclick="deleteToken('${token._id}')"><i class="fas fa-trash-alt"></i></div>
    `;

    scrollBox.appendChild(card);
  });

  scrollBox.scrollTop = scrollBox.scrollHeight;
});


// ==============================
// 🆙 Animate Items on Load
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('.animate-up').forEach((el, index) => {
    setTimeout(() => {
      el.classList.add('animate-visible');
    }, index * 150);
  });
});

// ==============================
// 📦 Sidebar Drawer Toggle
// ==============================
function toggleDrawer() {
  document.getElementById('sidebar')?.classList.toggle('hide');
  document.getElementById('main-container')?.classList.toggle('full');
}

// ==============================
// 🔄 AOS (Animate On Scroll)
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      once: true,
      offset: 120
    });
  }
});

// ==============================
// 👤 Profile Settings Redirect
// ==============================
document.getElementById("profile_setting_page")?.addEventListener("click", () => {
  window.location.href = "/admin_dashboard/profile_settings";
});

// ==============================
// 🚪 Logout Modal Handling
// ==============================
const logoutBtn = document.getElementById("logoutBtn");
const logoutPopup = document.getElementById("logoutPopup");
const confirmLogout = document.getElementById("confirmLogout");
const cancelLogout = document.getElementById("cancelLogout");

logoutBtn?.addEventListener("click", () => logoutPopup.style.display = "flex");
cancelLogout?.addEventListener("click", () => logoutPopup.style.display = "none");
confirmLogout?.addEventListener("click", () => {
  window.location.href = "/admin/logout";
});

// ==============================
// 📱 Toggle Menu Buttons
// ==============================
function toggleDropdownMenu() {
  document.querySelector('.menu-buttons')?.classList.toggle('show');
}

// ==============================
// 🧠 Refresh on Back Navigation
// ==============================
window.addEventListener("pageshow", function (event) {
  if (event.persisted || window.performance.navigation.type === 2) {
    window.location.reload();
  }
});






// real time update queue members on the admin dashboard
socket.on("queueUpdate", (data) => {
  const updatedTokens = data.tokens;
  if (!Array.isArray(updatedTokens)) return;

  const queueScroll = document.querySelector(".queue-scroll");
  if (!queueScroll) return;

  queueScroll.innerHTML = "";

  updatedTokens.forEach((token, idx) => {
    const card = document.createElement("div");
    card.className = `queue-card ${idx === 0 ? 'active-card' : ''}`;
    card.setAttribute("data-id", token._id);

    const served = token.status === "served" || token.status === "completed";
    const statusText = served ? "Served" : idx === 0 ? "Now Serving" : "Waiting";
    const statusClass = served ? "served" : idx === 0 ? "now" : "waiting";

    card.innerHTML = `
      <div class="queue-left">
        <div class="queue-circle">#${token.serialNumber}</div>
        <div class="queue-info">
          <div class="queue-name">
            ${token.fullName}
            <span class="status ${statusClass}">${statusText}</span>
          </div>
          <div class="queue-detail"><i class="fas fa-phone-alt"></i> ${token.phoneNumber}</div>
          <div class="queue-detail"><i class="far fa-clock"></i> ${new Date(token.createdAt).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>
      ${!served ? `<div class="queue-trash" onclick="confirmDelete('${token._id}')">
        <i class="fas fa-trash-alt"></i>
      </div>` : ""}
    `;

    queueScroll.appendChild(card);
  });

  const header = document.querySelector(".queue-header span");
  if (header) header.textContent = `${updatedTokens.length} Users in Queue`;
});






// shop close or open status , which can be handled by admin and reflects the changes on the sectors /service pages (cards)

  // document.addEventListener("DOMContentLoaded", () => {
  //   const toggleBtn = document.getElementById("toggleShopBtn");
  //   const shopStatusText = document.getElementById("shopStatusText");
  //   const confirmModal = document.getElementById("confirmModal");
  //   const confirmBtn = document.getElementById("confirmBtn");
  //   const cancelBtn = document.getElementById("cancelBtn");
  //   const spinner = document.getElementById("toggleSpinner");
  //   const modalMessage = document.getElementById("modalMessage");

  //   if (!toggleBtn || !shopStatusText || !confirmModal || !confirmBtn || !cancelBtn || !spinner || !modalMessage) return;

  //   let isCurrentlyOpen = toggleBtn.dataset.isopen === "true";
  //   const shopId = toggleBtn.dataset.shopid;
  //   const shopSector = toggleBtn.dataset.sectorname; // sectorname value

  //   // Show confirmation modal
  //   toggleBtn.addEventListener("click", () => {
  //     const msg = isCurrentlyOpen
  //       ? "Do you want to close the shop?"
  //       : "Do you want to open the shop for bookings?";
  //     modalMessage.innerText = msg;
  //     confirmModal.style.display = "flex";
  //   });

  //   // On confirm
  //   confirmBtn.addEventListener("click", async () => {
  //     const newStatus = !isCurrentlyOpen;
  //     spinner.style.display = "inline-block";

  //     try {
  //       const response = await fetch('/admin/toggle-shop-status', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({
  //           shopId: shopId,
  //           isOpen: newStatus,
  //           sectorname: shopSector  // ✅ Corrected key
  //         })
  //       });

  //       const result = await response.json();
  //       if (!response.ok || !result.success) throw new Error(result.message || "Failed");

  //       toggleBtn.classList.remove("open", "closed");
  //       toggleBtn.classList.add(newStatus ? "open" : "closed");
  //       shopStatusText.innerText = newStatus ? "Open" : "Closed";
  //       toggleBtn.dataset.isopen = newStatus.toString();
       
  //       isCurrentlyOpen = newStatus;
  //       confirmModal.style.display = "none";
  //     } catch (err) {
  //       alert("❌ Error updating shop status.");
  //       console.error(err);
  //     } finally {
  //       spinner.style.display = "none";
  //     }
  //   });
    


  //   // Cancel modal
  //   cancelBtn.addEventListener("click", () => {
  //     confirmModal.style.display = "none";
  //   });

  //   // WebSocket real-time sync
  //   socket.on("shopStatusUpdate", ({ shopId: incomingId, isOpen }) => {
  //     if (incomingId !== shopId) return;

  //     toggleBtn.classList.remove("open", "closed");
  //     toggleBtn.classList.add(isOpen ? "open" : "closed");
  //     shopStatusText.innerText = isOpen ? "Open" : "Closed";
  //     toggleBtn.dataset.isopen = isOpen.toString();
  //     isCurrentlyOpen = isOpen;
  //   });
  // });









document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggleShopBtn");
  const shopStatusText = document.getElementById("shopStatusText");
  const confirmModal = document.getElementById("confirmModal");
  const confirmBtn = document.getElementById("confirmBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const spinner = document.getElementById("toggleSpinner");
  const modalMessage = document.getElementById("modalMessage");

  if (
    !toggleBtn || !shopStatusText || !confirmModal ||
    !confirmBtn || !cancelBtn || !spinner || !modalMessage
  ) return;

  let isCurrentlyOpen = toggleBtn.dataset.isopen === "true";
  const shopId = toggleBtn.dataset.shopid;
  const shopSector = toggleBtn.dataset.sectorname;

  // 🔔 Ask permission once on load
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission().then(permission => {
      console.log("Notification permission:", permission);
    });
  }

  // 🛎️ Show browser notification
  function showShopStatusNotification(isOpen) {
    if ("Notification" in window && Notification.permission === "granted") {
      const notification = new Notification("🏪 QueueLeap", {
        body: isOpen ? "Shop is now OPEN for bookings!" : "Shop has been CLOSED.",
        icon: "/images/shop-icon.png" // Optional — add your icon here
      });

      notification.onclick = () => {
        window.focus();
      };
    }
  }

  // 🌐 WebSocket live listener
  socket.on("shopStatusUpdate", ({ shopId: incomingId, isOpen }) => {
    if (incomingId !== shopId) return;

    toggleBtn.classList.remove("open", "closed");
    toggleBtn.classList.add(isOpen ? "open" : "closed");
    shopStatusText.innerText = isOpen ? "Open" : "Closed";
    toggleBtn.dataset.isopen = isOpen.toString();
    isCurrentlyOpen = isOpen;

    showShopStatusNotification(isOpen);
  });

  // 🔘 Toggle button clicked
  toggleBtn.addEventListener("click", () => {
    modalMessage.innerText = isCurrentlyOpen
      ? "Do you want to close the shop?"
      : "Do you want to open the shop for bookings?";
    confirmModal.style.display = "flex";
  });

  // ✅ Confirm toggle request
  confirmBtn.addEventListener("click", async () => {
    const newStatus = !isCurrentlyOpen;
    spinner.style.display = "inline-block";

    try {
      const response = await fetch("/admin/toggle-shop-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shopId,
          isOpen: newStatus,
          sectorname: shopSector
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Failed");

      toggleBtn.classList.remove("open", "closed");
      toggleBtn.classList.add(newStatus ? "open" : "closed");
      shopStatusText.innerText = newStatus ? "Open" : "Closed";
      toggleBtn.dataset.isopen = newStatus.toString();
      isCurrentlyOpen = newStatus;
      confirmModal.style.display = "none";

      // Show notification manually too
      showShopStatusNotification(newStatus);

    } catch (err) {
      alert("❌ Error updating shop status.");
      console.error(err);
    } finally {
      spinner.style.display = "none";
    }
  });

  // ❌ Cancel modal
  cancelBtn.addEventListener("click", () => {
    confirmModal.style.display = "none";
  });
});

