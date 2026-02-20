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

// Scroll Animation Observer for Golden Theme elements
const fadeElements = document.querySelectorAll('.fade-in');

const appearOptions = {
  threshold: 0.15,
  rootMargin: "0px 0px -50px 0px"
};

const appearOnScroll = new IntersectionObserver(function(entries, observer) {
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
