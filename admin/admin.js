import { auth, db } from '../firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// DOM Elements
const projectsTableBody = document.getElementById('projects-table-body');
const logoutBtn = document.getElementById('logout-btn');
const addProjectBtn = document.getElementById('add-project-btn');
const projectModal = document.getElementById('project-modal');
const closeModalBtns = document.querySelectorAll('.close-modal');
const projectForm = document.getElementById('project-form');
const modalTitle = document.getElementById('modal-title');
const totalProjectsCount = document.getElementById('total-projects-count');
const liveProjectsCount = document.getElementById('live-projects-count');

// Auth State Check
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'index.html';
    } else {
        loadProjects();
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Error signing out:", error);
    }
});

// Load Projects from Firestore
async function loadProjects() {
    try {
        const q = query(collection(db, "projects"), orderBy("title", "asc"));
        const querySnapshot = await getDocs(q);
        
        projectsTableBody.innerHTML = '';
        let total = 0;
        let live = 0;

        querySnapshot.forEach((doc) => {
            const project = doc.data();
            const id = doc.id;
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

        if (total === 0) {
            projectsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 3rem; color: var(--text-light);">No projects found. Add your first one!</td></tr>';
        }

        totalProjectsCount.textContent = total;
        liveProjectsCount.textContent = live;

        // Attach event listeners to new buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.id, querySnapshot));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteProject(btn.dataset.id));
        });

    } catch (error) {
        console.error("Error loading projects:", error);
        projectsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 3rem; color: var(--error-color);">Error loading projects. Check console.</td></tr>';
    }
}

// Modal Handling
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

window.addEventListener('click', (e) => {
    if (e.target === projectModal) {
        projectModal.classList.add('hidden');
    }
});

// Add/Update Project
projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('project-id').value;
    const saveBtn = document.getElementById('save-project-btn');
    const btnText = saveBtn.querySelector('.btn-text');
    const loader = saveBtn.querySelector('.loader');

    const projectData = {
        title: document.getElementById('project-title').value,
        description: document.getElementById('project-desc').value,
        image: document.getElementById('project-image').value,
        tags: document.getElementById('project-tags').value.split(',').map(tag => tag.trim()),
        liveLink: document.getElementById('project-live').value,
        githubLink: document.getElementById('project-github').value,
        updatedAt: new Date()
    };

    btnText.classList.add('hidden');
    loader.classList.remove('hidden');
    saveBtn.disabled = true;

    try {
        if (id) {
            await updateDoc(doc(db, "projects", id), projectData);
        } else {
            projectData.createdAt = new Date();
            await addDoc(collection(db, "projects"), projectData);
        }
        projectModal.classList.add('hidden');
        loadProjects();
    } catch (error) {
        console.error("Error saving project:", error);
        alert("Error saving project. See console.");
    } finally {
        btnText.classList.remove('hidden');
        loader.classList.add('hidden');
        saveBtn.disabled = false;
    }
});

// Edit Modal
function openEditModal(id, querySnapshot) {
    const docData = querySnapshot.docs.find(d => d.id === id).data();
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

// Delete Project
async function deleteProject(id) {
    if (confirm("Are you sure you want to delete this project?")) {
        try {
            await deleteDoc(doc(db, "projects", id));
            loadProjects();
        } catch (error) {
            console.error("Error deleting project:", error);
            alert("Error deleting project.");
        }
    }
}
