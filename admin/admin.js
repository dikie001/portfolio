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
const projectsNav = document.querySelector('a[href="#projects"]');
const messagesNav = document.querySelector('a[href="#messages"]');
const analyticsNav = document.querySelector('a[href="#analytics"]');
const settingsNav = document.querySelector('a[href="#settings"]');

const projectsView = document.getElementById('projects-view');
const messagesView = document.getElementById('messages-view');
const analyticsView = document.getElementById('analytics-view');
const settingsView = document.getElementById('settings-view');

// Auth State Check
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const adminDoc = await getDoc(doc(db, 'config', 'admin'));
        
        if (!adminDoc.exists() || adminDoc.data().uid !== user.uid) {
            console.error("User is not the designated admin.");
            await signOut(auth);
            window.location.href = 'index.html';
            return;
        }

        // User is admin, initialize dashboard
        initDashboard();
        requestNotificationPermission();
    } catch (error) {
        console.error("Error verifying admin status:", error);
        window.location.href = 'index.html';
    }
});



function requestNotificationPermission() {
    if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
            console.log("Notification permission:", permission);
        });
    }
}

// Test Notification Button
if (testNotifyBtn) {
    testNotifyBtn.addEventListener('click', () => {
        if ("Notification" in window) {
            if (Notification.permission === "granted") {
                new Notification("Test Notification", {
                    body: "If you see this, notifications are working!",
                    icon: '../images/logo.png'
                });
            } else {
                alert("Notification permission is currently: " + Notification.permission + ". Please enable them in your browser.");
                Notification.requestPermission();
            }
        } else {
            alert("This browser does not support desktop notifications.");
        }
    });
}

function initDashboard() {
    console.log("Initializing Dashboard...");
    document.getElementById('auth-loader').style.display = 'none';
    loadProjects();
    loadMessages();
    loadAnalytics();
}


// Navigation Logic
projectsNav.parentElement.addEventListener('click', (e) => { e.preventDefault(); showView('projects'); });
messagesNav.parentElement.addEventListener('click', (e) => { e.preventDefault(); showView('messages'); });
analyticsNav.parentElement.addEventListener('click', (e) => { e.preventDefault(); showView('analytics'); });
settingsNav.parentElement.addEventListener('click', (e) => { e.preventDefault(); showView('settings'); });

function showView(view) {
    const views = {
        projects: { el: projectsView, nav: projectsNav },
        messages: { el: messagesView, nav: messagesNav },
        analytics: { el: analyticsView, nav: analyticsNav },
        settings: { el: settingsView, nav: settingsNav }
    };

    Object.keys(views).forEach(key => {
        if (key === view) {
            views[key].el.classList.remove('hidden');
            views[key].nav.parentElement.classList.add('active');
        } else {
            views[key].el.classList.add('hidden');
            views[key].nav.parentElement.classList.remove('active');
        }
    });
}

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Error signing out:", error);
    }
});

// PROJECTS LOGIC
async function loadProjects() {
    onSnapshot(query(collection(db, "projects"), orderBy("createdAt", "desc")), (snapshot) => {
        projectsTableBody.innerHTML = '';
        let total = 0;
        let live = 0;

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

        totalProjectsCount.textContent = total;
        liveProjectsCount.textContent = live;

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.id, snapshot));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteProject(btn.dataset.id));
        });
    });
}

// MESSAGES LOGIC
let isInitialMessagesLoad = true;
let lastVisibleMessage = null;
let firstVisibleMessage = null;
const PAGE_SIZE = 10;

async function loadMessages(direction = 'initial') {
    console.log("Loading messages from Firestore...");
    
    const messagesCollection = collection(db, "messages");
    let q;

    if (direction === 'next' && lastVisibleMessage) {
        q = query(messagesCollection, orderBy("createdAt", "desc"), startAfter(lastVisibleMessage), limit(PAGE_SIZE));
    } else if (direction === 'prev' && firstVisibleMessage) {
        q = query(messagesCollection, orderBy("createdAt", "desc"), endBefore(firstVisibleMessage), limitToLast(PAGE_SIZE));
    } else {
        q = query(messagesCollection, orderBy("createdAt", "desc"), limit(PAGE_SIZE));
    }

    // Unread count is no longer supported by the required schema
    unreadCountBadge.style.display = 'none';

    try {
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            if (direction === 'initial') {
                messagesTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No messages found.</td></tr>';
            }
            return;
        }

        firstVisibleMessage = snapshot.docs[0];
        lastVisibleMessage = snapshot.docs[snapshot.docs.length - 1];

        renderMessages(snapshot);
        updatePaginationButtons(snapshot.size);
    } catch (error) {
        console.error("Error loading messages:", error);
        if (error.code === 'permission-denied') {
            alert("Permission denied. Your session may have expired.");
            window.location.href = 'index.html';
        }
    }
}

function updatePaginationButtons(currentSize) {
    const nextBtn = document.getElementById('next-messages-btn');
    const prevBtn = document.getElementById('prev-messages-btn');
    
    // Simple logic: disable next if we got fewer than PAGE_SIZE
    nextBtn.disabled = currentSize < PAGE_SIZE;
    
    // For Previous, we'd need more complex state or just enable/disable based on if we ever clicked next
    // For this simple implementation, let's just enable it if we aren't on the first page
    // Actually, a better way is to track page numbers
}

// Re-implementing renderMessages for clarity and to handle the new snapshot type
function renderMessages(snapshot) {
    messagesTableBody.innerHTML = '';

    snapshot.forEach((docSnap) => {
        const msg = docSnap.data();
        const id = docSnap.id;

        let date = 'Just now';
        if (msg.createdAt) {
            if (msg.createdAt.toDate) {
                date = msg.createdAt.toDate().toLocaleDateString();
            } else if (msg.createdAt instanceof Date) {
                date = msg.createdAt.toLocaleDateString();
            } else if (typeof msg.createdAt === 'string') {
                date = new Date(msg.createdAt).toLocaleDateString();
            }
        }

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

    document.querySelectorAll('.view-msg-btn').forEach(btn => {
        btn.addEventListener('click', () => viewMessage(btn.dataset.id, snapshot));
    });
    document.querySelectorAll('.delete-msg-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteMessage(btn.dataset.id));
    });

    isInitialMessagesLoad = false;
}

// Pagination Listeners
document.getElementById('next-messages-btn').addEventListener('click', () => {
    loadMessages('next');
    document.getElementById('prev-messages-btn').disabled = false;
});

document.getElementById('prev-messages-btn').addEventListener('click', () => {
    loadMessages('prev');
});


function viewMessage(id, snapshot) {
    const msg = snapshot.docs.find(d => d.id === id).data();
    alert(`From: ${msg.name} (${msg.email})\n\nMessage: ${msg.message}`);
}

async function deleteMessage(id) {
    if (confirm("Delete this message?")) {
        await deleteDoc(doc(db, "messages", id));
    }
}

// ANALYTICS LOGIC
function loadAnalytics() {
    onSnapshot(collection(db, "visits"), (snapshot) => {
        const total = snapshot.size;
        totalVisitsCount.textContent = total;

        const sources = {};
        const countries = {};

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const source = data.source || 'Unknown';
            const country = data.country || 'Unknown';

            sources[source] = (sources[source] || 0) + 1;
            countries[country] = (countries[country] || 0) + 1;
        });

        // Get Top Source
        const topSource = Object.keys(sources).reduce((a, b) => sources[a] > sources[b] ? a : b, 'N/A');
        topSourceEl.textContent = topSource;

        // Get Top Country
        const topCountry = Object.keys(countries).reduce((a, b) => countries[a] > countries[b] ? a : b, 'N/A');
        topCountryEl.textContent = topCountry;

        // Render Lists
        renderAnalyticsList(sourceList, sources, total);
        renderAnalyticsList(countryList, countries, total);
    });
}

function renderAnalyticsList(el, data, total) {
    el.innerHTML = '';
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
    
    sorted.forEach(([name, count]) => {
        const percent = Math.round((count / total) * 100);
        const item = document.createElement('div');
        item.style.marginBottom = '1rem';
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem;">
                <span style="font-size: 0.9rem;">${name}</span>
                <span style="font-size: 0.85rem; color: var(--text-light);">${count} (${percent}%)</span>
            </div>
            <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
                <div style="height: 100%; width: ${percent}%; background: var(--accent-color);"></div>
            </div>
        `;
        el.appendChild(item);
    });
}

// SETTINGS LOGIC
const settingsForm = document.getElementById('settings-form');
const settingsMsg = document.getElementById('settings-msg');
const updatePasswordBtn = document.getElementById('update-password-btn');

settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
        settingsMsg.textContent = "Passwords do not match.";
        settingsMsg.style.color = "var(--error-color)";
        settingsMsg.classList.remove('hidden');
        return;
    }

    if (newPassword.length < 6) {
        settingsMsg.textContent = "Password must be at least 6 characters.";
        settingsMsg.style.color = "var(--error-color)";
        settingsMsg.classList.remove('hidden');
        return;
    }

    const btnText = updatePasswordBtn.querySelector('.btn-text');
    const loader = updatePasswordBtn.querySelector('.loader');

    btnText.classList.add('hidden');
    loader.classList.remove('hidden');
    updatePasswordBtn.disabled = true;
    settingsMsg.classList.add('hidden');

    try {
        await updatePassword(auth.currentUser, newPassword);
        settingsMsg.textContent = "Password updated successfully!";
        settingsMsg.style.color = "var(--success-color)";
        settingsMsg.classList.remove('hidden');
        settingsForm.reset();
    } catch (error) {
        console.error(error);
        settingsMsg.textContent = "Error updating password. You may need to re-login.";
        settingsMsg.style.color = "var(--error-color)";
        settingsMsg.classList.remove('hidden');
    } finally {
        btnText.classList.remove('hidden');
        loader.classList.add('hidden');
        updatePasswordBtn.disabled = false;
    }
});

// Modal Logic
addProjectBtn.addEventListener('click', () => {
    modalTitle.textContent = 'Add New Project';
    projectForm.reset();
    document.getElementById('project-id').value = '';
    projectModal.classList.remove('hidden');
});

closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        projectModal.classList.add('hidden');
    });
});

projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('project-id').value;
    const saveBtn = document.getElementById('save-project-btn');
    
    const projectData = {
        title: document.getElementById('project-title').value,
        description: document.getElementById('project-desc').value,
        image: document.getElementById('project-image').value,
        tags: document.getElementById('project-tags').value.split(',').map(tag => tag.trim()),
        liveLink: document.getElementById('project-live').value,
        githubLink: document.getElementById('project-github').value,
        updatedAt: new Date()
    };

    saveBtn.disabled = true;
    try {
        if (id) {
            await updateDoc(doc(db, "projects", id), projectData);
        } else {
            projectData.createdAt = new Date();
            await addDoc(collection(db, "projects"), projectData);
        }
        projectModal.classList.add('hidden');
    } catch (error) {
        console.error(error);
        alert("Error saving project.");
    } finally {
        saveBtn.disabled = false;
    }
});

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
    if (confirm("Delete this project?")) {
        await deleteDoc(doc(db, "projects", id));
    }
}
