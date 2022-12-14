if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").then(registration => {
        console.log("SW Registered!");
        console.log(registration);

    }).catch(error => {
        console.log("SW registration failed!");
        console.log(error);
    })
} else {
    console.log("Please upgrade browser!");
}

/* Sidebar and Google Maps related code - Start */
const sidebar = document.getElementById('sidebar');
const savePreferences = document.getElementById('savePreferences');
const burgerMenu = document.getElementById('burgerMenu');

burgerMenu.addEventListener('click', () => {
    sidebar.classList.add('show');
});

savePreferences.addEventListener('click', () => {
    window.sendPredictionData = document.getElementById('sendData').checked;
    localStorage.setItem('sendPredictionData', window.sendPredictionData);
    sidebar.classList.remove('show');
});

window.sendPredictionData = localStorage.getItem('sendPredictionData');

if (window.sendPredictionData === null) {
    sidebar.classList.add('show'); // Open sidebar on pageload, if sendDataPreference is not set (happens only first time)
} else {
    if (window.sendPredictionData === 'true') {
        document.getElementById('sendData').setAttribute('checked', 'checked');
    } else {
        document.getElementById('sendData').removeAttribute('checked');
    }
}

function initAutocomplete() {
    /* Get geolocation */

    const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };

    function success(pos) {
        const {
            latitude: lat,
            longitude: lng,
        } = pos.coords;

        const location = { lat, lng };
        
        const map = new google.maps.Map(
        document.getElementById("map"),
            {
                center: location,
                zoom: 12,
                mapTypeId: "roadmap",
                mapTypeControl: false,
                scaleControl: false,
                streetViewControl: false,
                fullscreenControl: false,
            }
        );
    
        // Create the search box and link it to the UI element.
        const input = document.getElementById("searchText");
        const searchBox = new google.maps.places.SearchBox(input);
    
        // map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    
        // Bias the SearchBox results towards current map's viewport.
        map.addListener("bounds_changed", () => {
            searchBox.setBounds(map.getBounds());
        });
    
        let markers = [];
    
        // Listen for the event fired when the user selects a prediction and retrieve
        // more details for that place.
        searchBox.addListener("places_changed", () => {
            window.resetAddressEntry = true;
            const places = searchBox.getPlaces();
        
            if (places.length == 0) {
                return;
            }
        
            // Clear out the old markers.
            markers.forEach((marker) => {
                marker.setMap(null);
            });
            markers = [];
        
            // For each place, get the icon, name and location.
            const bounds = new google.maps.LatLngBounds();

            places.forEach((place) => {
                window.placeUrl = place.url;
                if (!place.geometry || !place.geometry.location) {
                    console.log("Returned place contains no geometry");
                    return;
                }
        
                const icon = {
                    url: place.icon,
                    size: new google.maps.Size(71, 71),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(17, 34),
                    scaledSize: new google.maps.Size(25, 25),
                };
        
                // Create a marker for each place.
                markers.push(
                    new google.maps.Marker({
                        map,
                        icon,
                        title: place.name,
                        position: place.geometry.location,
                    })
                );
        
                if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
                } else {
                bounds.extend(place.geometry.location);
                }
            });
            map.fitBounds(bounds);
        });
    }

    function error(err) {
        console.warn(`ERROR(${err.code}): ${err.message}`);
    }

    navigator.geolocation.getCurrentPosition(success, error, options);
    /* End of get geolocation */
}
/* Sidebar and Google Maps related code - End */
