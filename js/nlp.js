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
        'a', 'b', 'c', 'grosir', 'gang', 'gg', 'no', 'nomor', 'jalan', 'jl',
        'dekat', 'sekitar', 'samping', 'depan', 'belakang', 'seberang', 'unair', 
        'its', 'unesa', 'upn', 'pens', 'petra', 'untag', 'narotama', 'ciputra', 
        'unitomo', 'kampus'
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
            const words = titleClean.replace(/\b(griya|kost|kos|eksekutif|executive|putra|putri|muslim)\b/g, '').trim();
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

