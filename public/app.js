// public/app.js
const createForm = document.getElementById("createForm");
const createBtn = document.getElementById("createBtn");
const formMessage = document.getElementById("formMessage");

function isValidCode(code) {
  return /^[A-Za-z0-9]{6,8}$/.test(code);
}

function isValidURL(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch (e) {
    return false;
  }
}

createForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMessage.textContent = "";
  const target = document.getElementById("target").value.trim();
  const code = document.getElementById("code").value.trim();
  if (!isValidURL(target)) {
    formMessage.textContent = "Enter a valid URL (http/https).";
    formMessage.style.color = "red";
    return;
  }
  if (code && !isValidCode(code)) {
    formMessage.textContent =
      "Custom code must be 6-8 alphanumeric characters.";
    formMessage.style.color = "red";
    return;
  }
  createBtn.disabled = true;
  createBtn.textContent = "Creating...";
  try {
    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, code: code || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      formMessage.textContent = data.error || "Error";
      formMessage.style.color = "red";
    } else {
      formMessage.textContent = "Created! Refreshing...";
      formMessage.style.color = "green";
      setTimeout(() => location.reload(), 800);
    }
  } catch (err) {
    formMessage.textContent = "Network error";
    formMessage.style.color = "red";
  } finally {
    createBtn.disabled = false;
    createBtn.textContent = "Create";
  }
});

// Delete link
document.querySelectorAll(".deleteBtn").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    const code = btn.dataset.code;
    if (!confirm(`Delete code ${code}?`)) return;
    btn.disabled = true;
    btn.textContent = "Deleting...";
    try {
      const res = await fetch(`/api/links/${code}`, { method: "DELETE" });
      if (res.ok) {
        btn.textContent = "Deleted";
        setTimeout(() => location.reload(), 500);
      } else {
        const d = await res.json();
        alert(d.error || "Error deleting");
        btn.disabled = false;
        btn.textContent = "Delete";
      }
    } catch (err) {
      alert("Network error");
      btn.disabled = false;
      btn.textContent = "Delete";
    }
  });
});
