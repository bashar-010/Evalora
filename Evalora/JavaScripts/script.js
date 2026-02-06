document.addEventListener("DOMContentLoaded", () => {
    
    const navLinks = document.querySelectorAll(".navbar-center a");

    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            navLinks.forEach(l => l.classList.remove("active"));
            link.classList.add("active");
        });
    });

});

document.addEventListener("DOMContentLoaded", () => {

    const inputs = document.querySelectorAll(".otp-input");

    inputs.forEach((input, index) => {

        input.addEventListener("input", (e) => {
            // امنع أي شيء غير رقم
            e.target.value = e.target.value.replace(/[^0-9]/g, '');

            // انتقال تلقائي للخانة التالية
            if (input.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        input.addEventListener("keydown", (e) => {
            // رجوع للخلف عند Backspace
            if (e.key === "Backspace" && index > 0 && !input.value) {
                inputs[index - 1].focus();
            }
        });

    });

});