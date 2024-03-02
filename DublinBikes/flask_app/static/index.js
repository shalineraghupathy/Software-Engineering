// Ensure initMap() is called after the page loads
function initMap() {
  var dublin = { lat: 53.349805, lng: -6.26031 };
  var map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: dublin,
  });

  var marker = new google.maps.Marker({
    position: dublin,
    map: map,
    title: "Dublin",
  });
}

// Assuming you have a button for displaying the map
document.querySelector(".clickMap").addEventListener("click", function () {
  var mapContainer = document.getElementById("mapContainer");
  var chartsDropdown = document.querySelector(".charts-dropdown");

  mapContainer.style.display = "block";
  mapContainer.style.visibility = "visible";
  chartsDropdown.style.display = "block"; // Display the charts dropdown menu
  initMap(); // Initialize the map
});

document.addEventListener('DOMContentLoaded', function() {
  var toggleBtn = document.getElementById('toggleNav');
  var navbar = document.querySelector('.navbar');
  var mapContainer = document.getElementById('mapContainer');

  toggleBtn.addEventListener('click', function() {
    navbar.classList.toggle('hidden');
    mapContainer.classList.toggle('fullwidth');
  });
});
