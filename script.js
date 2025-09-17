const STORAGE_USERS = "users";
const STORAGE_ISSUES = "issues";
const STORAGE_CURRENT_USER = "currentUser";
const STORAGE_ADMIN_LOGGED_IN = "adminLoggedIn";

let users = JSON.parse(localStorage.getItem(STORAGE_USERS)) || [];
let issues = JSON.parse(localStorage.getItem(STORAGE_ISSUES)) || [];
let currentUser = localStorage.getItem(STORAGE_CURRENT_USER) || null;
let isAdmin = localStorage.getItem("userRole") === "admin";

const loginPage = document.getElementById("loginPage");
const registerPage = document.getElementById("registerPage");
const adminLoginPage = document.getElementById("adminLoginPage");
const dashboardPage = document.getElementById("dashboardPage");
const adminDashboardPage = document.getElementById("adminDashboardPage");
const currentUserEl = document.getElementById("currentUser");
const issuesList = document.getElementById("issuesList");
const issueForm = document.getElementById("issueForm");
const issueTitleInput = document.getElementById("issueTitle");
const issueDescInput = document.getElementById("issueDesc");
const issueImageInput = document.getElementById("issueImage");

const adminIssuesList = document.getElementById("adminIssuesList");
const statusFilter = document.getElementById("statusFilter");
const adminLogoutBtn = document.getElementById("adminLogout");

const followUpNotification = document.getElementById("followUpNotification");
const followUpDropdown = document.getElementById("followUpDropdown");

adminLogoutBtn.addEventListener("click", logout);

const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";

function generateTrackingNumber() {
    return "PID-" + Date.now().toString().slice(-6);
}


function showLogin() {
    loginPage.classList.remove("hidden");
    registerPage.classList.add("hidden");
    adminLoginPage.classList.add("hidden");
    dashboardPage.classList.add("hidden");
    adminDashboardPage.classList.add("hidden");

    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
}

function showRegister() {
    loginPage.classList.add("hidden");
    registerPage.classList.remove("hidden");
    adminLoginPage.classList.add("hidden");
    dashboardPage.classList.add("hidden");
    adminDashboardPage.classList.add("hidden");
}

function showAdminLogin() {
    loginPage.classList.add("hidden");
    registerPage.classList.add("hidden");
    adminLoginPage.classList.remove("hidden");
    dashboardPage.classList.add("hidden");
    adminDashboardPage.classList.add("hidden");

    document.getElementById("adminUsername").value = "";
    document.getElementById("adminPassword").value = "";
}

function showDashboard() {
    loginPage.classList.add("hidden");
    registerPage.classList.add("hidden");
    adminLoginPage.classList.add("hidden");
    adminDashboardPage.classList.add("hidden");
    dashboardPage.classList.remove("hidden");
    currentUserEl.textContent = currentUser;
    loadUserIssues();
}

function showAdminDashboard() {
    loginPage.classList.add("hidden");
    registerPage.classList.add("hidden");
    adminLoginPage.classList.add("hidden");
    dashboardPage.classList.add("hidden");
    adminDashboardPage.classList.remove("hidden");
    loadAllIssues();
    updateFollowUpNotification();
}

document.getElementById("registerForm").addEventListener("submit", e => {
    e.preventDefault();
    const username = document.getElementById("regUsername").value;
    const password = document.getElementById("regPassword").value;

    if (users.find(u => u.username === username)) {
        alert("User already exists!");
        return;
    }

    users.push({ username, password });
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
    alert("Registration successful! You can login now.");

    document.getElementById("regUsername").value = "";
    document.getElementById("regPassword").value = "";

    showLogin();
});

document.getElementById("loginForm").addEventListener("submit", e => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        currentUser = username;
        localStorage.setItem(STORAGE_CURRENT_USER, currentUser);
        localStorage.setItem("userRole", "user");
        isAdmin = false;

        document.getElementById("username").value = "";
        document.getElementById("password").value = "";

        showDashboard();
    } else {
        alert("Invalid credentials");
    }
});

document.getElementById("adminLoginForm").addEventListener("submit", e => {
    e.preventDefault();
    const user = document.getElementById("adminUsername").value;
    const pass = document.getElementById("adminPassword").value;

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        localStorage.setItem(STORAGE_ADMIN_LOGGED_IN, "true");
        localStorage.setItem("userRole", "admin");
        currentUser = "Admin";
        isAdmin = true;

        document.getElementById("adminUsername").value = "";
        document.getElementById("adminPassword").value = "";

        showAdminDashboard();
    } else {
        alert("Invalid admin credentials");
    }
});

issueForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = issueTitleInput.value;
    const desc = issueDescInput.value;
    const imageFile = issueImageInput.files[0];

    let imageUrl = null;
    if (imageFile) {
        imageUrl = await convertImageToBase64(imageFile);
    }

    const trackingNumber = generateTrackingNumber();

    issues.push({
        id: trackingNumber,
        user: currentUser,
        title,
        desc,
        status: "Pending",
        image: imageUrl,
        timestamp: new Date().toISOString(),
        followUps: []
    });

    localStorage.setItem(STORAGE_ISSUES, JSON.stringify(issues));
    issueForm.reset();
    loadUserIssues();

    alert(`Your issue has been submitted. Tracking Number: ${trackingNumber}`);
});

function loadUserIssues() {
    issuesList.innerHTML = "";
    const userIssues = issues.filter(i => i.user === currentUser);

    if (userIssues.length === 0) {
        issuesList.innerHTML = "<p>You haven't reported any issues yet.</p>";
        return;
    }

    userIssues.forEach(issue => {
        const div = document.createElement("div");
        div.classList.add("issue-card");

        let imageHtml = issue.image ? `<img src="${issue.image}" alt="Issue Image">` : '';
        let followUpsHtml = issue.followUps.map(f => `<p class="followup"> ${f.text} <small>(${new Date(f.timestamp).toLocaleString()})</small></p>`).join("");

        div.innerHTML = `
            ${imageHtml}
            <h4>${issue.title} <small>[${issue.id}]</small></h4>
            <p>${issue.desc}</p>
            <p>Status: <span class="status-badge status-${issue.status.replace(/\s/g, '')}">${issue.status}</span></p>
            <div class="followups">${followUpsHtml}</div>
            <textarea placeholder="Add follow-up..." class="followup-input"></textarea>
            <button class="btn-followup" data-id="${issue.id}">Send Follow-up</button>
        `;
        issuesList.appendChild(div);
    });

    document.querySelectorAll(".btn-followup").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const issueId = e.target.dataset.id;
            const input = e.target.previousElementSibling;
            const text = input.value.trim();
            if (text) {
                addFollowUp(issueId, text);
                input.value = "";
            }
        });
    });
}

function loadAllIssues() {
    adminIssuesList.innerHTML = "";
    const filterStatus = statusFilter.value;
    const filteredIssues = issues.filter(issue => filterStatus === "all" || issue.status === filterStatus);

    if (filteredIssues.length === 0) {
        adminIssuesList.innerHTML = "<p>No issues found.</p>";
        return;
    }

    filteredIssues.forEach(issue => {
        const issueCard = document.createElement("div");
        issueCard.classList.add("issue-card");

        const formattedDate = new Date(issue.timestamp).toLocaleString();
        let imageHtml = issue.image ? `<img src="${issue.image}" alt="Issue Image">` : '';
        let followUpsHtml = issue.followUps.map(f => `<li> ${f.text} <small>(${new Date(f.timestamp).toLocaleString()})</small></li>`).join("");

        issueCard.innerHTML = `
            ${imageHtml}
            <h4>${issue.title} <small>[${issue.id}]</small></h4>
            <p><strong>Submitted by:</strong> ${issue.user}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p>${issue.desc}</p>
            <p><strong>Status:</strong> 
                <span class="status-badge status-${issue.status.replace(/\s/g, '')}">${issue.status}</span>
            </p>
            <p><strong>Follow-ups:</strong></p>
            <ul>${followUpsHtml || "<li>No follow-ups yet.</li>"}</ul>
            <div class="admin-controls">
                <label>Update Status:</label>
                <select class="status-select" data-id="${issue.id}">
                    <option value="Pending" ${issue.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="In Progress" ${issue.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Resolved" ${issue.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                </select>
                <button class="btn-danger delete-btn" data-id="${issue.id}">Delete</button>
            </div>
        `;
        adminIssuesList.appendChild(issueCard);
    });

    document.querySelectorAll(".status-select").forEach(select => {
        select.addEventListener("change", (e) => {
            const issueId = e.target.dataset.id;
            updateIssueStatus(issueId, e.target.value);
        });
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const issueId = e.target.dataset.id;
            deleteIssue(issueId);
        });
    });
}

function addFollowUp(issueId, text) {
    issues = issues.map(issue => {
        if (issue.id === issueId) {
            issue.followUps.push({ text, timestamp: new Date().toISOString() });
        }
        return issue;
    });
    localStorage.setItem(STORAGE_ISSUES, JSON.stringify(issues));
    loadUserIssues();
    if (isAdmin) loadAllIssues();
    updateFollowUpNotification();
}

function updateFollowUpNotification() {
    if (!followUpNotification) return;
    let totalFollowUps = issues.reduce((acc, issue) => acc + issue.followUps.length, 0);
    followUpNotification.textContent = totalFollowUps;
    followUpDropdown.innerHTML = issues.flatMap(issue =>
        issue.followUps.map(f => `<li><strong>${issue.id}</strong>: ${f.text} (${new Date(f.timestamp).toLocaleString()})</li>`)
    ).join("");
}

function updateIssueStatus(issueId, newStatus) {
    issues = issues.map(issue => {
        if (issue.id === issueId) {
            issue.status = newStatus;
        }
        return issue;
    });
    localStorage.setItem(STORAGE_ISSUES, JSON.stringify(issues));
    loadAllIssues();
}

function deleteIssue(issueId) {
    if (confirm("Are you sure you want to delete this issue?")) {
        issues = issues.filter(issue => issue.id !== issueId);
        localStorage.setItem(STORAGE_ISSUES, JSON.stringify(issues));
        loadAllIssues();
    }
}

function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function logout() {
    currentUser = null;
    isAdmin = false;
    localStorage.removeItem(STORAGE_CURRENT_USER);
    localStorage.removeItem(STORAGE_ADMIN_LOGGED_IN);
    localStorage.removeItem("userRole");

    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("adminUsername").value = "";
    document.getElementById("adminPassword").value = "";

    showLogin();
}

document.addEventListener("DOMContentLoaded", () => {
    const adminLoggedIn = localStorage.getItem(STORAGE_ADMIN_LOGGED_IN) === "true";
    const userRole = localStorage.getItem("userRole");

    if (adminLoggedIn && userRole === "admin") {
        currentUser = "Admin";
        isAdmin = true;
        showAdminDashboard();
    } else if (currentUser && userRole === "user") {
        isAdmin = false;
        showDashboard();
    } else {
        showLogin();
    }
});

