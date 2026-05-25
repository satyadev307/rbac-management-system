const BASE_URL =
"https://rbac-management-system.onrender.com";
let usersVisible = false;
let rolesVisible = false;
let permissionsVisible = false;
let userSearchVisible = false;
let roleSearchVisible = false;
let allUsers = [];
let allRoles = [];
let allPermissions = [];
let currentPermissions = {
    can_read: false,
    can_write: false,
    can_delete: false
};

function logout() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}

// LOGIN FUNCTION
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
        // ✅ Save token
        localStorage.setItem("token", data.token);

        // ✅ Redirect
        window.location.href = "dashboard.html";
    } else {
        document.getElementById("error").innerText = data.error;
    }
}

// GET TOKEN
function getToken() {
    return localStorage.getItem("token");
}

// VIEW USERS
async function getUsers() {
    const res = await fetch(`${BASE_URL}/users`, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + getToken()
        }
    });
allUsers = await res.json();
    renderUsers(allUsers);
}
    
function renderUsers(users) {

    const tableBody = document.querySelector("#userTable tbody");

    tableBody.innerHTML = "";

    // ✅ no users
    if (users.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">
                    No users found
                </td>
            </tr>
        `;

        return;
    }

    users.forEach(user => {

        const row = `
            <tr>

                <td>${user.id}</td>

                <td>${user.name}</td>

                <td>${user.email}</td>

                <td>${user.role}</td>

                <td>

    ${
        currentPermissions.can_write
        ?
        `<button onclick="editUser(
            ${user.id},
            '${user.name}',
            '${user.email}'
        )">
            ✏ Edit
        </button>`
        :
        ""
    }

    ${
        currentPermissions.can_delete
        ?
        `<button onclick="
            openDeleteModal(
                ${user.id},
                'user'
            )
        ">
            🗑 Delete
        </button>`
        :
        ""
    }

</td>

            </tr>
        `;

        tableBody.innerHTML += row;
    });
}

// EDIT USER
// OPEN EDIT MODAL
function editUser(id, currentName, currentEmail) {

    document.getElementById(
        "editUserId"
    ).value = id;

    document.getElementById(
        "editUserName"
    ).value = currentName;

    document.getElementById(
        "editUserEmail"
    ).value = currentEmail;

    document.getElementById(
        "editUserModal"
    ).style.display = "block";
}

// CLOSE MODAL
function closeEditModal() {

    document.getElementById(
        "editUserModal"
    ).style.display = "none";
}

// SAVE USER EDIT
async function saveUserEdit() {

    const id =
        document.getElementById(
            "editUserId"
        ).value;

    const name =
        document.getElementById(
            "editUserName"
        ).value;

    const email =
        document.getElementById(
            "editUserEmail"
        ).value;

    const res = await fetch(
        `${BASE_URL}/update-user/${id}`,
        {

            method: "PUT",

            headers: {
                "Content-Type":
                    "application/json",

                "Authorization":
                    "Bearer " + getToken()
            },

            body: JSON.stringify({
                name,
                email
            })
        }
    );

    const data = await res.json();

    if (res.ok) {

        closeEditModal();

        showToast("User updated successfully");

        getUsers();

    } else {

        showToast(data.error,"error");
    }
}
function toggleUserSearch() {
    const input = document.getElementById("userSearch");

    if (userSearchVisible) {
        input.style.display = "none";
        userSearchVisible = false;
    } else {
        input.style.display = "inline-block";
        input.focus();
        userSearchVisible = true;
    }
}

function clearUserSearch() {
    const input = document.getElementById("userSearch");
    input.value = "";
    input.style.display = "none";
    userSearchVisible = false;

    renderUsers(allUsers); // reset table
}
document.addEventListener("input", function(e) {
    if (e.target.id === "userSearch") {
        const search = e.target.value.toLowerCase();

        const filtered = allUsers.filter(user =>
            user.name.toLowerCase().includes(search) ||
            user.email.toLowerCase().includes(search) ||
            user.role.toLowerCase().includes(search)
        );

        renderUsers(filtered);
    }
});
// VIEW ROLES
async function getRoles() {
    console.log("Button clicked");

    const res = await fetch(`${BASE_URL}/roles`, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + getToken()
        }
    });
allRoles = await res.json();
    renderRoles(allRoles);
}
   
function renderRoles(roles) {

    const tableBody = document.querySelector("#roleTable tbody");

    tableBody.innerHTML = "";

    // ✅ no roles
    if (roles.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align:center;">
                    No roles found
                </td>
            </tr>
        `;

        return;
    }

    roles.forEach(role => {

        const row = `
            <tr>

                <td>${role.id}</td>

                <td>${role.role_name}</td>

                <td>

    ${
        currentPermissions.can_delete
        ?
        `<button onclick="
            openDeleteModal(
                ${role.id},
                'role'
            )
        ">
            🗑 Delete
        </button>`
        :
        ""
    }

</td>

            </tr>
        `;

        tableBody.innerHTML += row;
    });
}


function toggleRoleSearch() {
    const input = document.getElementById("roleSearch");

    if (roleSearchVisible) {
        input.style.display = "none";
        roleSearchVisible = false;
    } else {
        input.style.display = "inline-block";
        input.focus();
        roleSearchVisible = true;
    }
}

function clearRoleSearch() {
    const input = document.getElementById("roleSearch");
    input.value = "";
    input.style.display = "none";
    roleSearchVisible = false;

    renderRoles(allRoles); // reset table
}
document.addEventListener("input", function(e) {
    if (e.target.id === "roleSearch") {
        const search = e.target.value.toLowerCase();

        const filtered = allRoles.filter(role =>
            role.role_name.toLowerCase().includes(search)
        );

        renderRoles(filtered);
    }
});
  

// TOGGLE USERS
async function toggleUsers() {

    const usersSection =
        document.getElementById("usersSection");

    const rolesSection =
        document.getElementById("rolesSection");

    const permissionsSection =
        document.getElementById("permissionsSection");

    const defaultMessage =
        document.getElementById("defaultMessage");

    if (usersVisible) {

        usersSection.style.display = "none";

        defaultMessage.style.display = "block";

        usersVisible = false;

        return;
    }

    defaultMessage.style.display = "none";

    usersSection.style.display = "block";

    rolesSection.style.display = "none";

    permissionsSection.style.display = "none";

    usersVisible = true;

    rolesVisible = false;

    permissionsVisible = false;

    await getUsers();
}

// TOGGLE ROLES
async function toggleRoles() {

    const usersSection =
        document.getElementById("usersSection");

    const rolesSection =
        document.getElementById("rolesSection");

    const permissionsSection =
        document.getElementById("permissionsSection");

    const defaultMessage =
        document.getElementById("defaultMessage");

    if (rolesVisible) {

        rolesSection.style.display = "none";

        defaultMessage.style.display = "block";

        rolesVisible = false;

        return;
    }

    defaultMessage.style.display = "none";

    rolesSection.style.display = "block";

    usersSection.style.display = "none";

    permissionsSection.style.display = "none";

    rolesVisible = true;

    usersVisible = false;

    permissionsVisible = false;

    await getRoles();
}
// ADD USER
async function addUser() {

    const name =
        document.getElementById(
            "userName"
        ).value;

    const email =
        document.getElementById(
            "userEmail"
        ).value;

    const password =
        document.getElementById(
            "userPassword"
        ).value;

    const role_id =
        document.getElementById(
            "userRoleId"
        ).value;

    // VALIDATION

    if (!name || !email ||
        !password || !role_id) {

        showToast(
            "Please fill all fields",
            "error"
        );

        return;
    }

    const res = await fetch(
        `${BASE_URL}/register`,
        {

            method: "POST",

            headers: {
                "Content-Type":
                    "application/json",

                "Authorization":
                    "Bearer " + getToken()
            },

            body: JSON.stringify({
                name,
                email,
                password,
                role_id
            })
        }
    );

    const data = await res.json();

    if (res.ok) {

        showToast(
            "User added successfully"
        );

        // CLEAR FORM
        document.getElementById(
            "userName"
        ).value = "";

        document.getElementById(
            "userEmail"
        ).value = "";

        document.getElementById(
            "userPassword"
        ).value = "";

        document.getElementById(
            "userRoleId"
        ).value = "";

        getUsers();
        loadDashboardStats();

    } else {

        showToast(
            data.error,
            "error"
        );
    }
}

// ADD ROLE
async function addRole() {

    const roleName = document.getElementById("roleName").value;
    if (!roleName.trim()) {
    showToast("Role name cannot be empty","error");
    return;
}

    const res = await fetch(`${BASE_URL}/add-roles`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + getToken()
        },

        body: JSON.stringify({
            roles: [roleName]
        })
    });

    const data = await res.json();

    if (res.ok) {

        showToast("Role added successfully");
        loadRolesDropdown();

        document.getElementById("roleName").value = "";

        getRoles();
        loadRolesDropdown();
        loadDashboardStats();

    } else {

        showToast(data.error || "Error adding role");
    }
}

async function loadMyPermissions() {

    const res = await fetch(
        `${BASE_URL}/my-permissions`,
        {
            method: "GET",

            headers: {
                "Authorization":
                    "Bearer " + getToken()
            }
        }
    );

    const data = await res.json();

    // SAVE GLOBALLY
    currentPermissions = data;

    // APPLY FRONTEND RBAC
    applyPermissions();
}
function applyPermissions() {

    // =========================
    // WRITE PERMISSION
    // =========================

    if (!currentPermissions.can_write) {

        // HIDE ADD USER FORM
        const userForm =
            document.querySelector(
                "#usersSection .form-box"
            );

        if (userForm) {
            userForm.style.display = "none";
        }

        // HIDE ADD ROLE FORM
        const roleForm =
            document.querySelector(
                "#rolesSection .form-box"
            );

        if (roleForm) {
            roleForm.style.display = "none";
        }
    }

    // =========================
    // DELETE PERMISSION
    // =========================

    if (!currentPermissions.can_delete) {

    // HIDE SIDEBAR BUTTON
    const permissionBtn =
        document.querySelector(
            'button[onclick="togglePermissions()"]'
        );

    if (permissionBtn) {
        permissionBtn.style.display = "none";
    }

    // HIDE PERMISSION SECTION
    const permissionsSection =
        document.getElementById(
            "permissionsSection"
        );

    if (permissionsSection) {
        permissionsSection.style.display = "none";
    }

    // HIDE PERMISSION STATS CARD
    const permissionStatCard =
        document.getElementById(
            "permissionStatCard"
        );

    if (permissionStatCard) {
        permissionStatCard.style.display = "none";
    }
}
}
async function togglePermissions() {

    const usersSection =
        document.getElementById("usersSection");

    const rolesSection =
        document.getElementById("rolesSection");

    const permissionsSection =
        document.getElementById("permissionsSection");

    const defaultMessage =
        document.getElementById("defaultMessage");

    // COLLAPSE IF ALREADY OPEN
    if (permissionsVisible) {

        permissionsSection.style.display = "none";

        defaultMessage.style.display = "block";

        permissionsVisible = false;

        return;
    }

    // HIDE OTHER SECTIONS
    usersSection.style.display = "none";

    rolesSection.style.display = "none";

    // SHOW ONLY PERMISSIONS
    permissionsSection.style.display = "block";

    defaultMessage.style.display = "none";

    // RESET OTHER STATES
    usersVisible = false;

    rolesVisible = false;

    permissionsVisible = true;

    // LOAD DATA
    await getPermissions();
}
async function getPermissions() {

    const res = await fetch(
        `${BASE_URL}/permissions`,
        {
            method: "GET",

            headers: {
                "Authorization":
                    "Bearer " + getToken()
            }
        }
    );

    allPermissions = await res.json();

    renderPermissions(allPermissions);
}
function renderPermissions(permissions) {

    const tableBody =
        document.querySelector(
            "#permissionTable tbody"
        );

    tableBody.innerHTML = "";

    if (permissions.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="4"
                    style="text-align:center;">
                    No permissions found
                </td>
            </tr>
        `;

        return;
    }

    permissions.forEach(permission => {

        const row = `
            <tr>

                <td>${permission.role_id}</td>

                <td>
                    ${permission.can_read ? "✅" : "❌"}
                </td>

                <td>
                    ${permission.can_write ? "✅" : "❌"}
                </td>

                <td>
                    ${permission.can_delete ? "✅" : "❌"}
                </td>

            </tr>
        `;

        tableBody.innerHTML += row;
    });
}
async function setPermission() {

    // ✅ DECLARE FIRST
    const role_id =
        document.getElementById(
            "permissionRoleId"
        ).value;

    const can_read =
        document.getElementById(
            "canRead"
        ).checked;

    const can_write =
        document.getElementById(
            "canWrite"
        ).checked;

    const can_delete =
        document.getElementById(
            "canDelete"
        ).checked;

    // ✅ VALIDATE AFTER
    if (!role_id) {

        showToast(
            "Please select a role",
            "error"
        );

        return;
    }

    const res = await fetch(
        `${BASE_URL}/set-permission`,
        {

            method: "POST",

            headers: {
                "Content-Type":
                    "application/json",

                "Authorization":
                    "Bearer " + getToken()
            },

            body: JSON.stringify({
                role_id,
                can_read,
                can_write,
                can_delete
            })
        }
    );

    const data = await res.json();

    if (res.ok) {

        showToast(
            "Permission saved successfully"
        );

        getPermissions();

    } else {

        showToast(
            data.error,
            "error"
        );
    }
}
loadMyPermissions();

function showToast(message, type = "success") {

    const container =
        document.getElementById(
            "toastContainer"
        );

    const toast =
        document.createElement("div");

    toast.classList.add(
        "toast",
        `toast-${type}`
    );

    toast.innerText = message;

    container.appendChild(toast);

    // REMOVE AFTER 3.5 SEC
    setTimeout(() => {
        toast.remove();
    }, 3500);
}
// OPEN DELETE MODAL
function openDeleteModal(id, type) {

    document.getElementById(
        "deleteId"
    ).value = id;

    document.getElementById(
        "deleteType"
    ).value = type;

    const message =
        document.getElementById(
            "deleteMessage"
        );

    message.innerText =
        `Are you sure you want to delete this ${type}?`;

    document.getElementById(
        "deleteModal"
    ).style.display = "block";
}

// CLOSE DELETE MODAL
function closeDeleteModal() {

    document.getElementById(
        "deleteModal"
    ).style.display = "none";
}

// CONFIRM DELETE
async function confirmDelete() {

    const id =
        document.getElementById(
            "deleteId"
        ).value;

    const type =
        document.getElementById(
            "deleteType"
        ).value;

    let endpoint = "";

    if (type === "user") {

        endpoint =
            `${BASE_URL}/delete-user/${id}`;

    } else {

        endpoint =
            `${BASE_URL}/delete-role/${id}`;
    }

    const res = await fetch(
        endpoint,
        {

            method: "DELETE",

            headers: {
                "Authorization":
                    "Bearer " + getToken()
            }
        }
    );

    const data = await res.json();

    if (res.ok) {

        showToast(
            `${type} deleted successfully`
        );

        closeDeleteModal();

        if (type === "user") {

            getUsers();
            loadDashboardStats();

        } else {

            getRoles();
            loadRolesDropdown();
            loadDashboardStats();
        }

    } else {

        showToast(data.error, "error");
    }
}
async function loadDashboardStats() {

    // USERS
    const usersRes = await fetch(
        `${BASE_URL}/users`,
        {
            headers: {
                "Authorization":
                    "Bearer " + getToken()
            }
        }
    );

    const users = await usersRes.json();

    // ROLES
    const rolesRes = await fetch(
        `${BASE_URL}/roles`,
        {
            headers: {
                "Authorization":
                    "Bearer " + getToken()
            }
        }
    );

    const roles = await rolesRes.json();

    // PERMISSIONS
    const permissionsRes = await fetch(
        `${BASE_URL}/permissions`,
        {
            headers: {
                "Authorization":
                    "Bearer " + getToken()
            }
        }
    );

    const permissions =
        await permissionsRes.json();

    // UPDATE UI

    document.getElementById(
        "totalUsers"
    ).innerText = users.length;

    document.getElementById(
        "totalRoles"
    ).innerText = roles.length;

    document.getElementById(
        "totalPermissions"
    ).innerText =
        permissions.length;
}
async function loadRolesDropdown() {

    const res = await fetch(
        `${BASE_URL}/roles`,
        {
            headers: {
                "Authorization":
                    "Bearer " + getToken()
            }
        }
    );

    const roles = await res.json();

    // USER DROPDOWN
    const userRoleDropdown =
        document.getElementById(
            "userRoleId"
        );

    // PERMISSION DROPDOWN
    const permissionDropdown =
        document.getElementById(
            "permissionRoleId"
        );

    // RESET OPTIONS
    userRoleDropdown.innerHTML =
        `<option value="">
            Select Role
        </option>`;

    permissionDropdown.innerHTML =
        `<option value="">
            Select Role
        </option>`;

    // ADD ROLES
    roles.forEach(role => {

        userRoleDropdown.innerHTML += `
            <option value="${role.id}">
                ${role.role_name}
            </option>
        `;

        permissionDropdown.innerHTML += `
            <option value="${role.id}">
                ${role.role_name}
            </option>
        `;
    });
}
loadRolesDropdown();
loadMyPermissions();
loadDashboardStats();