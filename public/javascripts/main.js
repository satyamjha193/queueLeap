document.addEventListener("DOMContentLoaded", () => {
  const footerSections = document.querySelectorAll(".footer-section");

  function animateFooter() {
    const triggerPoint = window.innerHeight - 100;

    footerSections.forEach(section => {
      const sectionTop = section.getBoundingClientRect().top;
      if (sectionTop < triggerPoint) {
        section.classList.add("visible");
      }
    });
  }

  window.addEventListener("scroll", animateFooter);
  window.addEventListener("load", animateFooter);
});








// Hospital button navigation--------------->
    const hospitalButton = document.querySelector(".hospital_service_page");
    hospitalButton.addEventListener("click", function () {
        console.log("Hospital button clicked");
        window.location.href = "/hospitals";
    });

// Other buttons navigation (bank, government, general, etc.)
    const buttons = document.querySelectorAll(".buttons");
    buttons.forEach(button => {
      button.addEventListener("click", function () {
        const card = button.closest('.card');
        if (!card) return;
    
    if(card.classList.contains('salon')) {
      window.location.href = "/salon";
    }
      else if(card.classList.contains('college')) {
      window.location.href = "/college";
      
    } else {
      console.log("Unknown service");
    }
  });
});




// Navbar toggle--------------->
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("navbarLinks");

    hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("active");
    });





//JS image Slider-------------->
    const images = document.querySelectorAll('#imageSlider img');
    let current = 0;

// Initialize first image visible (translateX(0))
    images.forEach((img, index) => {
        if (index === 0) {
        img.style.transform = "translateX(0)";
        img.style.zIndex = "1";
        } else {
            img.style.transform = "translateX(100%)";
            img.style.zIndex = "0";
        }
    });

    setInterval(() => {
        let prev = current;
        current = (current + 1) % images.length;

        // Slide previous image to left (-100%)
        images[prev].style.transform = "translateX(-100%)";
        images[prev].style.zIndex = "0";

        // Slide current image in from right (0%)
        images[current].style.transform = "translateX(0)";
        images[current].style.zIndex = "1";

        // After animation ends, reset the prev image position to right (100%) so it can re-enter next time
        setTimeout(() => {
            images[prev].style.transform = "translateX(100%)";
        }, 1000); // match CSS transition duration
    }, 4000); // 3 seconds per slide








 document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(".card");
    cards.forEach((card, index) => {
      card.style.setProperty('--delay', `${index * 0.1}s`);
    });
  });






    // about page (load on scroll)

  window.addEventListener("scroll", () => {
    const fadeItems = document.querySelectorAll(".fade-item");
    const triggerBottom = window.innerHeight - 100;

    fadeItems.forEach((el, i) => {
      const boxTop = el.getBoundingClientRect().top;
      if (boxTop < triggerBottom) {
        setTimeout(() => {
          el.classList.add("visible");
        }, i * 200); // 200ms delay between each paragraph
      }
    });
  });



  // contact page animation
 // contact page animation
window.addEventListener("scroll", () => {
  const contact = document.querySelector(".contact-container");
  if (!contact) return; // 👈 prevents the error

  const triggerBottom = window.innerHeight - 100;
  const boxTop = contact.getBoundingClientRect().top;

  if (boxTop < triggerBottom) {
    contact.classList.add("visible");
  }
});




// why choose our page. animation
   window.addEventListener("load", () => {
    const cards = document.querySelectorAll(".feature-card");
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add("animate");
      }, index * 700); // staggered animation
    });
  });



  // Get a popup after an admin delete thier account(animation)
   setTimeout(() => {
    const msg = document.getElementById("flash-msg");
    if (msg) msg.style.display = "none";
  }, 3000);



// Animation for
    document.addEventListener("DOMContentLoaded", () => {
    const animatedElements = document.querySelectorAll(".animate-up, .animate-left, .animate-right, .animate-zoom");

    const options = {
      threshold: 0.3,
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = 1;
          entry.target.classList.add("animate-visible");
          observer.unobserve(entry.target); // animate only once
        }
      });
    }, options);

    animatedElements.forEach(el => {
      el.style.opacity = 0;
      observer.observe(el);
    });
  });

  
  // why choose our app animation
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-visible");
        observer.unobserve(entry.target); // Animate once
      }
    });
  }, {
    threshold: 0.1
  });

  document.querySelectorAll('.animate-up').forEach(el => observer.observe(el));



  document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.getElementById("hamburger");
    const navbarLinks = document.getElementById("navbarLinks");
    const mobileClose = document.getElementById("mobileClose");
    const navOverlay = document.getElementById("navOverlay");

    function openMenu() {
      navbarLinks.classList.add("active");
      navOverlay.classList.add("active");
    }

    function closeMenu() {
      navbarLinks.classList.remove("active");
      navOverlay.classList.remove("active");
    }

    hamburger.addEventListener("click", openMenu);
    mobileClose.addEventListener("click", closeMenu);
    navOverlay.addEventListener("click", closeMenu);
  });





    /* select role section for admin and user or guest on the front page */

  document.addEventListener("DOMContentLoaded", () => {
    const isLoggedIn = document.body.dataset.loggedin === "true";
    console.log("🟢 isLoggedIn from session:", isLoggedIn);

    // Attach to window so inline onclick can work
    window.triggerRoleSelection = function () {
      console.log("🟡 triggerRoleSelection was clicked!");

      if (isLoggedIn) {
        console.log("✅ User is logged in. Redirecting to /services");
        window.location.href = "/services";
      } else {
        console.log("🔒 User not logged in. Opening role selection modal.");
        openModal("roleSelectionSection");
      }
    };

    window.openAdminModal = function () {
      console.log("👤 Admin modal triggered.");
      openModal("adminRegisterSection");
    };

    window.openUserModal = function () {
      console.log("🙋‍♂️ Customer modal triggered.");
      openModal("customerRegisterSection");
    };

    window.closeAllModals = function () {
      console.log("❌ Closing all modals");
      document.body.classList.remove("modal-open");
      document.querySelectorAll(".qs-modal-overlay.active").forEach((modal) => {
        modal.classList.remove("active");
      });
    };

    function openModal(modalId) {
      window.closeAllModals();
      document.body.classList.add("modal-open");

      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add("active");
        console.log(`📦 Opening modal: ${modalId}`);
      } else {
        console.warn(`⚠️ Modal with ID '${modalId}' not found`);
      }
    }

    // ✅ Only close modal if clicked outside both overlay AND modal box
    document.addEventListener("click", (e) => {
      const activeModal = document.querySelector(".qs-modal-overlay.active");
      if (!activeModal) return;

      const modalBox = activeModal.querySelector(".qs-modal-box");

      // Check: if clicked target is NOT inside modal box OR trigger button
      if (
        modalBox &&
        !modalBox.contains(e.target) &&
        !e.target.closest("[onclick*='triggerRoleSelection']") &&
        !e.target.closest(".qs-modal-box")
      ) {
        console.log("🖱️ Clicked outside modal. Closing...");
        window.closeAllModals();
      }
    });
  });



  document.addEventListener("DOMContentLoaded", () => {
  const toast = document.getElementById("toast");
  if (toast) {
    // Animate in
    setTimeout(() => toast.classList.add("show"), 100);

    // Animate out after 4 seconds
    setTimeout(() => toast.classList.remove("show"), 4000);
  }
});
