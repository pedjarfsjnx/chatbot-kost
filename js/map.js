// 4. Initialize Map & Markers (Leaflet.js)
function initMap() {
    // Center at Surabaya
    map = L.map('map').setView([-7.269, 112.76], 13);
    
    // Dark mode map tiles from CartoDB (free, no key required)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    markersGroup = L.layerGroup().addTo(map);
    renderMapMarkers();
}

function renderMapMarkers() {
    if (!map || !markersGroup) return;
    
    markersGroup.clearLayers();
    
    // Custom color icons for marker types
    const campusIcon = L.divIcon({
        className: 'custom-campus-icon',
        html: `<div style="background-color: var(--accent-blue); color: #fff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);">
            <i class="fa-solid fa-school" style="font-size: 12px;"></i>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });

    // Render campuses
    campusesData.forEach(campus => {
        L.marker([campus.lat, campus.lng], { icon: campusIcon })
            .addTo(markersGroup)
            .bindPopup(`<strong>${campus.name}</strong><br><small>Titik Pusat Kampus</small>`);
    });

    // Render kosts (only those currently matching sidebar filters)
    const filtered = getFilteredKosts();
    filtered.forEach(kost => {
        let color = '#f59e0b'; // Campur
        if (kost.label === 'Putri') color = '#ec4899';
        if (kost.label === 'Putra') color = '#06b6d4';
        
        const kostIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="kost-marker-pin" style="background-color: ${color}; width: 12px; height: 12px; border: 2px solid #fff; border-radius: 50%; box-shadow: 0 0 8px ${color}; transition: all 0.3s;" id="marker-pin-${kost.id}"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });

        const popupContent = `
            <div class="popup-kost">
                <h3>${kost.title}</h3>
                <p><strong>Tipe:</strong> ${kost.label}</p>
                <p><strong>Alamat:</strong> ${kost.address}</p>
                <p class="price">${formatRupiah(kost.price)}</p>
                ${kost.phone ? `<p><i class="fa-solid fa-phone"></i> ${kost.phone}</p>` : ''}
            </div>
        `;

        L.marker([kost.lat, kost.lng], { icon: kostIcon })
            .addTo(markersGroup)
            .bindPopup(popupContent);
    });
}

function focusOnKost(kost) {
    // Switch to Map tab
    document.querySelector('.tab-btn[data-tab="mapTab"]').click();
    
    // Fly to coordinates
    map.flyTo([kost.lat, kost.lng], 16, {
        animate: true,
        duration: 1.5
    });
    
    // Draw route if campus filter is active
    if (filterCampus.value !== 'none') {
        const campus = campusesData.find(c => c.name === filterCampus.value);
        if (campus) {
            drawPathLine([kost.lat, kost.lng], [campus.lat, campus.lng]);
        }
    }

    // Open map marker popup
    setTimeout(() => {
        markersGroup.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                const latlng = layer.getLatLng();
                if (Math.abs(latlng.lat - kost.lat) < 0.0001 && Math.abs(latlng.lng - kost.lng) < 0.0001) {
                    layer.openPopup();
                }
            }
        });
    }, 1600);
}

async function drawPathLine(p1, p2) {
    if (activePolyline) {
        map.removeLayer(activePolyline);
        activePolyline = null;
    }
    
    // Fetch road route from OSRM API (foot profile for walking routes)
    // p1 = [lat, lng], p2 = [lat, lng]. OSRM accepts: Lng,Lat;Lng,Lat
    const url = `https://router.project-osrm.org/route/v1/foot/${p1[1]},${p1[0]};${p2[1]},${p2[0]}?overview=full&geometries=geojson`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes[0]) {
            const geom = data.routes[0].geometry;
            activePolyline = L.geoJSON(geom, {
                style: {
                    color: 'var(--accent-blue)',
                    weight: 4,
                    opacity: 0.85,
                    dashArray: '5, 5'
                }
            }).addTo(map);
        } else {
            drawStraightFallback(p1, p2);
        }
    } catch (error) {
        console.error("OSRM Foot routing API failed, drawing straight fallback:", error);
        drawStraightFallback(p1, p2);
    }
}

function drawStraightFallback(p1, p2) {
    activePolyline = L.polyline([p1, p2], {
        color: 'var(--accent-blue)',
        weight: 3,
        dashArray: '5, 10',
        opacity: 0.8
    }).addTo(map);
}

