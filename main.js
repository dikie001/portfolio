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
window.onscroll = () => {
  // Header background effect
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }

  // Active link highlighting on scroll
  let current = "home"; // Default to home at the very top
  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    if (window.scrollY >= sectionTop - 200) {
      current = section.getAttribute("id");
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove("active");
    const href = link.getAttribute("href").substring(1);
    if (href === current) {
      link.classList.add("active");
    }
  });
};

// Manual Active Link Highlighting on Click
navLinks.forEach(link => {
  link.addEventListener("click", () => {
    // Mobile menu close
    menuIcon.classList.remove("active");
    navbar.classList.remove("active");
    
    // Active class update
    navLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");
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
