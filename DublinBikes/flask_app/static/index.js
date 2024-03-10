// 确保在页面加载后调用 initMap()
function initMap() {
  var dublin = { lat: 53.349805, lng: -6.26031 };
  var map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: dublin,
  })

  fetch("/stations_data")
  .then(response => {
    if (!response.ok){
      throw new Error("Network response was not okay");
    }
    return response.json();
  })
    .then(data => {
      console.log("Station data from /stations_data:", data);
      for (let i=0;i<data.length;i++){
        const marker = data[i];

        const marker_content=
        "<h1>" + marker.name +"</h1>" +
        "<p> bike stands: " + marker.bike_stands + "</p>";

        const infowindow= new google.maps.InfoWindow({
          content: marker_content,
        });

        const icon={
          url:"../static/cycle.png",
          scaledSize: new google.maps.Size(50,50)
        };
        const new_marker= new google.maps.Marker({
            position: {lat:marker.position_lat, lng:marker.position_long},
            map: map,
            title: marker.address,
            icon:icon
          });
        
        new_marker.addListener("click", () => {
          infowindow.open({
            anchor: new_marker,
            map: map
          })
        });
        
        
        
        
      }
  })
    .catch (error=>{
      console.log("There was an error with the fetch operation", error);
  });
  document.querySelector(".clickMap").addEventListener("click", function () {
    var mapContainer = document.getElementById("mapContainer");
    var chartsDropdown = document.querySelector(".charts-dropdown");
  
    mapContainer.style.display = "block";
    mapContainer.style.visibility = "visible";
    chartsDropdown.style.display = "block"; // 显示图表下拉菜单
    
  })
  
};

  

// 假设您有一个按钮用于显示地图
