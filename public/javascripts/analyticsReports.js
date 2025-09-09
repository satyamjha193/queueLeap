const weeklyChart = new Chart(document.getElementById("weeklyChart"), {
  type: "line",
  data: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [{
      label: "Customers",
      data: [45, 50, 48, 65, 60, 40, 35],
      backgroundColor: "rgba(99, 102, 241, 0.2)",
      borderColor: "#6366f1",
      borderWidth: 2,
      fill: true,
      tension: 0.4
    }]
  },
  options: {
    responsive: true,
    scales: { y: { beginAtZero: true } }
  }
});

const serviceChart = new Chart(document.getElementById("serviceChart"), {
  type: "pie",
  data: {
    labels: ["General Inquiry", "Account Services", "Technical Support", "Complaints", "Other"],
    datasets: [{
      data: [40, 25, 20, 10, 5],
      backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]
    }]
  },
  options: { responsive: true }
});

const hourlyChart = new Chart(document.getElementById("hourlyChart"), {
  type: "bar",
  data: {
    labels: ["9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM"],
    datasets: [{
      label: "Volume",
      data: [12, 19, 25, 30, 24, 20, 15],
      backgroundColor: "#34d399"
    }]
  },
  options: { responsive: true, scales: { y: { beginAtZero: true } } }
});

const trendChart = new Chart(document.getElementById("trendChart"), {
  type: "line",
  data: {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Wait Time (min)",
        data: [10, 9, 8.5, 8.2],
        borderColor: "#6366f1",
        fill: false,
        tension: 0.3
      },
      {
        label: "Satisfaction",
        data: [4.1, 4.2, 4.3, 4.2],
        borderColor: "#f59e0b",
        fill: false,
        tension: 0.3
      }
    ]
  },
  options: { responsive: true, scales: { y: { beginAtZero: false } } }
});



 // Show overlay on any interaction
  let dummyShown = false;
  function showDummyCard() {
    if(dummyShown) return;
    dummyShown = true;
    document.getElementById("dummyOverlay").style.display = "flex";
  }

  // Close overlay
  document.querySelector(".dummyClose").addEventListener("click", () => {
    document.getElementById("dummyOverlay").style.display = "none";
  });

  // Trigger on user interaction
  document.addEventListener("click", showDummyCard);
  document.addEventListener("focusin", showDummyCard);
  document.addEventListener("scroll", showDummyCard);