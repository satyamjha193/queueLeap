document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector(".search-add input");
  const staffRows = document.querySelectorAll(".staff-row:not(.heading)");

  // Live search
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    staffRows.forEach(row => {
      const name = row.querySelector("div").innerText.toLowerCase();
      row.style.display = name.includes(query) ? "grid" : "none";
    });
  });

  // Button click actions
  document.querySelectorAll(".actions button").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.innerText;
      const staffName = btn.closest(".staff-row").querySelector("div").innerText;
      if (action === "⏱") {
        alert(`Manage shift for ${staffName}`);
      } else if (action === "✏️") {
        alert(`Edit details for ${staffName}`);
      } else if (action === "🗑️") {
        const confirmDelete = confirm(`Delete ${staffName}?`);
        if (confirmDelete) {
          btn.closest(".staff-row").remove();
        }
      }
    });
  });

  // Add Staff button
  document.querySelector(".add-btn").addEventListener("click", () => {
    alert("Add Staff functionality coming soon!");
  });
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