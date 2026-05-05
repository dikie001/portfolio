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
const topSourceEl = document.getElementById('top-source');
const topCountryEl = document.getElementById('top-country');
const sourceList = document.getElementById('source-list');
const countryList = document.getElementById('country-list');

// Navigation
const projectsNav = document.getElementById('projects-nav');
const messagesNav = document.getElementById('messages-nav');
const visitorsNav = document.getElementById('visitors-nav');
const analyticsNav = document.getElementById('analytics-nav');
const settingsNav = document.getElementById('settings-nav');

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
        initDashboard();
        requestNotificationPermission();
    } catch (error) {
        console.error("Auth verification error:", error);
        window.location.href = 'index.html';
    }
});

function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
}

function initDashboard() {
    console.log("Initializing Dashboard...");
    const loader = document.getElementById('auth-loader');
    if (loader) loader.style.display = 'none';
    
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

    const path = window.location.pathname;
    if (path.includes('projects.html') || path.endsWith('/admin/')) loadProjects();
    else if (path.includes('messages.html')) loadMessages();
    else if (path.includes('analytics.html')) loadAnalytics();
    else if (path.includes('visitors.html')) loadVisitors();
    
    setupRealtimeNotifications();
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

// PROJECTS LOGIC
async function loadProjects() {
    if (!projectsTableBody) return;
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
                <td><img src="${project.image || '../images/logo.png'}" class="project-thumb" alt="${project.title}"></td>
                <td><strong>${project.title}</strong></td>
                <td>${project.tags.join(', ')}</td>
                <td><span class="status-badge ${project.liveLink ? 'live' : 'draft'}">${project.liveLink ? 'Live' : 'Draft'}</span></td>
                <td class="actions">
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
const dashboardLoadTime = new Date(Date.now() - 60000);

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
    const q = query(collection(db, "messages"), where("createdAt", ">", dashboardLoadTime), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const msg = change.doc.data();
                const title = "New Inquiry: " + msg.name;
                const body = msg.message.substring(0, 100) + "...";
                showToast(title, body);
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification(title, { body: body, icon: "../images/logo.png" });
                }
                if (messagesTableBody) loadMessages('initial');
            }
        });
    });
}

async function loadMessages(direction = 'initial') {
    if (!messagesTableBody) return;
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
        tr.innerHTML = `
            <td>${date}</td>
            <td><strong>${msg.name}</strong></td>
            <td>${msg.email}</td>
            <td class="msg-preview">${msg.message}</td>
            <td class="actions">
                <button class="action-btn view-msg-btn" data-id="${id}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
                <button class="action-btn delete-msg-btn" data-id="${id}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </td>
        `;
        messagesTableBody.appendChild(tr);
    });

    document.querySelectorAll('.view-msg-btn').forEach(btn => btn.addEventListener('click', () => {
        const msg = snapshot.docs.find(d => d.id === btn.dataset.id).data();
        alert(`From: ${msg.name} (${msg.email})\n\nMessage: ${msg.message}`);
    }));
    document.querySelectorAll('.delete-msg-btn').forEach(btn => btn.addEventListener('click', () => deleteMessage(btn.dataset.id)));
}

const nextMsgBtn = document.getElementById('next-messages-btn');
const prevMsgBtn = document.getElementById('prev-messages-btn');
if (nextMsgBtn) nextMsgBtn.addEventListener('click', () => { loadMessages('next'); if (prevMsgBtn) prevMsgBtn.disabled = false; });
if (prevMsgBtn) prevMsgBtn.addEventListener('click', () => loadMessages('prev'));

async function deleteMessage(id) {
    if (confirm("Delete this message?")) await deleteDoc(doc(db, "messages", id));
}

// ANALYTICS LOGIC
function loadAnalytics() {
    if (!totalVisitsCount) return;
    onSnapshot(collection(db, "visits"), (snapshot) => {
        const total = snapshot.size;
        totalVisitsCount.textContent = total;
        const sources = {}, countries = {};
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            sources[data.source || 'Unknown'] = (sources[data.source || 'Unknown'] || 0) + 1;
            countries[data.country || 'Unknown'] = (countries[data.country || 'Unknown'] || 0) + 1;
        });
        if (topSourceEl) topSourceEl.textContent = Object.keys(sources).reduce((a, b) => sources[a] > sources[b] ? a : b, 'N/A');
        if (topCountryEl) topCountryEl.textContent = Object.keys(countries).reduce((a, b) => countries[a] > countries[b] ? a : b, 'N/A');
        if (sourceList) renderAnalyticsList(sourceList, sources, total);
        if (countryList) renderAnalyticsList(countryList, countries, total);
    });
}

function renderAnalyticsList(el, data, total) {
    el.innerHTML = '';
    Object.entries(data).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
        const percent = Math.round((count / total) * 100);
        const item = document.createElement('div');
        item.style.marginBottom = '1rem';
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem;"><span style="font-size: 0.9rem;">${name}</span><span style="font-size: 0.85rem; color: var(--text-light);">${count} (${percent}%)</span></div>
            <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;"><div style="height: 100%; width: ${percent}%; background: var(--accent-color);"></div></div>
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

    onSnapshot(query(collection(db, "visits"), orderBy("timestamp", "desc"), limit(50)), (snapshot) => {
        table.innerHTML = '';
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const date = data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate().toLocaleString() : new Date(data.timestamp).toLocaleString()) : 'Unknown';
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${date}</td><td>${data.country || 'Unknown'}</td><td>${data.city || 'Unknown'}</td><td>${data.source || 'Direct'}</td><td><span class="page-tag">${data.page || '/'}</span></td><td class="ua-text" title="${data.userAgent}">${data.userAgent ? data.userAgent.substring(0, 30) + '...' : 'Unknown'}</td>`;
            table.appendChild(tr);
        });
    });

    onSnapshot(collection(db, "visits"), (snapshot) => {
        if (totalEl) totalEl.textContent = snapshot.size;
        renderVisitsGraph(snapshot);
    });
}

function renderVisitsGraph(snapshot) {
    const canvas = document.getElementById('visits-chart');
    if (!canvas || !window.Chart) return;
    const days = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        days[d.toLocaleDateString()] = 0;
    }
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.timestamp) {
            const date = data.timestamp.toDate ? data.timestamp.toDate().toLocaleDateString() : new Date(data.timestamp).toLocaleDateString();
            if (days[date] !== undefined) days[date]++;
        }
    });
    if (window.myChart) window.myChart.destroy();
    window.myChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: Object.keys(days),
            datasets: [{ label: 'Visits', data: Object.values(days), borderColor: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.1)', borderWidth: 3, tension: 0.4, fill: true, pointBackgroundColor: '#D4AF37', pointRadius: 4 }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9a9a9a' } }, x: { grid: { display: false }, ticks: { color: '#9a9a9a' } } }, plugins: { legend: { display: false } } }
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
if (closeModalBtns) closeModalBtns.forEach(btn => btn.addEventListener('click', () => projectModal.classList.add('hidden')));
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
