// State and Configurations
let kostsData = [];
let campusesData = [];
let map = null;
let markersGroup = null;
let activePolyline = null;
let localEngineMode = true; // Default to Local NLP

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const btnSend = document.getElementById('btnSend');
const typingIndicator = document.getElementById('typingIndicator');
const engineBadge = document.getElementById('engineBadge');
const btnSettings = document.getElementById('btnSettings');
const settingsModal = document.getElementById('settingsModal');
const btnCloseSettings = document.getElementById('btnCloseSettings');
const btnSaveSettings = document.getElementById('btnSaveSettings');
const btnDisableGemini = document.getElementById('btnDisableGemini');
const apiKeyInput = document.getElementById('apiKeyInput');
const modelSelect = document.getElementById('modelSelect');
const suggestionScroll = document.getElementById('suggestionScroll');

// Filter & Explorer Elements
const kostCount = document.getElementById('kostCount');
const kostGrid = document.getElementById('kostGrid');
const filterType = document.getElementById('filterType');
const filterCampus = document.getElementById('filterCampus');
const filterPrice = document.getElementById('filterPrice');
const priceVal = document.getElementById('priceVal');
const filterSort = document.getElementById('filterSort');
const facilityCheckboxes = document.querySelectorAll('.facility-checkbox');

// 1. Coordinates & Data Cleaning Helpers
function cleanCoordinate(val, isLat) {
    if (!val) return null;
    let str = val.trim();
    
    // Remove all dots to construct a pure number
    let dotsCount = (str.match(/\./g) || []).length;
    if (dotsCount > 1 || (dotsCount === 1 && str.replace('.', '').length > 7)) {
        let cleaned = str.replace(/\./g, '');
        
        if (isLat) {
            // Latitude in Surabaya starts with -7.xxx (first char is '-')
            // e.g. -72540914 -> -7.2540914 (dot after index 2)
            if (cleaned.startsWith('-7')) {
                str = cleaned.slice(0, 2) + '.' + cleaned.slice(2);
            } else {
                str = '-' + cleaned.slice(0, 1) + '.' + cleaned.slice(1);
            }
        } else {
            // Longitude in Surabaya starts with 112.xxx
            // e.g. 1127387528 -> 112.7387528 (dot after index 3)
            if (cleaned.startsWith('112')) {
                str = cleaned.slice(0, 3) + '.' + cleaned.slice(3);
            } else if (cleaned.startsWith('1')) {
                // Handle cases where dots created e.g. 1.127.387.528 -> 1127387528
                str = '112.' + cleaned.slice(3);
            } else {
                str = '112.' + cleaned;
            }
        }
    } else {
        // If coordinate is already float-like e.g. -7.26868
        let parsed = parseFloat(str);
        if (!isNaN(parsed)) {
            // Quick check if latitude is too large (like -72.xxx instead of -7.xxx)
            if (isLat && parsed < -10) {
                parsed = parsed / 10;
            }
            return parsed;
        }
    }
    
    let parsed = parseFloat(str);
    return isNaN(parsed) ? null : parsed;
}

function cleanPrice(val) {
    if (!val) return 0;
    // Replace any non-numeric except digits
    let cleaned = val.toString().replace(/[^0-9]/g, '');
    let parsed = parseInt(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}

function cleanLabel(val) {
    if (!val) return 'Campur';
    let l = val.toString().trim().toUpperCase();
    if (l === 'P' || l === 'PUTRI') return 'Putri';
    if (l === 'L' || l === 'PUTRA' || l === 'LAKI-LAKI') return 'Putra';
    return 'Campur';
}

function parseFacilities(descText) {
    if (!descText) return [];
    // If description has list on multiple lines
    return descText.split('\n')
        .map(line => line.replace(/^[-\*\d\.\s]+/, '').trim()) // remove bullet points
        .filter(line => line.length > 0 && line.length < 30);
}

// 2. Haversine Distance Formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

// Format numbers as Rupiah
function formatRupiah(num, compact = false) {
    return 'Rp' + new Intl.NumberFormat('id-ID').format(num) + (compact ? '/bln' : '/bulan');
}

// 3. Load & Process CSV Data
async function loadDatasets() {
    try {
        // Load Campuses
        const campusRes = await fetch('kampus_surabaya_latlng.csv');
        const campusCsvText = await campusRes.text();
        
        await new Promise((resolve) => {
            Papa.parse(campusCsvText, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    campusesData = results.data.map(row => ({
                        name: row.nama_kampus,
                        lat: parseFloat(row.latitude),
                        lng: parseFloat(row.longitude)
                    })).filter(c => c.name && !isNaN(c.lat));
                    resolve();
                }
            });
        });

        // Load Kosts
        const kostRes = await fetch('kost - Fix.csv');
        const kostCsvText = await kostRes.text();
        
        await new Promise((resolve) => {
            Papa.parse(kostCsvText, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    kostsData = results.data.map((row, index) => {
                        const rawLat = row['location/lat'];
                        const rawLng = row['location/lng'];
                        const cleanLat = cleanCoordinate(rawLat, true);
                        const cleanLng = cleanCoordinate(rawLng, false);
                        const price = cleanPrice(row.price);
                        const label = cleanLabel(row.label);
                        const facilities = parseFacilities(row['description (optional)']);
                        
                        return {
                            id: index,
                            title: row.title || 'Kost Tanpa Nama',
                            url: row.url || '#',
                            address: row.address || 'Surabaya',
                            neighborhood: row.neighborhood || '',
                            phone: row.phone || '-',
                            website: row.website || '',
                            price: price,
                            label: label,
                            lat: cleanLat,
                            lng: cleanLng,
                            facilities: facilities,
                            description: row['description (optional)'] || '',
                            imageUrl: row.imageUrl || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80'
                        };
                    }).filter(k => k.lat && k.lng);
                    resolve();
                }
            });
        });

        console.log(`Loaded ${campusesData.length} campuses and ${kostsData.length} kosts successfully.`);
        
        // Populate Campus dropdown filter
        populateCampusSelect();
        
        // Init Map Markers
        initMap();
        
        // Populate Explorer Cards List
        updateKostList();
        
        // Invalidate size to ensure Leaflet renders correctly after DOM sizing
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 300);
        
    } catch (error) {
        console.error("Error loading CSV datasets:", error);
        appendMessage('bot', 'Maaf, gagal memuat dataset kost. Pastikan file CSV tersedia di direktori proyek.');
    }
}

function populateCampusSelect() {
    filterCampus.innerHTML = '<option value="none">-- Pilih Kampus --</option>';
    campusesData.forEach(campus => {
        const opt = document.createElement('option');
        opt.value = campus.name;
        opt.textContent = campus.name;
        filterCampus.appendChild(opt);
    });
}

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
        className: 'custom-div-icon',
        html: `<div style="background-color: var(--accent-blue); width: 14px; height: 14px; border: 2.5px solid #fff; border-radius: 50%; box-shadow: 0 0 10px rgba(59, 130, 246, 0.6);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
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

// 5. Explorer Sidebar logic (Filtering, Sorting, and Card Rendering)
function getFilteredKosts() {
    let filtered = [...kostsData];
    
    // Type Filter
    const type = filterType.value;
    if (type !== 'all') {
        filtered = filtered.filter(k => k.label === type);
    }
    
    // Price Filter
    const maxPrice = parseInt(filterPrice.value);
    filtered = filtered.filter(k => k.price <= maxPrice);
    
    // Facilities Filters
    const activeFacilities = Array.from(facilityCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value.toLowerCase());
        
    if (activeFacilities.length > 0) {
        filtered = filtered.filter(k => {
            const kostFacs = k.facilities.map(f => f.toLowerCase());
            // Make sure kost has ALL selected facilities
            return activeFacilities.every(af => {
                return kostFacs.some(kf => kf.includes(af) || af.includes(kf));
            });
        });
    }

    // Campus Distance calculations & filters
    const selectedCampus = filterCampus.value;
    if (selectedCampus !== 'none') {
        const campus = campusesData.find(c => c.name === selectedCampus);
        if (campus) {
            filtered = filtered.map(k => {
                const dist = calculateDistance(k.lat, k.lng, campus.lat, campus.lng);
                return { ...k, distance: dist };
            });
            // Enable sort by distance
            document.querySelector('#filterSort option[value="distanceAsc"]').disabled = false;
        }
    } else {
        filtered = filtered.map(k => {
            const { distance, ...rest } = k;
            return rest;
        });
        document.querySelector('#filterSort option[value="distanceAsc"]').disabled = true;
        if (filterSort.value === 'distanceAsc') filterSort.value = 'default';
    }

    // Sorting
    const sort = filterSort.value;
    if (sort === 'priceAsc') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sort === 'priceDesc') {
        filtered.sort((a, b) => b.price - a.price);
    } else if (sort === 'distanceAsc' && selectedCampus !== 'none') {
        filtered.sort((a, b) => a.distance - b.distance);
    }

    return filtered;
}

function updateKostList() {
    const filtered = getFilteredKosts();
    kostCount.textContent = filtered.length;
    kostGrid.innerHTML = '';
    
    if (filtered.length === 0) {
        kostGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fa-solid fa-folder-open" style="font-size: 32px; margin-bottom: 12px; color: var(--border);"></i>
                <p>Tidak ada kost yang memenuhi filter pencarian Anda.</p>
            </div>
        `;
        return;
    }
    
    filtered.forEach(kost => {
        const card = document.createElement('div');
        card.className = 'kost-card';
        card.dataset.id = kost.id;
        
        let typeBadgeClass = 'badge-campur';
        if (kost.label === 'Putri') typeBadgeClass = 'badge-putri';
        if (kost.label === 'Putra') typeBadgeClass = 'badge-putra';
        
        let distanceHtml = '';
        if (kost.distance !== undefined) {
            distanceHtml = `
                <div class="kost-card-distance">
                    <i class="fa-solid fa-route"></i> ${kost.distance.toFixed(2)} km ke ${filterCampus.value}
                </div>
            `;
        }
        
        const facilityBadges = kost.facilities.slice(0, 3).map(f => `
            <span class="facility-badge">${f}</span>
        `).join('');

        card.innerHTML = `
            <div class="kost-card-img">
                <span class="kost-type-badge ${typeBadgeClass}">${kost.label}</span>
                <img src="${kost.imageUrl}" alt="${kost.title}" onerror="this.src='https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80'">
            </div>
            <div class="kost-card-info">
                <h3>${kost.title}</h3>
                <div class="kost-card-address">
                    <i class="fa-solid fa-map-pin"></i> ${kost.neighborhood || 'Surabaya'}
                </div>
                <div class="kost-card-facilities">
                    ${facilityBadges}
                    ${kost.facilities.length > 3 ? `<span class="facility-badge">+${kost.facilities.length - 3}</span>` : ''}
                </div>
                ${distanceHtml}
                <div class="kost-card-footer">
                    <div class="kost-card-price">
                        ${formatRupiah(kost.price)}<span></span>
                    </div>
                    <button class="btn-card-action">Hubungi</button>
                </div>
            </div>
        `;
        
        // Click handler to zoom into map
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-card-action')) {
                // Open WhatsApp or phone
                if (kost.phone && kost.phone !== '-') {
                    let num = kost.phone.replace(/[^0-9]/g, '');
                    if (num.startsWith('0')) num = '62' + num.slice(1);
                    window.open(`https://wa.me/${num}?text=Halo,%20saya%20tertarik%20dengan%20kost%20${encodeURIComponent(kost.title)}`, '_blank');
                } else {
                    alert('Nomor kontak tidak tersedia.');
                }
                return;
            }
            focusOnKost(kost);
        });
        
        kostGrid.appendChild(card);
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

function drawPathLine(p1, p2) {
    if (activePolyline) {
        map.removeLayer(activePolyline);
    }
    
    activePolyline = L.polyline([p1, p2], {
        color: 'var(--accent-blue)',
        weight: 3,
        dashArray: '5, 10',
        opacity: 0.8
    }).addTo(map);
}

// 6. UI Events & Tab Controllers
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        const paneId = btn.dataset.tab;
        document.getElementById(paneId).classList.add('active');
        
        // Force Leaflet map layout recalculation if map tab activated
        if (paneId === 'mapTab' && map) {
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        }
    });
});

// Settings Modal Controls
btnSettings.addEventListener('click', () => {
    // Load local storage values
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    const savedModel = localStorage.getItem('gemini_model') || 'gemini-2.5-flash';
    apiKeyInput.value = savedKey;
    modelSelect.value = savedModel;
    settingsModal.classList.add('active');
});

btnCloseSettings.addEventListener('click', () => {
    settingsModal.classList.remove('active');
});

btnSaveSettings.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    const model = modelSelect.value;
    
    if (key) {
        localStorage.setItem('gemini_api_key', key);
        localStorage.setItem('gemini_model', model);
        localEngineMode = false;
        engineBadge.className = 'engine-badge gemini-mode';
        engineBadge.innerHTML = `<i class="fa-solid fa-brain"></i> Gemini AI Agent`;
        appendMessage('bot', `💡 <strong>Sistem Berubah:</strong> Kunci API Gemini tersimpan. Chatbot kini ditenagai oleh model AI <strong>${model}</strong>.`);
    } else {
        disableGemini();
    }
    settingsModal.classList.remove('active');
});

btnDisableGemini.addEventListener('click', () => {
    disableGemini();
    settingsModal.classList.remove('active');
});

function disableGemini() {
    localStorage.removeItem('gemini_api_key');
    localEngineMode = true;
    engineBadge.className = 'engine-badge';
    engineBadge.innerHTML = `<i class="fa-solid fa-gears"></i> Local NLP Engine`;
    appendMessage('bot', `💡 <strong>Sistem Berubah:</strong> Menggunakan **Local NLP Engine** (Pencarian berbasis kata kunci dan filter data).`);
}

// Check saved state on load
function checkSavedEngine() {
    const key = localStorage.getItem('gemini_api_key');
    const model = localStorage.getItem('gemini_model') || 'gemini-2.5-flash';
    if (key) {
        localEngineMode = false;
        engineBadge.className = 'engine-badge gemini-mode';
        engineBadge.innerHTML = `<i class="fa-solid fa-brain"></i> Gemini AI Agent`;
    }
}

// Sync slider price description value
filterPrice.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    priceVal.textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
});

// Update listings on change
[filterType, filterCampus, filterPrice, filterSort].forEach(el => {
    el.addEventListener('change', () => {
        updateKostList();
        renderMapMarkers();
    });
});
filterPrice.addEventListener('input', () => {
    updateKostList();
    renderMapMarkers();
});
facilityCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
        updateKostList();
        renderMapMarkers();
    });
});

// 7. Chat Message Helpers
function appendMessage(sender, text, meta = null) {
    const msg = document.createElement('div');
    msg.className = `message ${sender}-message`;
    
    const avatarIcon = sender === 'bot' ? 'fa-robot' : 'fa-user';
    
    // Simple parser for Markdown-like features (*bold*, _italic_, bullet points)
    let formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
        
    // If Bot formatted detail table/markdown block
    if (sender === 'bot') {
        formattedText = formattedText.replace(/(INFORMASI KOST|REKOMENDASI KOST|MAAF)/g, '<strong style="color: var(--accent);">$1</strong>');
    }

    msg.innerHTML = `
        <div class="message-avatar">
            <i class="fa-solid ${avatarIcon}"></i>
        </div>
        <div class="message-content">
            <p>${formattedText}</p>
            ${meta ? `<div style="font-size: 10px; color: var(--text-muted); margin-top: 6px; text-transform: uppercase; border-top: 1px dashed rgba(255,255,255,0.06); padding-top: 4px;">${meta}</div>` : ''}
        </div>
    `;
    
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    typingIndicator.style.display = 'flex';
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

// Send input handlers
btnSend.addEventListener('click', handleUserSendMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleUserSendMessage();
});

function handleUserSendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    appendMessage('user', text);
    chatInput.value = '';
    
    showTypingIndicator();
    
    // Simulate delay
    setTimeout(async () => {
        if (localEngineMode) {
            const reply = processLocalQuery(text);
            hideTypingIndicator();
            appendMessage('bot', reply.text, reply.meta);
        } else {
            // Call Gemini
            await processGeminiQuery(text);
        }
    }, 800);
}

// Handle Suggestion Chips click
document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
        const query = chip.dataset.query;
        chatInput.value = query;
        chatInput.focus();
    });
});

// 8. Local NLP Engine Implementation
function processLocalQuery(query) {
    const q = query.toLowerCase();
    
    // Define Intent and Entities
    let intent = 'fallback';
    let entities = {
        kostName: null,
        campusName: null,
        priceMax: null,
        priceMin: null,
        genderType: null,
        facilities: []
    };

    // Extract gender type
    if (q.includes('putri') || q.includes('cewek') || q.includes('cewe') || q.includes('perempuan') || q.includes('wanita') || q.includes('putry')) {
        entities.genderType = 'Putri';
    } else if (q.includes('putra') || q.includes('cowok') || q.includes('cowo') || q.includes('laki-laki') || q.includes('pria') || q.includes('laki')) {
        entities.genderType = 'Putra';
    } else if (q.includes('campur') || q.includes('pasutri')) {
        entities.genderType = 'Campur';
    }

    // Extract campus
    // Mapping alias to correct campusesData item
    let foundCampus = null;
    campusesData.forEach(c => {
        const nameClean = c.name.toLowerCase();
        // check abbreviation like "unair a", "unair b", "unair c", "its", "upn", "unesa"
        if (nameClean.includes('airlangga kampus a') || nameClean.includes('unair a') || nameClean.includes('unair kampus a')) {
            if (q.includes('unair a') || q.includes('unair kampus a') || q.includes('airlangga a') || q.includes('kampus a')) {
                foundCampus = campusesData.find(cd => cd.name.includes('Kampus A'));
            }
        }
        if (nameClean.includes('airlangga kampus b') || nameClean.includes('unair b') || nameClean.includes('unair kampus b')) {
            if (q.includes('unair b') || q.includes('unair kampus b') || q.includes('airlangga b') || q.includes('kampus b')) {
                foundCampus = campusesData.find(cd => cd.name.includes('Kampus B'));
            }
        }
        if (nameClean.includes('airlangga kampus c') || nameClean.includes('unair c') || nameClean.includes('unair kampus c')) {
            if (q.includes('unair c') || q.includes('unair kampus c') || q.includes('airlangga c') || q.includes('kampus c')) {
                foundCampus = campusesData.find(cd => cd.name.includes('Kampus C'));
            }
        }
        if (q.includes('its') && nameClean.includes('teknologi sepuluh nopember')) {
            foundCampus = c;
        }
        if (q.includes('unesa') && nameClean.includes('negeri surabaya')) {
            foundCampus = c;
        }
        if (q.includes('upn') && nameClean.includes('pembangunan nasional')) {
            foundCampus = c;
        }
        if (q.includes('pens') && nameClean.includes('elektronika negeri')) {
            foundCampus = c;
        }
        if (q.includes('petra') && nameClean.includes('petra')) {
            foundCampus = c;
        }
        if (q.includes('untag') && nameClean.includes('17 agustus')) {
            foundCampus = c;
        }
        
        // Exact match
        if (q.includes(nameClean)) {
            foundCampus = c;
        }
    });
    if (foundCampus) {
        entities.campusName = foundCampus.name;
    }

    // Extract price bounds
    // Handle e.g. "di bawah 1.5 juta", "di bawah 1 juta", "di bawah 800rb", "di bawah 800.000", "harga 1jt"
    const jtRegex = /(?:di bawah|max|maksimal|bawah|kurang dari)?\s*([0-9\.,]+)\s*(?:juta|jt)/gi;
    const rbRegex = /(?:di bawah|max|maksimal|bawah)?\s*([0-9\.,]+)\s*(?:ribu|rb)/gi;
    const rawRegex = /(?:di bawah|max|maksimal|bawah)?\s*(?:rp\.?\s*)?([0-9\.]{6,8})/gi;
    
    let match;
    if ((match = jtRegex.exec(q)) !== null) {
        let val = parseFloat(match[1].replace(',', '.'));
        entities.priceMax = val * 1000000;
    } else if ((match = rbRegex.exec(q)) !== null) {
        let val = parseFloat(match[1]);
        entities.priceMax = val * 1000;
    } else if ((match = rawRegex.exec(q)) !== null) {
        let val = parseInt(match[1].replace(/\./g, ''));
        entities.priceMax = val;
    }

    // Extract facilities
    const facilityKeywords = ['ac', 'wifi', 'kamar mandi', 'kasur', 'lemari', 'meja'];
    facilityKeywords.forEach(f => {
        if (q.includes(f)) {
            entities.facilities.push(f);
        }
    });

    // Extract specific kost name (Signature Keywords Matching)
    let foundKost = null;
    let maxMatchScore = 0;
    
    // Stopwords to exclude when extracting unique signatures from kost titles
    const stopWords = new Set([
        'kost', 'kos', 'griya', 'putra', 'putri', 'campur', 'surabaya', 'executive', 
        'eksekutif', 'muslim', 'dan', 'di', 'pusat', 'kota', 'untuk', 'harian', 
        'bulanan', 'room', 'house', 'residence', 'home', 'living', 'stay', 'the', 
        'a', 'b', 'c', 'grosir', 'gang', 'gg', 'no', 'nomor', 'jalan', 'jl'
    ]);
    
    kostsData.forEach(k => {
        const titleClean = k.title.toLowerCase();
        
        // Split title into tokens and remove stopwords to find the "signature" of the kost
        const titleTokens = titleClean.split(/[\s\-\,\|]+/).filter(t => t.length > 2 && !stopWords.has(t));
        
        if (titleTokens.length === 0) return;
        
        // Count how many signature tokens of this kost are present in the user query
        let matchCount = 0;
        titleTokens.forEach(token => {
            if (q.includes(token)) {
                matchCount++;
            }
        });
        
        if (matchCount > 0) {
            // Score is the percentage of signature tokens matched
            const score = matchCount / titleTokens.length;
            
            // We favor matches that have a higher absolute number of matched tokens to break ties
            const finalScore = score + (matchCount * 0.1);
            
            if (finalScore > maxMatchScore) {
                maxMatchScore = finalScore;
                foundKost = k;
            }
        }
    });
    
    // Backup 1: if the query directly includes the whole title or a substantial part of it
    kostsData.forEach(k => {
        const titleClean = k.title.toLowerCase();
        if (q.includes(titleClean) && titleClean.length > 5) {
            foundKost = k;
            maxMatchScore = 20; // Absolute highest priority
        }
    });

    // Backup 2: check if stripped words have direct substring match
    if (!foundKost) {
        kostsData.forEach(k => {
            const titleClean = k.title.toLowerCase();
            const words = titleClean.replace(/(griya|kost|kos|eksekutif|executive|putra|putri|muslim)/g, '').trim();
            if (words.length > 3 && q.includes(words)) {
                foundKost = k;
            }
        });
    }

    if (foundKost) {
        entities.kostName = foundKost.title;
    }

    // Determine Intent
    const isRecommendation = q.includes('rekomendasi') || q.includes('cari') || q.includes('tunjukkan') || q.includes('tampilkan') || q.includes('butuh') || q.includes('dekat') || q.includes('di bawah');
    const isDistance = q.includes('jarak') || q.includes('jauh') || q.includes('berapa km') || q.includes('estimasi') || q.includes('seberapa jauh') || q.includes('menit') || q.includes('waktu') || q.includes('lama') || q.includes('rute');
    const isPrice = q.includes('harga') || q.includes('tarif') || q.includes('sewa') || q.includes('biaya') || q.includes('berapa') || q.includes('rp');
    const isFacilities = q.includes('fasilitas') || q.includes('ada apa saja') || q.includes('menyediakan') || q.includes('fasilitasnya');
    const isType = q.includes('tipe') || q.includes('untuk putra') || q.includes('untuk putri') || q.includes('campur') || q.includes('jenis');
    const isContact = q.includes('kontak') || q.includes('hubungi') || q.includes('no hp') || q.includes('telepon') || q.includes('wa') || q.includes('nomor');
    const isLocation = q.includes('lokasi') || q.includes('alamat') || q.includes('dimana') || q.includes('di mana') || q.includes('jalan');

    if (foundKost) {
        const isApakah = q.includes('apakah') || q.includes('ada') || q.includes('punya') || q.includes('memiliki');
        if (isApakah && entities.facilities.length > 0) {
            intent = 'tanya_fasilitas_spesifik';
        } else if (isDistance && entities.campusName) {
            intent = 'jarak_kost_kampus';
        } else if (isPrice) {
            intent = 'tanya_harga';
        } else if (isFacilities) {
            intent = 'tanya_fasilitas';
        } else if (isType) {
            intent = 'tanya_tipe';
        } else if (isContact) {
            intent = 'tanya_kontak';
        } else if (isLocation) {
            intent = 'tanya_lokasi';
        } else {
            intent = 'tanya_detail';
        }
    } else if (isRecommendation || entities.campusName || entities.priceMax || entities.genderType || entities.facilities.length > 0) {
        intent = 'rekomendasi_kost';
    }

    // Check outside scope
    const outOfScopeKeywords = ['cuaca', 'berita', 'politik', 'makanan', 'resep', 'kuliah', 'unair adalah', 'siapa kamu', 'presiden', 'gemini'];
    const isOutOfScope = outOfScopeKeywords.some(w => q.includes(w));
    if (isOutOfScope) {
        return {
            text: `MAAF\nSaya hanya bisa membantu mencari dan menjelaskan informasi kost di Surabaya.`,
            meta: `Intent: fallback (out_of_scope)`
        };
    }

    // Generate Response based on intent
    let responseText = '';
    let metaText = `Intent: ${intent}`;
    let metaDetails = [];
    for (let key in entities) {
        if (entities[key]) {
            if (Array.isArray(entities[key]) && entities[key].length === 0) continue;
            metaDetails.push(`${key}: ${JSON.stringify(entities[key])}`);
        }
    }
    if (metaDetails.length > 0) metaText += ` | ${metaDetails.join(', ')}`;

    // Check for conflicting gender input on specific kost queries
    let warningPrefix = '';
    if (foundKost && entities.genderType && foundKost.label !== entities.genderType) {
        warningPrefix = `⚠️ **Catatan:** Anda mencari kost tipe **${entities.genderType}**, tetapi **${foundKost.title}** adalah tipe **${foundKost.label}**.\n\n`;
    }

    switch (intent) {
        case 'tanya_detail':
            responseText = formatKostDetailResponse(foundKost);
            focusOnKost(foundKost);
            break;
            
        case 'tanya_harga':
            responseText = `INFORMASI KOST\n\nNama Kost : ${foundKost.title}\nHarga : ${formatRupiah(foundKost.price)}`;
            focusOnKost(foundKost);
            break;
            
        case 'tanya_fasilitas':
            responseText = `FASILITAS ${foundKost.title.toUpperCase()}\n${foundKost.facilities.map(f => `- ${f}`).join('\n') || '- Tidak terinci'}`;
            focusOnKost(foundKost);
            break;

        case 'tanya_fasilitas_spesifik':
            const requestedFac = entities.facilities[0]; // e.g. wifi
            const hasFac = foundKost.facilities.some(f => f.toLowerCase().includes(requestedFac));
            const facDisplayName = requestedFac.toUpperCase();
            
            if (hasFac) {
                responseText = `FASILITAS ${facDisplayName}\n\nYa, ${foundKost.title} memiliki fasilitas ${requestedFac}.\n\nFasilitas lengkap:\n${foundKost.facilities.map(f => `- ${f}`).join('\n')}`;
            } else {
                responseText = `FASILITAS ${facDisplayName}\n\nTidak, ${foundKost.title} tidak memiliki fasilitas ${requestedFac}.\n\nFasilitas lengkap:\n${foundKost.facilities.map(f => `- ${f}`).join('\n')}`;
            }
            focusOnKost(foundKost);
            break;
            
        case 'tanya_tipe':
            responseText = `INFORMASI KOST\n\n**${foundKost.title}** adalah kost tipe **${foundKost.label}**.`;
            focusOnKost(foundKost);
            break;
            
        case 'tanya_kontak':
            responseText = `KONTAK ${foundKost.title.toUpperCase()}\n\nWhatsApp : ${foundKost.phone || '-'}`;
            focusOnKost(foundKost);
            break;
            
        case 'tanya_lokasi':
            responseText = `ALAMAT ${foundKost.title.toUpperCase()}\n\n${foundKost.address}`;
            focusOnKost(foundKost);
            break;

        case 'jarak_kost_kampus':
            const campusObj = campusesData.find(c => c.name === entities.campusName);
            if (foundKost && campusObj) {
                const dist = calculateDistance(foundKost.lat, foundKost.lng, campusObj.lat, campusObj.lng);
                const motorTime = Math.round(dist * 3) || 1;
                const walkTime = Math.round(dist * 15) || 5;
                
                // Extract clean alias
                let campusAlias = campusObj.name;
                if (q.includes('its')) campusAlias = 'ITS';
                else if (q.includes('unair')) {
                    if (campusObj.name.includes('Kampus A')) campusAlias = 'UNAIR (Kampus A)';
                    else if (campusObj.name.includes('Kampus B')) campusAlias = 'UNAIR (Kampus B)';
                    else if (campusObj.name.includes('Kampus C')) campusAlias = 'UNAIR (Kampus C)';
                } else if (q.includes('unesa')) campusAlias = 'Unesa';
                
                responseText = `JARAK & ESTIMASI WAKTU\n\nDari ${foundKost.title} ke ${campusAlias}\n- Jarak : ${dist.toFixed(1).replace('.', ',')} km\n- Jalan kaki : ${walkTime} menit\n- Motor : ${motorTime} menit`;
                
                focusOnKost(foundKost);
                // Switch sidebar filter to campus to show distance
                filterCampus.value = campusObj.name;
                updateKostList();
                drawPathLine([foundKost.lat, foundKost.lng], [campusObj.lat, campusObj.lng]);
            } else {
                responseText = `MAAF\nSaya tidak dapat menghitung jarak. Pastikan nama kost dan kampus disebutkan dengan jelas.`;
            }
            break;

        case 'rekomendasi_kost':
            responseText = handleRecommendationQuery(entities, q);
            break;

        default:
            responseText = `MAAF\nSaya tidak memahami pertanyaan Anda. Coba tanyakan kriteria kost seperti: "Rekomendasi kost dekat UNAIR Kampus B dengan AC" atau "Berapa jarak Kost Mawar ke Kampus A?"`;
            break;
    }

    if (warningPrefix) {
        responseText = warningPrefix + responseText;
    }

    return { text: responseText, meta: metaText };
}

function formatKostDetailResponse(kost) {
    return `INFORMASI LENGKAP ${kost.title.toUpperCase()}
Nama : ${kost.title}
Alamat : ${kost.address}
Harga : ${formatRupiah(kost.price)}
Fasilitas: ${kost.facilities.join(', ') || '-'}
Kontak : ${kost.phone || '-'} (WA)
Tipe : ${kost.label}`;
}

function handleRecommendationQuery(entities, q) {
    let results = [...kostsData];

    // Filter by campus (implicitly calculating distances)
    let campusObj = null;
    if (entities.campusName) {
        campusObj = campusesData.find(c => c.name === entities.campusName);
        if (campusObj) {
            results = results.map(k => {
                const dist = calculateDistance(k.lat, k.lng, campusObj.lat, campusObj.lng);
                return { ...k, distance: dist };
            });
            // Sort by nearest campus as priority
            results.sort((a, b) => a.distance - b.distance);
        }
    }

    // Filter by type
    if (entities.genderType) {
        results = results.filter(k => k.label === entities.genderType);
    }

    // Filter by max price
    if (entities.priceMax) {
        results = results.filter(k => k.price <= entities.priceMax);
    }

    // Filter by facilities
    if (entities.facilities.length > 0) {
        results = results.filter(k => {
            const kostFacs = k.facilities.map(f => f.toLowerCase());
            return entities.facilities.every(af => {
                return kostFacs.some(kf => kf.includes(af) || af.includes(kf));
            });
        });
    }

    // Format final list of recommendations
    if (results.length === 0) {
        return `MAAF\nSaya tidak menemukan kost yang sesuai dengan kriteria tersebut.\nCoba ubah harga, fasilitas, atau kampus tujuan.`;
    }

    // Sync filters in Sidebar Explorer for clarity
    if (entities.genderType) filterType.value = entities.genderType;
    if (entities.priceMax) {
        filterPrice.value = entities.priceMax;
        priceVal.textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(entities.priceMax);
    }
    if (campusObj) {
        filterCampus.value = campusObj.name;
        // Enable distance sort
        document.querySelector('#filterSort option[value="distanceAsc"]').disabled = false;
        filterSort.value = 'distanceAsc';
    }
    
    // Sync active facility checkboxes
    facilityCheckboxes.forEach(cb => {
        cb.checked = entities.facilities.includes(cb.value.toLowerCase());
    });
    
    updateKostList();
    renderMapMarkers();
    
    // Zoom map out to fit results
    if (results.length > 0 && map) {
        const bounds = L.latLngBounds(results.slice(0, 5).map(k => [k.lat, k.lng]));
        if (campusObj) bounds.extend([campusObj.lat, campusObj.lng]);
        map.fitBounds(bounds, { padding: [50, 50] });
    }

    let headerTitle = "REKOMENDASI KOST";
    if (entities.genderType) {
        headerTitle += " " + entities.genderType.toUpperCase();
    }
    
    let descLine = `Ditemukan ${results.length} kost`;
    if (entities.genderType) {
        descLine += ` ${entities.genderType.toLowerCase()}`;
    }
    if (entities.campusName) {
        let campusAlias = entities.campusName;
        if (q.includes('unair')) campusAlias = 'UNAIR';
        else if (q.includes('its')) campusAlias = 'ITS';
        else if (q.includes('unesa')) campusAlias = 'Unesa';
        else if (q.includes('upn')) campusAlias = 'UPN';
        
        descLine += ` di sekitar ${campusAlias}`;
    }
    if (entities.priceMax) {
        let priceStr = 'Rp' + new Intl.NumberFormat('id-ID').format(entities.priceMax);
        if (q.includes('bawah') || q.includes('kurang dari')) {
            descLine += ` dengan harga di bawah ${priceStr}`;
        } else {
            descLine += ` dengan harga < ${priceStr}`;
        }
    }
    descLine += ":";

    let listText = `${headerTitle}\n\n${descLine}\n\n`;
    results.slice(0, 5).forEach((k, idx) => {
        let priceStr = formatRupiah(k.price, true);
        let facsStr = k.facilities.slice(0, 3).join(', ');
        let facsBrackets = facsStr ? ` (${facsStr})` : '';
        listText += `${idx + 1}. ${k.title} - ${priceStr}${facsBrackets}\n`;
    });

    if (results.length > 5) {
        listText += `\n_... dan ${results.length - 5} kost lainnya dapat dilihat pada panel Daftar Kost sebelah kanan._`;
    }

    return listText.trim();
}

// 9. Gemini API Engine Implementation
async function processGeminiQuery(query) {
    const key = localStorage.getItem('gemini_api_key');
    const model = localStorage.getItem('gemini_model') || 'gemini-2.5-flash';
    
    if (!key) {
        hideTypingIndicator();
        appendMessage('bot', '⚠️ Kunci API Gemini tidak terdeteksi. Silakan buka Pengaturan (ikon gir di kanan atas) untuk memasukkannya kembali.');
        disableGemini();
        return;
    }

    // Limit context size to 25 items closest to query parameters to fit inside budget
    const filteredContextKosts = kostsData.slice(0, 35).map(k => ({
        nama_kost: k.title,
        alamat: k.address,
        latitude: k.lat,
        longitude: k.lng,
        harga: k.price,
        tipe_kost: k.label,
        fasilitas: k.facilities,
        kontak: k.phone,
        url_maps: k.url
    }));

    const campusContext = campusesData.map(c => ({
        nama_kampus: c.name,
        latitude: c.lat,
        longitude: c.lng
    }));

    const systemInstruction = `
Kamu adalah agent AI untuk chatbot informasi kost di Surabaya. Tugasmu adalah memahami pertanyaan pengguna, mengekstrak intent dan entitas, lalu mencari jawaban hanya dari dataset kost dan dataset kampus yang disediakan di bawah.

Kamu harus:
- menjawab dengan bahasa Indonesia yang jelas dan sopan,
- tidak mengarang informasi apa pun di luar dataset,
- jika data tidak ditemukan, katakan tidak ditemukan secara jujur dan sopan,
- menolak pertanyaan di luar domain kost atau Surabaya secara sopan,
- menggunakan data koordinat untuk mengindikasikan jarak (gunakan formula Haversine jika perlu, atau andalkan kalkulasi jarak),
- menyarankan kost berdasarkan kombinasi filter (tipe, harga, fasilitas),
- menyusun respon sesuai dengan format output dari Laporan UAS PDF:
  Untuk tanya_harga:
  INFORMASI KOST
  Nama Kost : [Nama Kost]
  Harga : Rp[Harga]/bulan
  
  Untuk tanya_fasilitas:
  FASILITAS [NAMA KOST]
  - [Fasilitas 1]
  - [Fasilitas 2]
  
  Untuk tanya_kontak:
  KONTAK [NAMA KOST]
  WhatsApp : [Nomor WA]
  
  Untuk tanya_lokasi:
  ALAMAT [NAMA KOST]
  [Alamat Lengkap]
  
  Untuk jarak_kost_kampus:
  JARAK & ESTIMASI WAKTU
  Dari [Nama Kost] ke [Nama Kampus]
  - Jarak : [Jarak] km
  - Jalan kaki : [Waktu Jalan Kaki] menit
  - Motor : [Waktu Motor] menit
  
  Untuk tanya_detail / informasi lengkap:
  INFORMASI LENGKAP [NAMA KOST]
  Nama : [Nama Kost]
  Alamat : [Alamat]
  Harga : Rp[Harga]/bulan
  Fasilitas: [Fasilitas 1, Fasilitas 2]
  Kontak : [Nomor Kontak] (WA)
  Tipe : [Tipe]
  
  Untuk rekomendasi_kost:
  REKOMENDASI KOST [TIPE jika ada]
  Ditemukan X kost [tipe jika ada] di sekitar [Nama Kampus] [dengan harga di bawah / < RpY]:
  1. [Nama Kost] - Rp[Harga]/bln ([Fasilitas 1], [Fasilitas 2])
  2. [Nama Kost] - Rp[Harga]/bln ([Fasilitas 1], [Fasilitas 2])

Dataset Kampus:
${JSON.stringify(campusContext, null, 2)}

Dataset Kost:
${JSON.stringify(filteredContextKosts, null, 2)}
`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: query }]
                }],
                systemInstruction: {
                    parts: [{ text: systemInstruction }]
                },
                generationConfig: {
                    temperature: 0.2,
                    topP: 0.95,
                    maxOutputTokens: 1024
                }
            })
        });

        const data = await response.json();
        hideTypingIndicator();

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const reply = data.candidates[0].content.parts[0].text;
            
            // Try to detect if Gemini mentioned a specific kost to trigger map focus
            let matchedKost = null;
            kostsData.forEach(k => {
                if (reply.toLowerCase().includes(k.title.toLowerCase())) {
                    matchedKost = k;
                }
            });

            appendMessage('bot', reply, `Ditenagai oleh ${model}`);
            
            if (matchedKost) {
                focusOnKost(matchedKost);
            }
        } else {
            console.error("Gemini response structure invalid:", data);
            appendMessage('bot', 'Maaf, terjadi kesalahan saat memproses respon dari Gemini. Menggunakan Local Engine sementara.', 'Error');
        }

    } catch (error) {
        console.error("Error communicating with Gemini API:", error);
        hideTypingIndicator();
        appendMessage('bot', '⚠️ Gagal terhubung ke Gemini API. Pastikan Kunci API Anda benar dan koneksi internet stabil. Beralih ke Local NLP Engine.', 'Koneksi Gagal');
        disableGemini();
    }
}

// 10. Start App
window.addEventListener('DOMContentLoaded', () => {
    checkSavedEngine();
    loadDatasets();
});
