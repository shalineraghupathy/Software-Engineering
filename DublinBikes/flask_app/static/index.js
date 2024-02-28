// 确保在页面加载后调用 initMap()
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

// 假设您有一个按钮用于显示地图
document.querySelector(".clickMap").addEventListener("click", function () {
  var mapContainer = document.getElementById("mapContainer");
  var chartsDropdown = document.querySelector(".charts-dropdown");

  mapContainer.style.display = "block";
  mapContainer.style.visibility = "visible";
  chartsDropdown.style.display = "block"; // 显示图表下拉菜单
  initMap(); // 初始化地图
});
