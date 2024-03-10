let map; // 全局地图实例
let markers = []; // 保存所有标记的数组

function initMap() {
    var dublin = { lat: 53.349805, lng: -6.26031 };
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: dublin,
    });

    // 初始化地图时加载所有站点
    fetchStationsAndAddMarkers('');
}

function fetchStationsAndAddMarkers(searchTerm) {
    let url = '/api/search-stations?term=';
    if (searchTerm) {
        url += encodeURIComponent(searchTerm);
    }
    fetch(url)
        .then(response => response.json())
        .then(data => {
            displayStations(data.stations);
        })
        .catch(error => console.error('Error fetching stations:', error));
}

function displayStations(stations) {
    clearMarkers(); // 清除现有的所有标记
    stations.forEach(station => {
        const marker = new google.maps.Marker({
            position: { lat: station.position_lat, lng: station.position_long },
            map: map,
            title: station.name,
        });

        // 为每个标记添加点击事件，以显示站点详细信息
        marker.addListener('click', () => {
            showStationInfo(station);
        });

        markers.push(marker); // 将标记添加到数组中
    });

    isFilteredView = false; // 重置过滤视图状态
}

function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

function showStationInfo(station) {
    var stationInfoDiv = document.getElementById('stationInfo');
    stationInfoDiv.innerHTML = `
        <h4>${station.name}</h4>
        <p>Address: ${station.address}</p>
        <p>Bike Stands: ${station.bike_stands}</p>
        <p>Available Bikes: ${station.available_bikes || '...'}</p>`;
    stationInfoDiv.classList.remove('hidden');
}

document.getElementById('free-bikes-btn').addEventListener('click', function() {
    if (isFilteredView) {
        fetchStationsAndAddMarkers(''); // 恢复显示所有站点
    } else {
        fetchStationsAndAddMarkers('free-bikes'); // 显示有空闲自行车的站点
    }

    fetch('/api/free-bikes')
    .then(response => response.json())
    .then(data => {
      updateMarkerIcons(markers, data); // 更新标记图标
      displayStations(data.stations);
    })
    .catch(error => console.error('Error fetching free bikes:', error));
});

document.getElementById('free-stands-btn').addEventListener('click', function() {
    if (isFilteredView) {
        fetchStationsAndAddMarkers(''); // 恢复显示所有站点
    } else {
        fetchStationsAndAddMarkers('free-stands'); // 显示有空闲停车位的站点
    }

    fetch('/api/free-stations')
    .then(response => response.json())
    .then(data => {
      updateMarkerIcons(markers, data); // 更新标记图标
      displayStations(data.stations);
    })
    .catch(error => console.error('Error fetching free stands:', error));
});

document.getElementById('searchButton').addEventListener('click', function() {
    var searchTerm = document.getElementById('searchInput').value;
    fetchStationsAndAddMarkers(searchTerm); // 根据搜索词重新加载站点标记
});

document.addEventListener('DOMContentLoaded', function() {
    initMap();
    updateWeatherInfo();
});

// 添加点击事件监听器以隐藏navbar
var toggleBtn = document.getElementById('toggleNav');
var navbar = document.querySelector('.navbar');
var mapContainer = document.getElementById('mapContainer');

toggleBtn.addEventListener('click', function() {
    navbar.classList.toggle('hidden');
    mapContainer.classList.toggle('fullwidth');
});

function updateWeatherInfo() {
    fetch('/api/weather')
        .then(response => response.json())
        .then(data => {
            const weatherDiv = document.getElementById('weatherInfo');
            const iconUrl = `http://openweathermap.org/img/wn/${data.weather_icon}.png`;
            weatherDiv.innerHTML = `<img src="${iconUrl}" alt="Weather Icon" /> <span>${data.weather_description}, ${data.temperature}°C</span>`;
        })
        .catch(error => {
            console.error('Error fetching weather:', error);
            document.getElementById('weatherInfo').innerHTML = 'Failed to load weather data';
        });
}


// 加载静态站点信息
function fetchStaticStations() {
    fetch('/api/stations')
        .then(response => response.json())
        .then(data => {
            displayStations(data.stations);
        })
        .catch(error => console.error('Error fetching static stations:', error));
}

// 加载动态站点可用性信息
function fetchAvailabilities() {
    fetch('/api/availabilities')
        .then(response => response.json())
        .then(data => {
            updateStationMarkers(data.availabilities);
        })
        .catch(error => console.error('Error fetching availabilities:', error));
}

// 更新地图上的站点标记以显示动态可用性信息
function updateStationMarkers(availabilities) {
    // 清除现有的所有标记
    clearMarkers();
    // 遍历可用性数据，为每个站点添加新的标记
    availabilities.forEach(availability => {
        const station = markers.find(marker => marker.station.number === availability.number);
        if (station) {
            // 更新标记的描述信息
            station.description = `Available Bikes: ${availability.available_bikes}, Available Stands: ${availability.available_bike_stands}`;
            // 可以在这里添加更多逻辑来更新标记的外观，例如改变颜色或图标
        }
    });
}

// 在页面加载时加载静态站点信息
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    fetchStaticStations(); // 加载静态站点
    // 你可以在这里调用fetchAvailabilities()来加载动态信息，或者提供一个按钮让用户选择何时加载
});

// 添加一个按钮让用户选择加载动态信息
document.getElementById('loadAvailabilities').addEventListener('click', function() {
    fetchAvailabilities();
});

function updateMarkerIcons(markers, availability) {
  markers.forEach(marker => {
    const stationNumber = marker.station.number;
    const availableBikes = availability.find(a => a.number === stationNumber).available_bikes;
    const availableStands = availability.find(a => a.number === stationNumber).available_bike_stands;

    if (availableBikes > 0) {
      // 如果有空闲自行车，更改图标
      marker.setIcon({
        url: '../static/bike_free.png', // 替换为你的空闲自行车图标路径
        scaledSize: new google.maps.Size(32, 32), // 根据需要调整图标大小
      });
    } else if (availableStands > 0) {
      // 如果有空闲停车位，更改图标
      marker.setIcon({
        url: '../static/no_station.png', // 替换为你的空闲停车位图标路径
        scaledSize: new google.maps.Size(32, 32), // 根据需要调整图标大小
      });
    } else {
      // 如果没有空闲自行车或停车位，使用默认图标
      marker.setIcon({
        url: '../static/no_bike.png', // 替换为你的默认图标路径
        scaledSize: new google.maps.Size(32, 32), // 根据需要调整图标大小
      });
    }
  });
}






