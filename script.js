
let jobs = JSON.parse(localStorage.getItem("jobs")) || [];

const form = document.getElementById("jobForm");

const company = document.getElementById("company");
const role = document.getElementById("role");
const date = document.getElementById("date");
const status = document.getElementById("status");

const interviewDate = document.getElementById("interviewDate");
const interviewRound = document.getElementById("interviewRound");
const interviewMode = document.getElementById("interviewMode");
const interviewStatus = document.getElementById("interviewStatus");
const notes = document.getElementById("notes");

const jobList = document.getElementById("jobList");
const search = document.getElementById("search");
const filterStatus = document.getElementById("filterStatus");
const followUpDate = document.getElementById("followUpDate");
const sortDate = document.getElementById("sortDate");

const editId = document.getElementById("editId");
const cancelBtn = document.getElementById("cancelBtn");

function saveJobs() {
    localStorage.setItem("jobs", JSON.stringify(jobs));
}

form.addEventListener("submit", function(event) {

    event.preventDefault();

    const jobData = {
        company: company.value.trim(),
        role: role.value.trim(),
        date: date.value,
        status: status.value,
        interviewDate: interviewDate.value,
        interviewRound: interviewRound.value,
        interviewMode: interviewMode.value,
        interviewStatus: interviewStatus.value,
        notes: notes.value.trim(),
        followUpDate: followUpDate.value
    };

    if (editId.value) {

        const job = jobs.find(job => job.id === Number(editId.value));

        if (!job) return;

        Object.assign(job, jobData);

    } else {

        jobs.push({
            id: Date.now(),
            ...jobData
        });
    }

    saveJobs();
    displayJobs();
    resetForm();
});

function displayJobs() {

    jobList.innerHTML = "";

    const searchValue = search.value.toLowerCase();
    const selectedStatus = filterStatus.value;

    const filteredJobs = jobs.filter(job => {

        const matchesSearch =
            job.company.toLowerCase().includes(searchValue) ||
            job.role.toLowerCase().includes(searchValue);

        const matchesStatus =
            selectedStatus === "All" ||
            job.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });
    const sortedJobs = [...filteredJobs].sort((a, b) => {

    if (sortDate.value === "newest") {
        return new Date(b.date) - new Date(a.date);
    }

    return new Date(a.date) - new Date(b.date);
});
    document.getElementById("emptyMessage").style.display =
        filteredJobs.length === 0 ? "block" : "none";

    sortedJobs.forEach(job => {

        const row = document.createElement("tr");

        const today = new Date();

        const todayDate = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, "0"),
            String(today.getDate()).padStart(2, "0")
        ].join("-");

        if (
            job.followUpDate &&
            job.followUpDate < todayDate &&
            job.status !== "Selected" &&
            job.status !== "Rejected"
        ) {
            row.classList.add("overdue");
        }

        const values = [
            job.company,
            job.role,
            job.date,
            job.status,
            job.interviewDate || "-",
            job.interviewRound || "-",
            job.interviewMode || "-",
            job.interviewStatus || "-",
            job.followUpDate || "-",
            job.notes || "-"
            
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const actionCell = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.className = "edit-btn";
        editButton.addEventListener("click", () => editJob(job.id));

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";
        deleteButton.addEventListener("click", () => deleteJob(job.id));

        const actions = document.createElement("div");
        actions.className = "actions";

        actions.append(editButton, deleteButton);
        actionCell.appendChild(actions);
        row.appendChild(actionCell);

        jobList.appendChild(row);
    });

    updateStats();
}

function editJob(id) {

    const job = jobs.find(job => job.id === id);

    if (!job) return;

    company.value = job.company;
    role.value = job.role;
    date.value = job.date;
    status.value = job.status;

    interviewDate.value = job.interviewDate || "";
    interviewRound.value = job.interviewRound || "";
    interviewMode.value = job.interviewMode || "";
    interviewStatus.value = job.interviewStatus || "";
    notes.value = job.notes || "";
    followUpDate.value = job.followUpDate || "";

    editId.value = job.id;
    
    document.getElementById("formTitle").innerText =
        "Edit Job Application";

    document.getElementById("submitBtn").innerText =
        "Update Application";

    cancelBtn.hidden = false;

    form.scrollIntoView({ behavior: "smooth" });
}

function deleteJob(id) {

    if (!confirm("Are you sure you want to delete this application?")) {
        return;
    }

    jobs = jobs.filter(job => job.id !== id);

    saveJobs();
    displayJobs();

    if (Number(editId.value) === id) {
        resetForm();
    }
}

function resetForm() {

    form.reset();
    editId.value = "";

    document.getElementById("formTitle").innerText =
        "Add Job Application";

    document.getElementById("submitBtn").innerText =
        "Add Application";

    cancelBtn.hidden = true;
}

cancelBtn.addEventListener("click", resetForm);

function updateStats() {

    document.getElementById("total").innerText = jobs.length;

    document.getElementById("applied").innerText =
        jobs.filter(job => job.status === "Applied").length;

    document.getElementById("interviews").innerText =
        jobs.filter(job => job.status === "Interview").length;

    document.getElementById("selected").innerText =
        jobs.filter(job => job.status === "Selected").length;

    const pending = jobs.filter(job =>
        job.followUpDate &&
        job.status !== "Selected" &&
        job.status !== "Rejected"
    ).length;

    document.getElementById("followUps").innerText = pending;
}

search.addEventListener("input", displayJobs);
filterStatus.addEventListener("change", displayJobs);

document.getElementById("exportBtn").addEventListener("click", function() {

    if (jobs.length === 0) {
        alert("No applications to export!");
        return;
    }

    const headers = [
        "Company", "Role", "Applied Date", "Status",
        "Interview Date", "Round", "Mode",
        "Interview Status", "Notes"
    ];

    const escapeCSV = value =>
        `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = jobs.map(job => [
        job.company,
        job.role,
        job.date,
        job.status,
        job.interviewDate,
        job.interviewRound,
        job.interviewMode,
        job.interviewStatus,
        job.notes
    ]);

    const csv = [
        headers.map(escapeCSV).join(","),
        ...rows.map(row => row.map(escapeCSV).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "JobTrack_Applications.csv";

    link.click();

    URL.revokeObjectURL(url);
});

displayJobs();
sortDate.addEventListener("change", displayJobs);