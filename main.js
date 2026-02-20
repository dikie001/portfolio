const menuIcon = document.querySelector("#menu-icon");
const navbar = document.querySelector(".navbar");

const cancelIcon = document.querySelector("#cancel-icon");

menuIcon.onclick = () => {
  menuIcon.classList.add("hidden");
  cancelIcon.classList.remove("hidden");
  navbar.classList.toggle("active");
};

cancelIcon.onclick = () => {
  menuIcon.classList.remove("hidden");
  cancelIcon.classList.add("hidden");
  navbar.classList.toggle("active");
};

// Close mobile menu when a link is clicked
const navLinks = document.querySelectorAll(".navbar a");
navLinks.forEach(link => {
  link.addEventListener("click", () => {
    menuIcon.classList.remove("hidden");
    cancelIcon.classList.add("hidden");
    navbar.classList.remove("active");
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
