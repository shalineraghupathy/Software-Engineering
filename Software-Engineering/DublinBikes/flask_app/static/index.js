// Ensure initMap() is called after the page has loaded
function initMap() {
  var dublin = { lat: 53.349805, lng: -6.26031 }; // Coordinates for Dublin
  var map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14, // Initial zoom level
    center: dublin, // Center the map on Dublin
  });

  var marker = new google.maps.Marker({
    position: dublin, // Position the marker at Dublin's coordinates
    map: map,
    title: "Dublin", // Title that appears when hovering over the marker
  });
}

// Assuming you have a button to display the map
document.querySelector(".clickMap").addEventListener("click", function () {
  var mapContainer = document.getElementById("mapContainer");
  var chartsDropdown = document.querySelector(".charts-dropdown");

  // Display the map container
  mapContainer.style.display = "block";
  mapContainer.style.visibility = "visible";
  // Display the charts dropdown menu
  chartsDropdown.style.display = "block";
  // Initialize the map
  initMap();
});

// Event listener for when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  var toggleBtn = document.getElementById('toggleNav');
  var navbar = document.querySelector('.navbar');
  var mapContainer = document.getElementById('mapContainer');

  // Add a click event listener to the toggle button
  toggleBtn.addEventListener('click', function() {
    // Toggle the 'hidden' class on the navbar
    navbar.classList.toggle('hidden');
    // Toggle the 'fullwidth' class on the map container
    mapContainer.classList.toggle('fullwidth');
  });
});