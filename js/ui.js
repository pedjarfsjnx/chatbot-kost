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

// 10. Start App
window.addEventListener('DOMContentLoaded', () => {
    checkSavedEngine();
    loadDatasets();
});
