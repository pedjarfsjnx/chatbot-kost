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

