// ✅ Declare only if not already defined
const socket = window.socket || io();
window.socket = socket;


document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('salonSearch');
  const salonList = document.querySelector('#salonList');

  if (!input || !salonList) {
    console.error('⛔ Missing #salonSearch or #salonList in DOM');
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

  const createSalonCard = (salon) => {
    const tokenCount = salon.tokenCount || 0;
    const percent = Math.min((tokenCount / 40) * 100, 100);
    const fillColor = getFillColor(percent);
    const estimatedWait = formatWaitTime(salon.estimatedWaitTime || 0);
    const queueClass = getQueueClass(tokenCount);

    return `
      <div class="hospital-card ${queueClass}" data-id="${salon._id}">
        <div style="position: relative;">
          <img src="${salon.shopImage || '/images/salon-default.jpg'}" alt="Salon Image" />
        </div>
        <div class="hospital-info">
          <h3>${salon.shopname}</h3>
          <p class="location">📍 ${salon.shopaddress}</p>
          <p class="rating">⭐ ${salon.rating || '4.3'} (${salon.reviews || '50+'} reviews)</p>

          <div class="queue-info ${queueClass}">
            <span class="count">${tokenCount} in Queue</span>
            <span class="time">~${estimatedWait}</span>
          </div>

          <div class="wait-bar">
            <div class="fill" style="width: ${percent}%; background: ${fillColor};"></div>
          </div>

          <p><strong>Admin:</strong> ${salon.adminId?.name || 'Not Available'}</p>
          <p class="specialties"><strong>Specialists:</strong> ${salon.specialist || 'Hair & Beauty'}</p>
          <p class="contact">📞 ${salon.phone || '+91 XXXXX XXXXX'}</p>
          <a href="/salon/${salon._id}" class="btn">View Details</a>
        </div>
      </div>
    `;
  };

  const rebindQueueUpdates = () => {
    socket.off('salonCardUpdate');

    socket.on('salonCardUpdate', ({ salonId, tokenCount, estimatedWaitTime, fillPercent }) => {
      const card = document.querySelector(`.hospital-card[data-id="${salonId}"]`);
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

  const fetchSalons = async () => {
    const query = input.value.trim();
    try {
      const res = await fetch(`/search-salons?q=${encodeURIComponent(query)}`);
      const { salons } = await res.json();

      if (Array.isArray(salons) && salons.length > 0) {
        salonList.innerHTML = salons.map(createSalonCard).join('');
        rebindQueueUpdates();
      } else {
        salonList.innerHTML = '<p>No salons found</p>';
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      salonList.innerHTML = '<p>Failed to load salons</p>';
    }
  };

  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  rebindQueueUpdates();
  input.addEventListener('input', debounce(fetchSalons, 400));
  fetchSalons();
});

// ✅ Real-time Shop Open/Closed Badge Updates for Salon

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







document.addEventListener("DOMContentLoaded", () => {
  const findBtn = document.getElementById("findNearYou");
  const staticList = document.getElementById("salonCards");
  const nearbyContainer = document.getElementById("nearbySalonCards");
  const nearbyList = document.getElementById("nearbySalonList");
  let isNearbyView = false;

  if (findBtn && staticList && nearbyContainer && nearbyList) {
    findBtn.addEventListener("click", () => {
      if (!isNearbyView) {
        nearbyList.innerHTML = `<p style="padding: 1rem;">⏳ Locating nearby salons...</p>`;

        navigator.geolocation.getCurrentPosition(
          async ({ coords }) => {
            try {
              const res = await fetch(`/api/nearby-salons?lat=${coords.latitude}&lng=${coords.longitude}`);
              const salons = await res.json();

              if (!salons.length) {
                nearbyList.innerHTML = `
                  <div class="no-results-wrapper">
                    <div class="no-results-message">
                      <p class="main-text">🚫 No salons or beauty centers found within 5 km of your location.</p>
                      <p class="sub-text">Try changing your location or check again later.</p>
                    </div>
                  </div>`;
              } else {
                nearbyList.innerHTML = "";
                salons.forEach(salon => {
                  const queueClass = getQueueClass(salon.tokenCount);
                  const fillPercent = salon.fillPercent || 0;
                  const fillColor = getFillColor(fillPercent);

                  const card = document.createElement("div");
                  card.className = "salon-card";
                  card.innerHTML = `
                    <div style="position: relative;">
                      <img src="${salon.shopImage || '/images/pexels-cottonbro-3997385.jpg'}" alt="Salon Image" />
                      <div class="shop-status ${salon.isOpen ? 'open' : 'closed'}" 
                           id="status-${salon._id}"
                           style="position:absolute;top:10px;right:10px;padding:4px 10px;border-radius:12px;
                                  font-size:0.9rem;font-weight:bold;
                                  background-color:${salon.isOpen ? '#d1fae5' : '#fee2e2'};
                                  color:${salon.isOpen ? '#065f46' : '#991b1b'};">
                        <i class="fas fa-circle" style="font-size: 0.6rem; margin-right: 6px;"></i>
                        ${salon.isOpen ? 'Open' : 'Closed'}
                      </div>
                    </div>

                    <div class="salon-info">
                      <h3>${salon.shopname}</h3>
                      <p class="location">📍 ${salon.shopaddress}</p>
                      <p class="rating">⭐ ${salon.rating || '4.0'} (${salon.reviews || '100+'} reviews)</p>

                      <div class="queue-info ${queueClass}">
                        <span class="count">${salon.tokenCount} in Queue</span>
                        <span class="time">~${salon.formattedWait}</span>
                      </div>

                      <div class="wait-bar">
                        <div class="fill" style="width: ${fillPercent}%; background: ${fillColor};"></div>
                      </div>

                      <p><strong>Admin:</strong> ${salon.adminId?.name || 'Not Available'}</p>
                      <p class="specialties"><strong>Services:</strong> ${salon.specialties || 'Hair, Skin, Spa'}</p>
                      <p class="contact">📞 ${salon.phone || '+91 XXXXX XXXXX'}</p>
                      <p class="distance">📍 <strong>${salon.distance} km</strong> from your location</p>
                      <a href="/salon/${salon._id}" class="btn">View Details</a>
                    </div>`;
                  nearbyList.appendChild(card);
                });
              }

              staticList.style.display = "none";
              nearbyContainer.style.display = "flex";
              isNearbyView = true;
              findBtn.innerHTML = "⬅ Go Back to All Salons";

            } catch (err) {
              console.error("❌ Error fetching nearby salons:", err);
              nearbyList.innerHTML = `<p>⚠️ Unable to load nearby salons.</p>`;
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
        findBtn.innerHTML = `<i class="fas fa-map-marker-alt"></i> Find Salons and Beauty Centers Near You`;
      }
    });
  }
});
