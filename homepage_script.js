const currentUser = localStorage.getItem("currentUser");

if (!currentUser) {
  alert("Unauthorized access! Please login first.");
  window.location.href = "index.html";
}
// ===== GLOBAL STATE =====
let files = [];

async function loadFiles() {
  const response = await fetch(`http://localhost:3000/api/files/${currentUser}`);
  const data = await response.json();

  if (data.success) {
    files = data.files;
    renderTable();
  }
}
let sortAsc = true;

// ===== ELEMENTS =====
const fileInput = document.getElementById("fileInput");
const tableBody = document.getElementById("tableBody");
const tableWrapper = document.getElementById("tableWrapper");
const controls = document.getElementById("controls");
const searchInput = document.getElementById("searchInput");

// ===== UPLOAD BUTTON =====
function triggerUpload() {
  fileInput.click();
}

// ===== FILE INPUT =====
fileInput.addEventListener("change", async function () {
  const file = fileInput.files[0];
  if (!file) return;

  const allowedTypes = [

  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",

  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",

  "video/mp4",
  "video/webm",
  "video/ogg"
];

  if (!allowedTypes.includes(file.type)) {
    alert("Only .pdf, .docx, .txt, .csv, images(.jpeg, .png, .gif, .webp) and video(.mp4, .webm, .ogg) files are allowed!");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("username", currentUser);

  try {
    const response = await fetch("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      loadFiles();
    } else {
      alert("Upload failed");
    }
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
});

// ===== RENDER TABLE =====
function renderTable(filteredFiles = files) {
  tableBody.innerHTML = "";

  filteredFiles.forEach((file, index) => {

    const dateObj = new Date(file.uploaded_at);

    const row = `
      <tr>
        <td>${index + 1}</td>
        <td>${file.file_name}</td>
        <td>${dateObj.toLocaleDateString()}</td>
        <td>${dateObj.toLocaleTimeString()}</td>
        <td>
          <button onclick="previewFile(${index})" class="btn small">Preview</button>
          <button onclick="downloadFile(${index})" class="btn small">Download</button>
          <button onclick="deleteFile(${index})" class="btn small danger">Delete</button>
        </td>
      </tr>
    `;

    tableBody.innerHTML += row;
  });

  if (files.length > 0) {
    tableWrapper.classList.remove("hidden");
    controls.classList.remove("hidden");
  } else {
    tableWrapper.classList.add("hidden");
    controls.classList.add("hidden");
  }
}

// ===== DOWNLOAD FILE =====
async function downloadFile(index) {
  const file = files[index];
  const username = localStorage.getItem("currentUser");

  try {
    const response = await fetch(
  `http://localhost:3000/api/file/download/${file.id}?username=${username}&mode=download`
);

    if (!response.ok) {
      throw new Error("Download failed");
    }

    const blob = await response.blob();

    
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = file.file_name;
    document.body.appendChild(a);
    a.click();

    
    a.remove();
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error(error);
    alert("Download failed");
  }
}

// ===== DELETE FILE =====
async function deleteFile(index) {
  const file = files[index];
  const confirmDelete = confirm("Are you sure you want to delete this file?");
  if (!confirmDelete) return;

  const username = localStorage.getItem("currentUser");

  try {
    const response = await fetch(
      `http://localhost:3000/api/file/${file.id}?username=${username}`,
      {
        method: "DELETE"
      }
    );

    const result = await response.json();

    if (result.success) {
      loadFiles(); // refresh table
    } else {
      alert(result.message || "Delete failed");
    }

  } catch (error) {
    console.error(error);
    alert("Error deleting file");
  }
}
// ===== SEARCH =====
searchInput.addEventListener("input", function () {
  const query = this.value.toLowerCase();

  const filtered = files.filter(file =>
    file.file_name.toLowerCase().includes(query)
  );

  renderTable(filtered);
});

// ===== SORT =====
function sortFiles() {
  files.sort((a, b) => {
    return sortAsc
      ? a.file_name.localeCompare(b.file_name)
      : b.file_name.localeCompare(a.file_name);
  });

  sortAsc = !sortAsc;
  renderTable();
}

// ===== PROFILE DATA =====
function loadProfile() {
  const user = JSON.parse(localStorage.getItem("userData"));

  if (!user) return;

  document.getElementById("profileName").textContent = user.fullName;
  document.getElementById("profileUsername").textContent = user.username;
  document.getElementById("profileEmail").textContent = user.email;

  if (user.phone) {
    document.getElementById("profilePhone").textContent = user.phone;
  } else {
    document.getElementById("profilePhone").textContent = "Not Added";
    document.getElementById("addPhoneBtn").classList.remove("hidden");
  }
}

// ===== ADD PHONE =====
document.getElementById("addPhoneBtn").addEventListener("click", () => {
  const phone = prompt("Enter your mobile number:");
  if (!phone) return;

  const user = JSON.parse(localStorage.getItem("user")) || {};
  user.phone = phone;

  localStorage.setItem("user", JSON.stringify(user));
  loadProfile();
});

// previous cod
function toggleProfile() {
    const panel = document.getElementById('profilePanel');
    const user = JSON.parse(localStorage.getItem('userData'));

    panel.classList.toggle('hidden');

    if (!panel.classList.contains('hidden')) {

        document.getElementById('profileName').textContent = user.fullName;
        document.getElementById('profileUsername').textContent = user.username;
        document.getElementById('profileEmail').textContent = user.email;

        if (user.phone && user.phone.trim() !== '') {
            document.getElementById('profilePhone').textContent = user.phone;
            document.getElementById('addPhoneBtn').classList.add('hidden');
        } else {
            document.getElementById('profilePhone').textContent = 'Not Given';
            document.getElementById('addPhoneBtn').classList.remove('hidden');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {

    const profileBtn = document.getElementById('profileBtn');

    profileBtn.addEventListener('click', toggleProfile);

});
//preview
function previewFile(index) {
  const file = files[index];

  console.log("Previewing file:", file); 

  if (!file.id) {
    alert("File ID missing. Check backend response.");
    return;
  }

  const pdfViewer = document.getElementById("pdfViewer");
  const imageViewer = document.getElementById("imageViewer");
  const videoViewer = document.getElementById("videoViewer");
  const modal = document.getElementById("pdfModal");

  const username = localStorage.getItem("currentUser");

  const fileUrl = `http://localhost:3000/api/file/preview/${file.id}?username=${username}`;

  pdfViewer.style.display = "none";
  imageViewer.style.display = "none";
  videoViewer.style.display = "none";

  if (file.file_type.startsWith("image")) {
    imageViewer.src = fileUrl;
    imageViewer.style.display = "block";
  } 
  else if (file.file_type.startsWith("video")) {
    videoViewer.src = fileUrl;
    videoViewer.style.display = "block";
  } 
  else if (file.file_type === "application/pdf") {
    pdfViewer.src = fileUrl;
    pdfViewer.style.display = "block";
  } 
  else {
    alert("Preview not supported");
    return;
  }

  modal.classList.remove("hidden");
}

function closePDF() {
  const modal = document.getElementById("pdfModal");
  const pdfViewer = document.getElementById("pdfViewer");
  const imageViewer = document.getElementById("imageViewer");
  const videoViewer = document.getElementById("videoViewer");

  modal.classList.add("hidden");  
  pdfViewer.src = "";
  imageViewer.src = "";
  videoViewer.src = "";              // clear file
  videoViewer.pause();
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  window.onload = () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  if (isLoggedIn !== "true") {
    alert("Please login first!");
    window.location.href = "index.html";
    return;
  }

  loadFiles();
  loadProfile();
};
});