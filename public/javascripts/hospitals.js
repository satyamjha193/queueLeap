// Declare only if not already defined
const socket = window.socket || io();
window.socket = socket; // prevent re-declaration if loaded again



document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('hospitalSearch');
  const hospitalList = document.querySelector('#hospitalList'); // ✅ fixed selector

  if (!input || !hospitalList) {
    console.error('⛔ Missing #hospitalSearch or #hospitalList in DOM');
    return;
  }

  const formatWaitTime = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs} hr${mins > 0 ? ` ${mins} min` : ''}` : `${mins} min`;
  };

  const getFillColor = (percent) => {
    if (percent > 80) return 'linear-gradient(to right, #f87171, #f43f5e)';
    if (percent > 50) return 'linear-gradient(to right, #facc15, #fbbf24)';
    return 'linear-gradient(to right, #4ade80, #22c55e)';
  };

  const getQueueClass = (tokenCount) => {
    if (tokenCount > 20) return 'busy';
    if (tokenCount > 10) return 'moderate';
    return 'light';
  };

  const createHospitalCard = (hospital) => {
    const tokenCount = hospital.tokenCount || 0;
    const percent = Math.min((tokenCount / 40) * 100, 100);
    const fillColor = getFillColor(percent);
    const estimatedWait = formatWaitTime(hospital.estimatedWaitTime || 0);
    const queueClass = getQueueClass(tokenCount);

    return `
      <div class="hospital-card ${queueClass}" data-id="${hospital._id}">
        <div style="position: relative;">
          <img src="${hospital.shopImage || '/images/pexels-cottonbro-7578803.jpg'}" />
        </div>
        <div class="hospital-info">
          <h3>${hospital.shopname}</h3>
          <p class="location">📍 ${hospital.shopaddress}</p>
          <p class="rating">⭐ ${hospital.rating || '4.0'} (${hospital.reviews || '100+'} reviews)</p>

          <div class="queue-info ${queueClass}">
            <span class="count">${tokenCount} in Queue</span>
            <span class="time">~${estimatedWait}</span>
          </div>

          <div class="wait-bar">
            <div class="fill" style="width: ${percent}%; background: ${fillColor};"></div>
          </div>

          <p><strong>Admin:</strong> ${hospital.adminId?.name || 'Not Available'}</p>
          <p class="specialties"><strong>Specialties:</strong> ${hospital.specialties || 'General Physician'}</p>
          <p class="contact">📞 ${hospital.phone || '+91 XXXXX XXXXX'}</p>
          <a href="/hospital/${hospital._id}" class="btn">View Details</a>
        </div>
      </div>
    `;
  };

  const rebindQueueUpdates = () => {
    socket.off('hospitalCardUpdate');

    socket.on('hospitalCardUpdate', ({ hospitalId, tokenCount, estimatedWaitTime, fillPercent }) => {
      const card = document.querySelector(`.hospital-card[data-id="${hospitalId}"]`);
      if (!card) return;

      const queueSpan = card.querySelector('.queue-info .count');
      const timeSpan = card.querySelector('.queue-info .time');
      const queueInfo = card.querySelector('.queue-info');
      const fillBar = card.querySelector('.wait-bar .fill');

      const formatted = formatWaitTime(estimatedWaitTime);
      const queueClass = getQueueClass(tokenCount);
      const fillColor = getFillColor(fillPercent);

      if (queueSpan) queueSpan.textContent = `${tokenCount} in Queue`;
      if (timeSpan) timeSpan.textContent = `~${formatted}`;
      if (fillBar) {
        fillBar.style.width = `${fillPercent}%`;
        fillBar.style.background = fillColor;
      }

      if (queueInfo) {
        queueInfo.classList.remove('light', 'moderate', 'busy');
        queueInfo.classList.add(queueClass);
      }

      card.classList.remove('light', 'moderate', 'busy');
      card.classList.add(queueClass);
    });
  };

  socket.on("updateProgress", ({ hospitalId, newPercent }) => {
    const bar = document.getElementById(`progress-bar-${hospitalId}`);
    if (bar) {
      bar.style.width = `${newPercent}%`;
      bar.innerHTML = `<span>${newPercent}%</span>`;
    }
  });

  const fetchHospitals = async () => {
    const query = input.value.trim();
    try {
      const res = await fetch(`/search-hospitals?q=${encodeURIComponent(query)}`);
      const { hospitals } = await res.json();

      if (Array.isArray(hospitals) && hospitals.length > 0) {
        hospitalList.innerHTML = hospitals.map(createHospitalCard).join('');
        rebindQueueUpdates();
      } else {
        hospitalList.innerHTML = '<p>No hospitals found</p>';
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      hospitalList.innerHTML = '<p>Failed to load hospitals</p>';
    }
  };

  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  rebindQueueUpdates();  // ✅ Attach WebSocket on page load
  input.addEventListener('input', debounce(fetchHospitals, 400));
  fetchHospitals(); // 🔄 Load full list on initial load
});




document.addEventListener("DOMContentLoaded", () => {
  const findBtn = document.getElementById("findNearYou");
  const staticList = document.getElementById("hospitalCards");
  const nearbyContainer = document.getElementById("nearbyHospitalCards");
  const nearbyList = document.getElementById("nearbyHospitalList");
  let isNearbyView = false;

  if (findBtn && staticList && nearbyContainer && nearbyList) {
    findBtn.addEventListener("click", () => {
      if (!isNearbyView) {
        nearbyList.innerHTML = `<p style="padding: 1rem;">⏳ Locating nearby services...</p>`;

        navigator.geolocation.getCurrentPosition(
          async ({ coords }) => {
            try {
              const res = await fetch(`/api/nearby-hospitals?lat=${coords.latitude}&lng=${coords.longitude}`);
              const hospitals = await res.json();

              if (!hospitals.length) {
                nearbyList.innerHTML = `
                  <div class="no-results-wrapper">
                    <div class="no-results-message">
                      <p class="main-text">🚫 No clinics or hospitals found within 5 km of your location.</p>
                      <p class="sub-text">Try changing your location or check again later.</p>
                    </div>
                  </div>`;
              } else {
                nearbyList.innerHTML = "";
                hospitals.forEach(hospital => {
                  const queueClass = getQueueClass(hospital.tokenCount);
                  const fillPercent = hospital.fillPercent || 0;
                  const fillColor = getFillColor(fillPercent);

                  const card = document.createElement("div");
                  card.className = "hospital-card";
                  card.innerHTML = `
                    <div style="position: relative;">
                      <img src="${hospital.shopImage || '/images/pexels-cottonbro-7578803.jpg'}" alt="Hospital Image" />
                      <div class="shop-status ${hospital.isOpen ? 'open' : 'closed'}" 
                           id="status-${hospital._id}"
                           style="position:absolute;top:10px;right:10px;padding:4px 10px;border-radius:12px;
                                  font-size:0.9rem;font-weight:bold;
                                  background-color:${hospital.isOpen ? '#d1fae5' : '#fee2e2'};
                                  color:${hospital.isOpen ? '#065f46' : '#991b1b'};">
                        <i class="fas fa-circle" style="font-size: 0.6rem; margin-right: 6px;"></i>
                        ${hospital.isOpen ? 'Open' : 'Closed'}
                      </div>
                    </div>

                    <div class="hospital-info">
                      <h3>${hospital.shopname}</h3>
                      <p class="location">📍 ${hospital.shopaddress}</p>
                      <p class="rating">⭐ ${hospital.rating || '4.0'} (${hospital.reviews || '100+'} reviews)</p>

                      <div class="queue-info ${queueClass}">
                        <span class="count">${hospital.tokenCount} in Queue</span>
                        <span class="time">~${hospital.formattedWait}</span>
                      </div>

                      <div class="wait-bar">
                        <div class="fill" style="width: ${fillPercent}%; background: ${fillColor};"></div>
                      </div>

                      <p><strong>Admin:</strong> ${hospital.adminId?.name || 'Not Available'}</p>
                      <p class="specialties"><strong>Specialties:</strong> ${hospital.specialties || 'General Physician'}</p>
                      <p class="contact">📞 ${hospital.phone || '+91 XXXXX XXXXX'}</p>
                      <p class="distance">📍 <strong>${hospital.distance} km</strong> from your location</p>
                      <a href="/hospital/${hospital._id}" class="btn">View Details</a>
                    </div>`;
                  nearbyList.appendChild(card);
                });
              }

              staticList.style.display = "none";
              nearbyContainer.style.display = "flex";
              isNearbyView = true;
              findBtn.innerHTML = "⬅ Go Back to All Hospitals";

            } catch (err) {
              console.error("❌ Error fetching nearby hospitals:", err);
              nearbyList.innerHTML = `<p>⚠️ Unable to load nearby hospitals.</p>`;
            }
          },
          (error) => {
            alert("❗ Please allow location access to use this feature.");
            console.warn("Location error:", error);
          }
        );
      } else {
        nearbyContainer.style.display = "none";
        staticList.style.display = "flex";
        isNearbyView = false;
        findBtn.innerHTML = `<i class="fas fa-map-marker-alt"></i> Find Clinic, Hospitals and Diagnosis Center Near You`;
      }
    });
  }
});








// ✅ Real-time Shop Open/Closed Badge Updates

socket.on('shopStatusUpdate', ({ shopId, isOpen }) => {
  const statusElem = document.getElementById(`status-${shopId}`);
  if (!statusElem) return;

  statusElem.innerHTML = `
    <i class="fas fa-circle" style="font-size: 0.6rem; margin-right: 6px;"></i>
    ${isOpen ? 'Open' : 'Closed'}
  `;
  statusElem.style.backgroundColor = isOpen ? '#d1fae5' : '#fee2e2';
  statusElem.style.color = isOpen ? '#065f46' : '#991b1b';
  statusElem.classList.remove('open', 'closed');
  statusElem.classList.add(isOpen ? 'open' : 'closed');
});
