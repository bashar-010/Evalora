// =====================
// POPUPS: REGISTER OPTIONS + COMPANY
// =====================

// فتح popup تبع اختيار نوع الحساب
function openRegisterPopup() {
  const popup = document.getElementById("registerPopup");
  if (popup) popup.style.display = "flex";
}

// إغلاق popup تبع اختيار نوع الحساب
function closeRegisterPopup() {
  const popup = document.getElementById("registerPopup");
  if (popup) popup.style.display = "none";
}

// فتح popup تبع الشركة
function openCompanyPopup() {
  const popup = document.getElementById("companyPopup");
  if (popup) popup.style.display = "flex";
}

// إغلاق popup تبع الشركة
function closeCompanyPopup() {
  const popup = document.getElementById("companyPopup");
  if (popup) popup.style.display = "none";
}

// =====================
// TOAST MESSAGE
// =====================
function showCompanyToast() {
  const toast = document.getElementById("companyToast");
  if (!toast) return;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// =====================
// HANDLE COMPANY SUBMIT
// =====================
document.addEventListener("DOMContentLoaded", () => {
  const companyForm = document.getElementById("companyForm"); // لو عندك form
  const companySubmitBtn = document.querySelector(".submit-company-btn");

  if (companySubmitBtn) {
    companySubmitBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const name = document.getElementById("compName").value.trim();
      const email = document.getElementById("compEmail").value.trim();
      const password = document.getElementById("compPassword").value;
      const confirmPassword = document.getElementById("compConfirmPassword").value;
      const website = document.getElementById("compWebsite").value.trim();
      const contactPerson = document.getElementById("compPerson").value.trim();

      if (!name || !email || !password || !confirmPassword) {
        alert("Please fill in all required fields (Name, Email, Password).");
        return;
      }

      if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }

      try {
        const userData = {
          name,
          email,
          password,
          accountType: "company",
          website,
          contactPerson
        };

        const response = await window.api.register(userData);

        // Success
        if (companyForm) companyForm.reset();
        closeCompanyPopup();
        closeRegisterPopup();
        showCompanyToast();

      } catch (error) {
        console.error("Registration failed:", error);
        alert(error.message || "Registration failed. Please try again.");
      }
    });
  }

  // إغلاق أي popup لما نكبس برا الصندوق
  document.querySelectorAll(".popup-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.style.display = "none";
      }
    });
  });
});
