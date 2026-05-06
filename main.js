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

// Global Toast Notification System
window.showToast = function(title, message, type = 'success', duration = 5000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconHtml = '';
    if (type === 'loading') {
        iconHtml = '<div class="toast-spinner"></div>';
    } else {
        const icon = type === 'success' 
            ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
            : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
        iconHtml = icon;
    }

    toast.innerHTML = `
        <div class="toast-icon">${iconHtml}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;

    container.appendChild(toast);

    const removeToast = () => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
            if (container.childNodes.length === 0) container.remove();
        }, 500);
    };

    if (duration > 0) {
        setTimeout(removeToast, duration);
    }

    return { remove: removeToast };
};

// Share Functionality
window.closeShareModal = function() {
    const modal = document.getElementById('share-modal-overlay');
    if (modal) modal.classList.remove('active');
};

window.copyToClipboard = function() {
    const input = document.getElementById('share-link-input');
    input.select();
    input.setSelectionRange(0, 99999); // For mobile
    navigator.clipboard.writeText(input.value).then(() => {
        const btn = document.getElementById('copy-share-btn');
        const originalText = btn.innerText;
        btn.innerText = 'Copied!';
        btn.style.background = '#22c55e';
        btn.style.color = '#fff';
        
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = 'var(--accent-color)';
            btn.style.color = '#000';
        }, 2000);
    });
};

function initShare() {
    const shareBtn = document.getElementById('share-site-btn');
    if (!shareBtn) return;

    shareBtn.addEventListener('click', async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Dickens Omondi | Portfolio',
                    text: 'Check out Dickens Omondi\'s professional portfolio. Full-stack developer building fast, scalable web apps.',
                    url: window.location.href
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    document.getElementById('share-modal-overlay').classList.add('active');
                }
            }
        } else {
            document.getElementById('share-modal-overlay').classList.add('active');
        }
    });
}

// Resume Lazy Loading Simulation
window.viewResume = function() {
    const loadingToast = window.showToast("Fetching Resume", "Optimizing for your device...", "loading", -1);
    
    // Simulate a bit of loading for premium feel
    setTimeout(() => {
        loadingToast.remove();
        window.showToast("Ready!", "Opening Dickens Omondi's Resume.", "success", 3000);
        
        // Open the file
        setTimeout(() => {
            window.open('Dickens_Omondi_Resume.pdf', '_blank');
        }, 500);
    }, 1500);
};

// Scroll Down Indicator
function initScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (!scrollIndicator) return;

    scrollIndicator.addEventListener('click', () => {
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            // Scroll 80% of viewport height
            window.scrollBy({
                top: window.innerHeight * 0.80,
                behavior: 'smooth'
            });
        } else {
            // Desktop: Scroll to About section
            const aboutSection = document.getElementById('about');
            if (aboutSection) {
                aboutSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
}

// Scroll Top logic
function initScrollTop() {
    const scrollTopBtn = document.querySelector("#scroll-top");
    if (!scrollTopBtn) return;

    scrollTopBtn.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    initShare();
    initScrollIndicator();
    initScrollTop();
});
