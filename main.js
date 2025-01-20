const menuIcon = document.querySelector("#menu-icon");
const navbar = document.querySelector(".navbar");

const cancelIcon = document.querySelector("#cancel-icon");

menuIcon.onclick = () => {
  menuIcon.classList.add("hidden");
  cancelIcon.classList.remove("hidden");
  navbar.classList.toggle("active");
};

cancelIcon.onclick = () => {
  menuIcon.classList.remove("hidden");
  cancelIcon.classList.add("hidden");
  navbar.classList.toggle("active");
};
