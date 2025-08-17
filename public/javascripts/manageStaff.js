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
