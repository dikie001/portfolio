 const menuIcon = document.querySelector("#menu-icon");
const navbar = document.querySelector(".navbar");
const header = document.querySelector(".header");
const navLinks = document.querySelectorAll(".navbar a");
const sections = document.querySelectorAll("section");

// Toggle Mobile Menu
menuIcon.onclick = () => {
  menuIcon.classList.toggle("active");
  navbar.classList.toggle("active");
};

// Header Scroll Effect & Active Link Highlighter (Scroll Spy)
let lastActiveSection = "";
let isManualScroll = false;
let scrollTimeout;

window.onscroll = () => {
  // Header background effect
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }

  // Skip scroll spy if we are scrolling manually via a click
  if (isManualScroll) return;

  // Active link highlighting on scroll
  let current = "home"; 
  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    if (window.scrollY >= sectionTop - 250) {
      current = section.getAttribute("id");
    }
  });

  // Only update if the section has changed
  if (current !== lastActiveSection) {
    lastActiveSection = current;
    navLinks.forEach((link) => {
      link.classList.remove("active");
      const href = link.getAttribute("href").substring(1);
      if (href === current) {
        link.classList.add("active");
      }
    });
  }
};

// Manual Active Link Highlighting on Click
navLinks.forEach(link => {
  link.addEventListener("click", () => {
    // Prevent scroll spy from interfering during smooth scroll
    isManualScroll = true;
    clearTimeout(scrollTimeout);
    
    // Mobile menu close
    menuIcon.classList.remove("active");
    navbar.classList.remove("active");
    
    // Active class update
    navLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");

    // Reset manual scroll flag after the smooth scroll completes
    scrollTimeout = setTimeout(() => {
      isManualScroll = false;
      // Also update the lastActiveSection to match the clicked one
      lastActiveSection = link.getAttribute("href").substring(1);
    }, 1000); // 1s is usually enough for smooth scroll to finish
  });
});



// Scroll Animation Observer for Golden Theme elements
const fadeElements = document.querySelectorAll('.fade-in');

const appearOptions = {
  threshold: 0.15,
  rootMargin: "0px 0px -50px 0px"
};

const appearOnScroll = new IntersectionObserver(function (entries, observer) {
  entries.forEach(entry => {
    if (!entry.isIntersecting) {
      return;
    } else {
      entry.target.classList.add('appear');
      observer.unobserve(entry.target);
    }
  });
}, appearOptions);

fadeElements.forEach(el => {
  appearOnScroll.observe(el);
});





// Local Time Updates
function updateLocalTime() {
  const timeElement = document.getElementById('local-time');
  if (timeElement) {
    const now = new Date();
    // Use Kenya timezone
    const options = {
      timeZone: 'Africa/Nairobi',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    timeElement.textContent = now.toLocaleTimeString('en-US', options) + ' Local Time';
  }
}

updateLocalTime();
setInterval(updateLocalTime, 60000); // update every minute
