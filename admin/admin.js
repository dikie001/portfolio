import { auth, db } from '../firebase-config.js';
import { onAuthStateChanged, signOut, updatePassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    doc, 
    getDoc,
    setDoc,
    query, 
    orderBy,
    onSnapshot,
    where,
    limit,
    startAfter,
    endBefore,
    limitToLast
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// DOM Elements
const projectsTableBody = document.getElementById('projects-table-body');
const messagesTableBody = document.getElementById('messages-table-body');
const testNotifyBtn = document.getElementById('test-notify-btn');
const logoutBtn = document.getElementById('logout-btn');
const addProjectBtn = document.getElementById('add-project-btn');
const projectModal = document.getElementById('project-modal');
const closeModalBtns = document.querySelectorAll('.close-modal');
const projectForm = document.getElementById('project-form');
const modalTitle = document.getElementById('modal-title');
const totalProjectsCount = document.getElementById('total-projects-count');
const liveProjectsCount = document.getElementById('live-projects-count');
const unreadCountBadge = document.getElementById('unread-count');

// Analytics Elements
const totalVisitsCount = document.getElementById('total-visits-count');
const activeUsersCount = document.getElementById('active-users-count');
const topSourceEl = document.getElementById('top-source');
const topCountryEl = document.getElementById('top-country');
const sourceList = document.getElementById('source-list');
const countryList = document.getElementById('country-list');

// Dashboard Specific
const dashUniqueVisitors = document.getElementById('dash-unique-visitors');
const dashTotalProjects = document.getElementById('dash-total-projects');
const dashTotalMessages = document.getElementById('dash-total-messages');
const dashActiveUsers = document.getElementById('dash-active-users');
const dashLatestMessages = document.getElementById('dash-latest-messages');

// Navigation
const dashboardNav = document.getElementById('dashboard-nav');
const projectsNav = document.getElementById('projects-nav');
const messagesNav = document.getElementById('messages-nav');
const visitorsNav = document.getElementById('visitors-nav');
const analyticsNav = document.getElementById('analytics-nav');
const settingsNav = document.getElementById('settings-nav');

const globalLoader = document.getElementById('global-loader');
const loaderText = document.getElementById('loader-text');

function showLoading(text = "Fetching Data...") {
    if (loaderText) loaderText.textContent = text;
    if (globalLoader) globalLoader.classList.remove('hidden');
}

function hideLoading() {
    if (globalLoader) globalLoader.classList.add('hidden');
}

// Auth State Check
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const adminDoc = await getDoc(doc(db, 'config', 'admin'));
        if (!adminDoc.exists() || adminDoc.data().uid !== user.uid) {
            await signOut(auth);
            window.location.href = 'index.html';
            return;
        }

        // Initialize Session Tracking (don't wait for it to block the whole UI if possible)
        initializeSession(user.uid).catch(err => console.error("Session init failed:", err));
        
        initDashboard();
        requestNotificationPermission();
    } catch (error) {
        console.error("Auth verification error:", error);
        window.location.href = 'index.html';
    } finally {
        hideLoading();
    }
});

function requestNotificationPermission() {
    if ("Notification" in window) {
        if (Notification.permission === "default") {
            Notification.requestPermission();
        }
        
        // Register Service Worker for background notifications
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/admin/sw.js')
                .then(reg => console.log('Service Worker Registered', reg))
                .catch(err => console.error('Service Worker registration failed', err));
        }
    }
}

function initDashboard() {
    console.log("Initializing Dashboard...");
    
    hideLoading();

    const user = auth.currentUser;
    if (user) {
        const name = user.displayName || "Admin User";
        const userNameEl = document.getElementById('user-name');
        const dropNameEl = document.getElementById('dropdown-name');
        const dropEmailEl = document.getElementById('dropdown-email');
        const userAvatar = document.getElementById('user-avatar');
        const dropAvatar = document.getElementById('dropdown-avatar');

        if (userNameEl) userNameEl.textContent = name;
        if (dropNameEl) dropNameEl.textContent = name;
        if (dropEmailEl) dropEmailEl.textContent = user.email;
        if (user.photoURL) {
            if (userAvatar) userAvatar.src = user.photoURL;
            if (dropAvatar) dropAvatar.src = user.photoURL;
        }
    }

    const profileTrigger = document.getElementById('profile-trigger');
    const profileDropdown = document.getElementById('profile-dropdown');
    if (profileTrigger && profileDropdown) {
        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('hidden');
        });
        document.addEventListener('click', () => profileDropdown.classList.add('hidden'));
    }

    // Initialize Navigation Links (Highlight active page)
    const path = window.location.pathname;
    if (path.includes('dashboard.html')) {
        loadDashboard();
    } else if (path.includes('projects.html') || path.endsWith('/admin/')) {
        loadProjects();
    } else if (path.includes('messages.html')) {
        loadMessages();
    } else if (path.includes('analytics.html')) {
        loadAnalytics();
    } else if (path.includes('visitors.html')) {
        loadVisitors();
    } else if (path.includes('sessions.html')) {
        loadSessions();
        setupSessionNotifications();
    } else if (path.includes('settings.html')) {
        // Settings logic already handled via event listeners
    }
    
    // Global features
    if (!path.includes('index.html')) {
        setupRealtimeNotifications();
    }
}

// Immediate Mobile Menu Setup to avoid delay
setupMobileMenu();

function setupMobileMenu() {
    const topNavbar = document.querySelector('.top-navbar');
    if (!topNavbar) return;

    // Create Toggle Button if not exists
    if (!document.querySelector('.menu-toggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'menu-toggle';
        toggleBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
        `;
        topNavbar.prepend(toggleBtn);

        // Create Overlay if not exists
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);

        // Toggle Event
        toggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-open');
        });

        // Close Event
        overlay.addEventListener('click', () => {
            document.body.classList.remove('sidebar-open');
        });

        // Close on Link Click
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                document.body.classList.remove('sidebar-open');
            });
        });
    }
}

async function loadDashboard() {
    if (!dashUniqueVisitors) return;
    showStatsSkeleton();
    showGraphSkeleton('dash-visits-chart');
    if (dashLatestMessages) dashLatestMessages.innerHTML = '<div class="skeleton" style="height: 200px; border-radius: 12px;"></div>';

    // Fetch Visitors (only last 7 days for performance)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const vQuery = query(collection(db, "visitors"), where("lastVisit", ">=", sevenDaysAgo));

    onSnapshot(vQuery, (snapshot) => {
        if (dashUniqueVisitors) dashUniqueVisitors.textContent = snapshot.size;
        if (dashActiveUsers) dashActiveUsers.textContent = Math.floor(Math.random() * 3) + 1;
        hideGraphSkeleton('dash-visits-chart');
        renderVisitsGraph(snapshot, 'dash-visits-chart');
    });

    // Total Projects
    onSnapshot(collection(db, "projects"), (snapshot) => {
        if (dashTotalProjects) dashTotalProjects.textContent = snapshot.size;
    });

    // Total Messages & Latest 3
    onSnapshot(collection(db, "messages"), (snapshot) => {
        if (dashTotalMessages) dashTotalMessages.textContent = snapshot.size;
        
        if (dashLatestMessages) {
            dashLatestMessages.innerHTML = '';
            const latest = snapshot.docs
                .sort((a, b) => (b.data().createdAt?.seconds || 0) - (a.data().createdAt?.seconds || 0))
                .slice(0, 3);

            if (latest.length === 0) {
                dashLatestMessages.innerHTML = '<p style="text-align:center; padding: 2rem; color: var(--text-light);">No messages yet.</p>';
                return;
            }

            latest.forEach(docSnap => {
                const msg = docSnap.data();
                const item = document.createElement('div');
                item.className = 'latest-message-item';
                item.style.padding = '1rem 1.5rem';
                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
                        <strong style="font-weight: 600;">${msg.name}</strong>
                        <span style="font-size: 0.7rem; color: var(--text-light); opacity: 0.6;">${msg.createdAt ? (msg.createdAt.toDate ? msg.createdAt.toDate().toLocaleDateString() : new Date(msg.createdAt).toLocaleDateString()) : 'Recently'}</span>
                    </div>
                    <p style="margin: 0; line-height: 1.4;">${msg.message}</p>
                `;
                dashLatestMessages.appendChild(item);
            });
        }
    });
}

const handleLogout = async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Logout error:", error);
    }
};

if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
const dropLogoutBtn = document.getElementById('dropdown-logout-btn');
if (dropLogoutBtn) dropLogoutBtn.addEventListener('click', handleLogout);

function showTableSkeleton(tableBody, columns = 5, rows = 5) {
    if (!tableBody) return;
    tableBody.innerHTML = '';
    for (let i = 0; i < rows; i++) {
        const tr = document.createElement('tr');
        let cols = '';
        for (let j = 0; j < columns; j++) {
            cols += `<td><div class="skeleton skeleton-text" style="height: 1rem; width: ${Math.random() * 40 + 60}%"></div></td>`;
        }
        tr.innerHTML = cols;
        tableBody.appendChild(tr);
    }
}

function showStatsSkeleton() {
    const stats = document.querySelectorAll('.stat-card .value');
    stats.forEach(el => {
        el.innerHTML = '<div class="skeleton skeleton-text" style="width: 60px; height: 1.8rem; margin: 0.5rem auto;"></div>';
    });
}

function showGraphSkeleton(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (parent) {
        let skeleton = document.getElementById(canvasId + '-skeleton');
        if (!skeleton) {
            skeleton = document.createElement('div');
            skeleton.id = canvasId + '-skeleton';
            skeleton.className = 'skeleton';
            skeleton.style.width = '100%';
            skeleton.style.height = '100%';
            skeleton.style.borderRadius = '12px';
            canvas.style.display = 'none';
            parent.appendChild(skeleton);
        }
    }
}

function hideGraphSkeleton(canvasId) {
    const canvas = document.getElementById(canvasId);
    const skeleton = document.getElementById(canvasId + '-skeleton');
    if (canvas) canvas.style.display = 'block';
    if (skeleton) skeleton.remove();
}

// PROJECTS LOGIC
async function loadProjects() {
    if (!projectsTableBody) return;
    showTableSkeleton(projectsTableBody, 5);
    showStatsSkeleton();
    onSnapshot(query(collection(db, "projects"), orderBy("createdAt", "desc")), (snapshot) => {
        projectsTableBody.innerHTML = '';
        let total = 0, live = 0;

        snapshot.forEach((docSnap) => {
            const project = docSnap.data();
            const id = docSnap.id;
            total++;
            if (project.liveLink) live++;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Image"><img src="${project.image || '../images/logo.png'}" class="project-thumb" alt="${project.title}"></td>
                <td data-label="Title"><strong>${project.title}</strong></td>
                <td data-label="Tags">${project.tags.join(', ')}</td>
                <td data-label="Status"><span class="status-badge ${project.liveLink ? 'live' : 'draft'}">${project.liveLink ? 'Live' : 'Draft'}</span></td>
                <td data-label="Actions" class="actions">
                    <button class="action-btn edit-btn" data-id="${id}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path></svg>
                    </button>
                    <button class="action-btn delete-btn" data-id="${id}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </td>
            `;
            projectsTableBody.appendChild(tr);
        });

        if (totalProjectsCount) totalProjectsCount.textContent = total;
        if (liveProjectsCount) liveProjectsCount.textContent = live;

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.id, snapshot));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteProject(btn.dataset.id));
        });
    });
}


// MESSAGES LOGIC
const PAGE_SIZE = 10;
let lastVisibleMessage = null, firstVisibleMessage = null;
const dashboardLoadTime = new Date();

function showToast(title, message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification fade-in';
    toast.style.cssText = `position: fixed; bottom: 2rem; right: 2rem; background: #1a1a1a; border: 1px solid var(--accent-color); padding: 1.5rem; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 10001; max-width: 350px;`;
    toast.innerHTML = `
        <h4 style="color: var(--accent-color); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            ${title}
        </h4>
        <p style="font-size: 0.9rem; color: var(--text-light); margin-bottom: 1rem;">${message}</p>
        <button class="btn btn-primary" style="padding: 0.4rem 1rem; font-size: 0.8rem;" onclick="this.parentElement.remove()">Dismiss</button>
    `;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentElement) toast.remove(); }, 10000);
}

function setupRealtimeNotifications() {
    let isInitialMessagesLoad = true;
    const q = query(collection(db, "messages"), where("createdAt", ">", dashboardLoadTime), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        if (isInitialMessagesLoad) {
            isInitialMessagesLoad = false;
            return;
        }
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const msg = change.doc.data();
                const title = "New Inquiry: " + msg.name;
                const body = msg.message.substring(0, 100) + "...";
                showToast(title, body);
                if ("Notification" in window && Notification.permission === "granted") {
                    const options = {
                        body: body,
                        icon: "../images/logo.png",
                        badge: "../images/logo.png",
                        data: { url: '/admin/messages.html' }
                    };
                    
                    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                        navigator.serviceWorker.ready.then(reg => {
                            reg.showNotification(title, options);
                        });
                    } else {
                        new Notification(title, options);
                    }
                }
                if (messagesTableBody) loadMessages('initial');
            }
        });
    });
}

async function loadMessages(direction = 'initial') {
    if (!messagesTableBody) return;
    showTableSkeleton(messagesTableBody, 5);
    
    const messagesCollection = collection(db, "messages");
    let q;
    if (direction === 'next' && lastVisibleMessage) q = query(messagesCollection, orderBy("createdAt", "desc"), startAfter(lastVisibleMessage), limit(PAGE_SIZE));
    else if (direction === 'prev' && firstVisibleMessage) q = query(messagesCollection, orderBy("createdAt", "desc"), endBefore(firstVisibleMessage), limitToLast(PAGE_SIZE));
    else q = query(messagesCollection, orderBy("createdAt", "desc"), limit(PAGE_SIZE));

    if (unreadCountBadge) unreadCountBadge.style.display = 'none';

    try {
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            if (direction === 'initial') messagesTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No messages found.</td></tr>';
            return;
        }
        firstVisibleMessage = snapshot.docs[0];
        lastVisibleMessage = snapshot.docs[snapshot.docs.length - 1];
        renderMessages(snapshot);
        updatePaginationButtons(snapshot.size);
    } catch (error) {
        console.error("Messages load error:", error);
    }
}

function updatePaginationButtons(currentSize) {
    const nextBtn = document.getElementById('next-messages-btn');
    const prevBtn = document.getElementById('prev-messages-btn');
    if (nextBtn) nextBtn.disabled = currentSize < PAGE_SIZE;
}

function renderMessages(snapshot) {
    if (!messagesTableBody) return;
    messagesTableBody.innerHTML = '';
    snapshot.forEach((docSnap) => {
        const msg = docSnap.data();
        const id = docSnap.id;
        const date = msg.createdAt ? (msg.createdAt.toDate ? msg.createdAt.toDate().toLocaleDateString() : new Date(msg.createdAt).toLocaleDateString()) : 'Just now';
        
        const tr = document.createElement('tr');
        tr.className = 'clickable';
        tr.onclick = (e) => {
            if (!e.target.closest('.action-dropdown')) window.viewMessage(id);
        };
        
        tr.innerHTML = `
            <td data-label="Date">${date}</td>
            <td data-label="Sender"><strong>${msg.name}</strong></td>
            <td data-label="Email">${msg.email}</td>
            <td data-label="Message" class="msg-preview">${msg.message}</td>
            <td data-label="Actions">
                <div class="action-dropdown">
                    <button class="action-btn" onclick="event.stopPropagation(); window.toggleDropdown('${id}')">
                        Actions <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 4px;"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <div id="dropdown-${id}" class="dropdown-content">
                        <button onclick="window.viewMessage('${id}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            View Details
                        </button>
                        <a href="mailto:${msg.email}?subject=Re: Portfolio Inquiry" onclick="event.stopPropagation()">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                            Send Email
                        </a>
                        <button class="delete-action" onclick="event.stopPropagation(); window.deleteMessage('${id}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            Delete
                        </button>
                    </div>
                </div>
            </td>
        `;
        messagesTableBody.appendChild(tr);
    });
}

// Window scoped functions for global access
window.addEventListener('click', (e) => {
    if (!e.target.closest('.action-dropdown')) {
        document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));
    }
});

window.toggleDropdown = (id) => {
    const dropdown = document.getElementById(`dropdown-${id}`);
    document.querySelectorAll('.dropdown-content').forEach(d => {
        if (d !== dropdown) d.classList.remove('show');
    });
    if (dropdown) dropdown.classList.toggle('show');
};

window.viewMessage = async (id) => {
    try {
        const docSnap = await getDoc(doc(db, "messages", id));
        if (!docSnap.exists()) return;
        const msg = docSnap.data();
        
        document.getElementById('msg-detail-name').textContent = msg.name;
        document.getElementById('msg-detail-email').textContent = msg.email;
        document.getElementById('msg-detail-date').textContent = msg.createdAt ? (msg.createdAt.toDate ? msg.createdAt.toDate().toLocaleString() : new Date(msg.createdAt).toLocaleString()) : 'Unknown';
        document.getElementById('msg-detail-content').textContent = msg.message;
        document.getElementById('msg-reply-btn').href = `mailto:${msg.email}?subject=Re: Portfolio Inquiry`;
        
        const modal = document.getElementById('view-message-modal');
        if (modal) modal.classList.remove('hidden');
    } catch (error) {
        console.error("Error viewing message:", error);
    }
};

const nextMsgBtn = document.getElementById('next-messages-btn');
const prevMsgBtn = document.getElementById('prev-messages-btn');
if (nextMsgBtn) nextMsgBtn.addEventListener('click', () => { loadMessages('next'); if (prevMsgBtn) prevMsgBtn.disabled = false; });
if (prevMsgBtn) prevMsgBtn.addEventListener('click', () => loadMessages('prev'));

async function deleteMessage(id) {
    if (confirm("Delete this message?")) {
        try {
            await deleteDoc(doc(db, "messages", id));
            loadMessages();
        } catch (error) {
            console.error("Delete error:", error);
        }
    }
}
window.deleteMessage = deleteMessage;

// ANALYTICS LOGIC
function loadAnalytics() {
    if (!totalVisitsCount) return;
    showStatsSkeleton();
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 30); // Show last 30 days for analytics
    const vQuery = query(collection(db, "visitors"), where("lastVisit", ">=", sevenDaysAgo));

    onSnapshot(vQuery, (snapshot) => {
        let totalUniqueVisits = 0;
        let totalSessions = 0;
        const sources = {}, countries = {};
        
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            totalUniqueVisits++;
            totalSessions += (data.visitCount || 1);
            const s = data.source || 'Direct';
            const c = data.country || 'Unknown';
            sources[s] = (sources[s] || 0) + 1;
            countries[c] = (countries[c] || 0) + 1;
        });

        totalVisitsCount.textContent = totalUniqueVisits;
        if (activeUsersCount) activeUsersCount.textContent = Math.floor(Math.random() * 3) + 1; 

        const getTop = (obj) => {
            const keys = Object.keys(obj);
            if (keys.length === 0) return 'N/A';
            return keys.reduce((a, b) => obj[a] > obj[b] ? a : b);
        };

        if (topSourceEl) topSourceEl.textContent = getTop(sources);
        if (topCountryEl) topCountryEl.textContent = getTop(countries);
        if (sourceList) renderAnalyticsList(sourceList, sources, totalUniqueVisits);
        if (countryList) renderAnalyticsList(countryList, countries, totalUniqueVisits);
    });
}

function renderAnalyticsList(el, data, total) {
    el.innerHTML = '';
    Object.entries(data).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
        const percent = Math.round((count / total) * 100);
        const item = document.createElement('div');
        item.className = 'analytics-item';
        item.innerHTML = `
            <div class="analytics-item-info">
                <span class="analytics-item-name">${name}</span>
                <span class="analytics-item-count">${count} (${percent}%)</span>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${percent}%"></div>
            </div>
        `;
        el.appendChild(item);
    });
}

// SETTINGS LOGIC
const settingsForm = document.getElementById('settings-form');
if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPass = document.getElementById('new-password').value;
        const confPass = document.getElementById('confirm-password').value;
        const msgEl = document.getElementById('settings-msg');
        if (newPass !== confPass) { msgEl.textContent = "Passwords do not match."; msgEl.style.color = "var(--error-color)"; msgEl.classList.remove('hidden'); return; }
        const btn = document.getElementById('update-password-btn');
        btn.disabled = true;
        try {
            await updatePassword(auth.currentUser, newPass);
            msgEl.textContent = "Password updated successfully!"; msgEl.style.color = "var(--success-color)"; msgEl.classList.remove('hidden');
            settingsForm.reset();
        } catch (error) {
            console.error(error);
            msgEl.textContent = "Error updating password. Re-login may be required."; msgEl.style.color = "var(--error-color)"; msgEl.classList.remove('hidden');
        } finally { btn.disabled = false; }
    });
}

// VISITORS LOGIC
async function loadVisitors() {
    const table = document.getElementById('visitors-table-body');
    const totalEl = document.getElementById('total-visitors-count');
    if (!table) return;

    showTableSkeleton(table, 7);
    showStatsSkeleton();
    showGraphSkeleton('visits-chart');

    // Fetch unique visitors from the new collection
    onSnapshot(query(collection(db, "visitors"), orderBy("lastVisit", "desc"), limit(100)), (snapshot) => {
        table.innerHTML = '';
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const date = data.lastVisit ? (data.lastVisit.toDate ? data.lastVisit.toDate().toLocaleString() : new Date(data.lastVisit).toLocaleString()) : 'Unknown';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Last Visit">${date}</td>
                <td data-label="IP"><span class="ip-badge">${data.ip || 'Unknown'}</span></td>
                <td data-label="Country">${data.country || 'Unknown'}</td>
                <td data-label="City">${data.city || 'Unknown'}</td>
                <td data-label="Source">${data.source || 'Direct'}</td>
                <td data-label="Visits"><span class="visit-count">${data.visitCount || 1}</span></td>
                <td data-label="User Agent" class="ua-text" title="${data.userAgent}">${data.userAgent ? data.userAgent.substring(0, 20) + '...' : 'Unknown'}</td>
            `;
            table.appendChild(tr);
        });

        if (totalEl) totalEl.textContent = snapshot.size;
        hideGraphSkeleton('visits-chart');
        renderVisitsGraph(snapshot);
    });
}

function renderVisitsGraph(snapshot, canvasId = 'visits-chart') {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return;
    const days = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        days[d.toLocaleDateString()] = 0;
    }
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.lastVisit) {
            const date = data.lastVisit.toDate ? data.lastVisit.toDate().toLocaleDateString() : new Date(data.lastVisit).toLocaleDateString();
            if (days[date] !== undefined) days[date]++;
        }
    });

    const chartKey = 'chart_' + canvasId;
    if (window[chartKey]) window[chartKey].destroy();
    
    window[chartKey] = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: Object.keys(days).map(d => {
                const date = new Date(d);
                return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            }),
            datasets: [{ 
                label: 'Unique Visits', 
                data: Object.values(days), 
                borderColor: '#D4AF37', 
                backgroundColor: 'rgba(212, 175, 55, 0.1)', 
                borderWidth: 3, 
                tension: 0.4, 
                fill: true, 
                pointBackgroundColor: '#D4AF37', 
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            scales: { 
                y: { 
                    beginAtZero: true, 
                    grid: { color: 'rgba(255,255,255,0.05)' }, 
                    ticks: { 
                        color: '#9a9a9a',
                        stepSize: 1,
                        precision: 0,
                        callback: function(value) { if (value % 1 === 0) return value; }
                    } 
                }, 
                x: { 
                    grid: { display: false }, 
                    ticks: { 
                        color: '#9a9a9a',
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: window.innerWidth < 480 ? 4 : 7
                    } 
                } 
            }, 
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(20, 20, 20, 0.9)',
                    titleColor: '#D4AF37',
                    bodyColor: '#fff',
                    borderColor: 'rgba(212, 175, 55, 0.3)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false
                }
            } 
        }
    });
}

// MODAL LOGIC
if (addProjectBtn) {
    addProjectBtn.addEventListener('click', () => {
        modalTitle.textContent = 'Add New Project';
        projectForm.reset();
        document.getElementById('project-id').value = '';
        projectModal.classList.remove('hidden');
    });
}
if (closeModalBtns) {
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) modal.classList.add('hidden');
        });
    });
}
if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('project-id').value;
        const projectData = {
            title: document.getElementById('project-title').value,
            description: document.getElementById('project-desc').value,
            image: document.getElementById('project-image').value,
            tags: document.getElementById('project-tags').value.split(',').map(tag => tag.trim()),
            liveLink: document.getElementById('project-live').value,
            githubLink: document.getElementById('project-github').value,
            updatedAt: new Date()
        };
        try {
            if (id) await updateDoc(doc(db, "projects", id), projectData);
            else { projectData.createdAt = new Date(); await addDoc(collection(db, "projects"), projectData); }
            projectModal.classList.add('hidden');
        } catch (e) { console.error(e); alert("Error saving project."); }
    });
}

function openEditModal(id, snapshot) {
    const docData = snapshot.docs.find(d => d.id === id).data();
    modalTitle.textContent = 'Edit Project';
    document.getElementById('project-id').value = id;
    document.getElementById('project-title').value = docData.title;
    document.getElementById('project-desc').value = docData.description;
    document.getElementById('project-image').value = docData.image;
    document.getElementById('project-tags').value = docData.tags.join(', ');
    document.getElementById('project-live').value = docData.liveLink || '';
    document.getElementById('project-github').value = docData.githubLink || '';
    projectModal.classList.remove('hidden');
}

async function deleteProject(id) {
    if (confirm("Delete this project?")) await deleteDoc(doc(db, "projects", id));
}

// SESSION MANAGEMENT LOGIC
const sessionId = localStorage.getItem('admin_session_id') || crypto.randomUUID();
localStorage.setItem('admin_session_id', sessionId);

async function initializeSession(uid) {
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
        const data = sessionSnap.data();
        if (data.status === 'revoked') {
            alert("This session has been revoked by another device.");
            await signOut(auth);
            window.location.href = 'index.html';
            return false;
        }
        // Update last active
        await updateDoc(sessionRef, { lastActive: new Date() });
    } else {
        await registerSession(uid);
    }

    // Listen for revocation in real-time
    onSnapshot(sessionRef, (snap) => {
        if (snap.exists() && snap.data().status === 'revoked') {
            alert("This session has been revoked. You will be logged out.");
            signOut(auth).then(() => window.location.href = 'index.html');
        }
    });

    return true;
}

async function registerSession(uid) {
    const userAgent = navigator.userAgent;
    const isMobile = /Mobile|Android|iP(ad|hone)/.test(userAgent);
    const browser = userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Firefox') ? 'Firefox' : userAgent.includes('Safari') ? 'Safari' : 'Browser';
    const os = userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Mac') ? 'macOS' : userAgent.includes('Linux') ? 'Linux' : 'OS';

    await setDoc(doc(db, 'sessions', sessionId), {
        uid,
        sessionId,
        deviceName: `${os} - ${browser}${isMobile ? ' (Mobile)' : ''}`,
        deviceType: isMobile ? 'mobile' : 'desktop',
        userAgent,
        loginAt: new Date(),
        lastActive: new Date(),
        status: 'active'
    }, { merge: true });
}

function setupSessionNotifications() {
    let isInitialSessionsLoad = true;
    const q = query(collection(db, "sessions"), where("loginAt", ">", dashboardLoadTime), orderBy("loginAt", "desc"));
    onSnapshot(q, (snapshot) => {
        if (isInitialSessionsLoad) {
            isInitialSessionsLoad = false;
            return;
        }
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const session = change.doc.data();
                if (session.sessionId !== sessionId) {
                    const title = "New Device Logged In";
                    const body = `A new session was started on ${session.deviceName}`;
                    showToast(title, body);
                    
                    if ("Notification" in window && Notification.permission === "granted") {
                        const options = {
                            body: body,
                            icon: "../images/logo.png",
                            badge: "../images/logo.png",
                            data: { url: '/admin/sessions.html' }
                        };
                        
                        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                            navigator.serviceWorker.ready.then(reg => {
                                reg.showNotification(title, options);
                            });
                        } else {
                            new Notification(title, options);
                        }
                    }
                }
            }
        });
    });
}

// Global scope for revocation
window.revokeSession = async (sId) => {
    if (confirm("Are you sure you want to logout this device?")) {
        try {
            await updateDoc(doc(db, 'sessions', sId), { status: 'revoked' });
            if (window.location.pathname.includes('sessions.html')) loadSessions();
        } catch (error) {
            console.error("Revocation error:", error);
        }
    }
};

async function loadSessions() {
    const sessionsList = document.getElementById('sessions-list');
    if (!sessionsList) return;

    sessionsList.innerHTML = '<div class="skeleton" style="height: 100px; border-radius: 14px; margin-bottom: 1rem;"></div>'.repeat(3);

    // Fetch active sessions without orderBy to avoid index requirement
    const q = query(collection(db, 'sessions'), where('status', '==', 'active'));

    onSnapshot(q, (snapshot) => {
        sessionsList.innerHTML = '';
        if (snapshot.empty) {
            sessionsList.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-light);">No active sessions found.</p>';
            return;
        }

        // Sort on client side to avoid composite index requirement
        const sortedDocs = snapshot.docs.sort((a, b) => {
            const timeA = a.data().lastActive?.seconds || 0;
            const timeB = b.data().lastActive?.seconds || 0;
            return timeB - timeA;
        });

        sortedDocs.forEach(docSnap => {
            const session = docSnap.data();
            const isCurrent = session.sessionId === sessionId;
            const isMobile = session.deviceType === 'mobile' || session.deviceName?.includes('(Mobile)');
            const deviceIcon = isMobile 
                ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`
                : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`;

            const item = document.createElement('div');
            item.className = 'session-item';
            item.innerHTML = `
                <div class="session-info">
                    <div class="session-device">
                        ${deviceIcon}
                        ${session.deviceName || 'Unknown Device'}
                        ${isCurrent ? '<span class="current-badge">Current</span>' : ''}
                    </div>
                    <div class="session-meta">
                        Last active: ${session.lastActive ? (session.lastActive.toDate ? session.lastActive.toDate().toLocaleString() : new Date(session.lastActive).toLocaleString()) : 'Unknown'}
                    </div>
                </div>
                ${!isCurrent ? `<button class="btn btn-outline" style="border-color: var(--error-color); color: var(--error-color); padding: 0.4rem 1rem; font-size: 0.8rem;" onclick="window.revokeSession('${session.sessionId}')">Logout Device</button>` : ''}
            `;
            sessionsList.appendChild(item);
        });
    }, (error) => {
        console.error("Sessions onSnapshot error:", error);
        sessionsList.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--error-color);">Error loading sessions. Check console.</p>';
    });
}

