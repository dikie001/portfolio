const menuIcon = document.querySelector("#menu-icon");
const navbar = document.querySelector(".navbar");

menuIcon.onclick = () => {
  menuIcon.classList.toggle("❌hello");
  navbar.classList.toggle("active");
};

function submitMail() {
  clientName = document.getElementById("name").value;
  email = document.getElementById("email").value;
  phoneNumber = document.getElementById("phoneNumber").value;
  message = document.getElementById("message").value;

  console.log(clientName);
  console.log(email);
  console.log(phoneNumber);
  console.log(message);
}
