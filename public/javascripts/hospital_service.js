document.addEventListener('DOMContentLoaded', () => {
 
 const params = new URLSearchParams(window.location.search);
if (params.get('success') === 'true') {
  const token = params.get('token');
  const qrImage = decodeURIComponent(params.get('qr'));

  Swal.fire({
    icon: 'success',
    title: 'Token Booked!',
    html: `
      <p>Your token number is <b>#${token}</b>.</p>
      <p>Please check your SMS for the QR code.</p>
      <img src="${qrImage}" alt="QR Code" style="margin: 10px auto; max-width: 200px; display: block;" />
    `,
    showConfirmButton: true,
    confirmButtonText: 'OK',
    confirmButtonColor: '#2563eb',
    didRender: () => {
      // Create a custom download button
      const downloadBtn = document.createElement('button');
      downloadBtn.innerText = '⬇ Download QR';
      downloadBtn.style.backgroundColor = '#10b981'; // green
      downloadBtn.style.color = 'white';
      downloadBtn.style.padding = '8px 16px';
      downloadBtn.style.border = 'none';
      downloadBtn.style.borderRadius = '4px';
      downloadBtn.style.marginRight = '10px';
      downloadBtn.style.cursor = 'pointer';

      downloadBtn.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = qrImage;
        a.download = 'token_qr.png';
        a.click();
      });

      // Insert before OK button
      const swalActions = Swal.getActions();
      swalActions.prepend(downloadBtn);
    }
  }).then(() => {
    window.history.replaceState({}, document.title, window.location.pathname);
  });
}

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
  const qrImg = document.getElementById('qrImage');
  const downloadLink = document.getElementById('downloadQR');
  if (qrImg && downloadLink) {
    downloadLink.href = qrImg.src;
  }

  // Geolocation Distance Calculation
  const hospitalDiv = document.getElementById('distance');
  if (hospitalDiv) {
    const hospitalLat = parseFloat(hospitalDiv.dataset.lat);
    const hospitalLng = parseFloat(hospitalDiv.dataset.lng);

    const haversineDistance = (lat1, lon1, lat2, lon2) => {
      const toRad = angle => (angle * Math.PI) / 180;
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const dist = haversineDistance(
            position.coords.latitude,
            position.coords.longitude,
            hospitalLat,
            hospitalLng
          );
          document.getElementById('distanceValue').textContent = dist.toFixed(2) + ' km';
        },
        err => {
          document.getElementById('distanceValue').textContent = "Location not available";
        }
      );
    } else {
      document.getElementById('distanceValue').textContent = "Geolocation not supported";
    }
  }

  // WebSocket Real-time
  const socket = io();
  const adminRoomId = window.adminRoomId || '';
  if (adminRoomId) socket.emit('joinAdminRoom', adminRoomId);

  const liveUpdates = document.getElementById('liveUpdates');
  socket.on('tokenUpdate', (data) => {
    const div = document.createElement('div');
    div.className = `token-update update-${data.type}`;
    const icon = data.type === 'now' ? 'fa-bell' : data.type === 'completed' ? 'fa-check' : 'fa-plus-circle';
    div.innerHTML = `<i class="fas ${icon}"></i> ${data.message}`;
    liveUpdates.prepend(div);
  });

  // socket.on('queueStatsUpdate', (data) => {
  //   const waitTime = data.estimatedWait >= 60
  //     ? `${Math.floor(data.estimatedWait / 60)} hr ${data.estimatedWait % 60} min`
  //     : `${data.estimatedWait} min`;

  //   const waitElem = document.getElementById('waitTime');
  //   const queueElem = document.getElementById('queuePos');
  //   if (waitElem) waitElem.textContent = `~${waitTime}`;
  //   if (queueElem) queueElem.textContent = `#${data.peopleInQueue}`;
  // });



  socket.on('queueUpdate', (data) => {
  const currentHospitalId = window.location.pathname.split('/')[2];

  if (data.hospitalId === currentHospitalId) {
    const waitElem = document.querySelector('.status-value#waitTime');
    const queueElem = document.querySelector('.status-value#queuePos');

    if (waitElem) waitElem.textContent = `~${data.estimatedWaitTime} min`;
    if (queueElem) queueElem.textContent = `${data.tokenCount}`;
  }
});









});

function closeTokenModal() {
  const modal = document.getElementById("tokenSuccessModal");
  if (modal) modal.style.display = "none";
      window.location.href = `/hospital/${hospitalId}`;

}



// Gsap animation on load event 
  gsap.registerPlugin(ScrollTrigger);

  // Animate Token Status Section
  gsap.from(".status > div", {
    scrollTrigger: {
      trigger: ".status",
      start: "top 80%",
    },
    y: 50,
    opacity: 0,
    duration: 0.6,
    stagger: 0.2,
    ease: "power2.out"
  });

  // Animate Hospital Info Card
  gsap.from(".hospital-info", {
    scrollTrigger: {
      trigger: ".hospital-info",
      start: "top 85%",
    },
    x: -50,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out"
  });

  // Animate Tags
  gsap.from(".tag", {
    scrollTrigger: {
      trigger: ".tags",
      start: "top 90%",
    },
    scale: 0.5,
    opacity: 0,
    stagger: 0.1,
    duration: 0.5,
    ease: "back.out(1.7)"
  });

  // Animate Live Updates
  gsap.from(".token-update", {
    scrollTrigger: {
      trigger: "#liveUpdates",
      start: "top 85%",
      toggleActions: "play none none reverse",
    },
    y: 20,
    opacity: 0,
    stagger: 0.15,
    duration: 0.6,
    ease: "power2.out"
  });

  // Animate Book Token Form
  gsap.from(".form-box", {
    scrollTrigger: {
      trigger: ".form-book-section",
      start: "top 85%",
    },
    y: 40,
    opacity: 0,
    stagger: 0.3,
    duration: 0.7,
    ease: "power2.out"
  });

  // Animate Map Section
  gsap.from(".map-section", {
    scrollTrigger: {
      trigger: ".map-section",
      start: "top 90%",
    },
    y: 50,
    opacity: 0,
    duration: 0.8,
    ease: "power2.out"
  });

  // Optional: Modal zoom-in on load (if visible)
 window.addEventListener("load", () => {
  const updates = document.querySelectorAll(".token-update");
  updates.forEach((el, i) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      delay: i * 0.15,
      duration: 0.4,
      ease: "power1.out"
    });
  });
});
