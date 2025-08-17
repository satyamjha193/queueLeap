  
    const toggle = document.getElementById("billingToggle");
    const cards = document.querySelectorAll(".plan-card");

    function updatePricing() {
      const yearly = toggle.checked;
      cards.forEach(card => {
        const price = yearly ? card.dataset.yearly : card.dataset.monthly;
        const priceElement = card.querySelector(".plan-price");
        priceElement.innerHTML = `₹${price} <span>/mo</span>`;
      });
    }

    toggle.addEventListener("change", updatePricing);
  

  const filterBtns = document.querySelectorAll('.plan-filter-btn');
  const planSets = document.querySelectorAll('.plan-set');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.dataset.filter;
      planSets.forEach(set => {
        set.style.display = set.dataset.type === type ? 'grid' : 'none';
      });
    });
  });