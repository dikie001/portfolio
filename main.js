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

// Hero Greeting Bubble Click Toggle
const heroImg = document.querySelector(".home-img img");
const greetingBubble = document.querySelector(".greeting-bubble");

if (heroImg && greetingBubble) {
  heroImg.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent immediate closing
    greetingBubble.classList.toggle("active");
  });

  // Close bubble when clicking anywhere else
  document.addEventListener("click", () => {
    greetingBubble.classList.remove("active");
  });
}


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

// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const htmlEl = document.documentElement;

// Check for saved theme preference or default to dark
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') {
  htmlEl.setAttribute('data-theme', 'light');
}

themeToggle.addEventListener('click', () => {
  const current = htmlEl.getAttribute('data-theme');
  if (current === 'light') {
    htmlEl.removeAttribute('data-theme');
    localStorage.setItem('theme', 'dark');
  } else {
    htmlEl.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  }
});

// Pre-fill contact form based on selected plan
const planButtons = document.querySelectorAll('.plan-btn');
const messageField = document.getElementById('message');

planButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const plan = btn.getAttribute('data-plan');
    if (messageField) {
      messageField.value = `I'm interested in the ${plan} package. Here are the details of my project:\n\n`;
      setTimeout(() => {
        messageField.focus();
      }, 500);
    }
  });
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
