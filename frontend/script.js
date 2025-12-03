// ==============================
// MUSIC STREAM - SCRIPT.JS
// Complete Frontend Logic
// ==============================

// ===== CONFIGURATION =====
const CONFIG = {
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api'
        : '/api',
    MAX_RECENT_SEARCHES: 10,
    MAX_QUEUE_SIZE: 100,
    VOLUME_INCREMENT: 10,
    SEEK_INCREMENT: 10,
    CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
    DEBOUNCE_DELAY: 500
};

// ===== STATE MANAGEMENT =====
let state = {
    // Player State
    isPlaying: false,
    currentTrack: null,
    currentTime: 0,
    duration: 0,
    volume: 70,
    isMuted: false,
    previousVolume: 70,
    
    // Playback Settings
    isShuffled: false,
    isRepeating: false,
    repeatMode: 'none', // 'none', 'one', 'all'
    playbackRate: 1.0,
    
    // Queue State
    queue: [],
    currentQueueIndex: -1,
    originalQueue: [],
    
    // UI State
    currentPage: 'home',
    theme: localStorage.getItem('theme') || 'dark',
    searchHistory: JSON.parse(localStorage.getItem('searchHistory')) || [],
    likedSongs: JSON.parse(localStorage.getItem('likedSongs')) || [],
    playlists: JSON.parse(localStorage.getItem('playlists')) || [
        { id: 'default-1', name: 'Favorites', tracks: [] },
        { id: 'default-2', name: 'Workout Mix', tracks: [] },
        { id: 'default-3', name: 'Chill Vibes', tracks: [] }
    ],
    recentlyPlayed: JSON.parse(localStorage.getItem('recentlyPlayed')) || [],
    
    // Search State
    searchResults: [],
    isLoading: false,
    searchQuery: '',
    searchEngine: 'gaama',
    
    // Lyrics State
    currentLyrics: null,
    
    // Cache
    trackCache: new Map(),
    lyricsCache: new Map(),
    searchCache: new Map()
};

// ===== DOM ELEMENTS =====
const elements = {
    // Player Elements
    audioPlayer: document.getElementById('audio-player'),
    playPauseBtn: document.getElementById('play-pause-btn'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    shuffleBtn: document.getElementById('shuffle-btn'),
    repeatBtn: document.getElementById('repeat-btn'),
    progressSlider: document.getElementById('progress-slider'),
    volumeSlider: document.getElementById('volume-slider'),
    muteBtn: document.getElementById('mute-btn'),
    currentTime: document.getElementById('current-time'),
    duration: document.getElementById('duration'),
    
    // Track Info Elements
    currentTrackTitle: document.getElementById('current-track-title'),
    currentTrackArtist: document.getElementById('current-track-artist'),
    currentTrackImg: document.getElementById('current-track-img'),
    playerTrackTitle: document.getElementById('player-track-title'),
    playerTrackArtist: document.getElementById('player-track-artist'),
    playerTrackImg: document.getElementById('player-track-img'),
    largeTrackTitle: document.getElementById('large-track-title'),
    largeTrackArtist: document.getElementById('large-track-artist'),
    largeTrackImg: document.getElementById('large-track-img'),
    miniTrackTitle: document.getElementById('mini-track-title'),
    miniTrackArtist: document.getElementById('mini-track-artist'),
    miniTrackImg: document.getElementById('mini-track-img'),
    
    // Search Elements
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    searchEngine: document.getElementById('search-engine'),
    resultsContainer: document.getElementById('results-container'),
    resultsCount: document.getElementById('results-count'),
    loadingResults: document.getElementById('loading-results'),
    recentSearchesList: document.getElementById('recent-searches-list'),
    
    // Navigation Elements
    navItems: document.querySelectorAll('.nav-item'),
    pageContent: document.getElementById('page-content'),
    pages: document.querySelectorAll('.page'),
    
    // Lyrics Elements
    lyricsContainer: document.getElementById('lyrics-container'),
    loadingLyrics: document.getElementById('loading-lyrics'),
    copyLyricsBtn: document.getElementById('copy-lyrics'),
    lyricsToggleBtn: document.getElementById('lyrics-toggle-btn'),
    
    // Queue Elements
    queueModal: document.getElementById('queue-modal'),
    queueList: document.getElementById('queue-list'),
    queueToggleBtn: document.getElementById('queue-toggle-btn'),
    queueCount: document.getElementById('queue-count'),
    clearQueueBtn: document.getElementById('clear-queue'),
    saveQueueBtn: document.getElementById('save-queue'),
    emptyQueue: document.getElementById('empty-queue'),
    closeQueueModal: document.querySelector('.close-modal'),
    
    // Like Elements
    likeBtn: document.getElementById('like-btn'),
    playerLikeBtn: document.getElementById('player-like-btn'),
    miniLikeBtn: document.getElementById('mini-like-btn'),
    likedCount: document.getElementById('liked-count'),
    
    // Playlist Elements
    createPlaylistBtn: document.getElementById('create-playlist-btn'),
    playlistList: document.getElementById('playlist-list'),
    addToPlaylistBtn: document.getElementById('add-to-playlist'),
    
    // Settings Elements
    settingsModal: document.getElementById('settings-modal'),
    settingsBtn: document.getElementById('settings-btn'),
    closeSettingsModal: document.querySelector('.close-settings-modal'),
    themeToggle: document.getElementById('theme-toggle'),
    themeOptions: document.querySelectorAll('.theme-option'),
    audioQuality: document.getElementById('audio-quality'),
    crossfade: document.getElementById('crossfade'),
    crossfadeValue: document.getElementById('crossfade-value'),
    clearCacheBtn: document.getElementById('clear-cache'),
    
    // Quick Actions
    quickActionCards: document.querySelectorAll('.quick-action-card'),
    
    // Loading Screen
    loadingScreen: document.getElementById('loading-screen'),
    
    // Toast Container
    toastContainer: document.getElementById('toast-container')
};

// ===== INITIALIZATION =====
function init() {
    // Load saved state
    loadSavedState();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup audio player
    setupAudioPlayer();
    
    // Setup theme
    setupTheme();
    
    // Update UI
    updateUI();
    
    // Hide loading screen
    setTimeout(() => {
        elements.loadingScreen.classList.add('hidden');
        showToast('MusicStream loaded successfully!', 'success');
    }, 1000);
}

// ===== STATE MANAGEMENT FUNCTIONS =====
function saveState() {
    try {
        localStorage.setItem('searchHistory', JSON.stringify(state.searchHistory.slice(0, CONFIG.MAX_RECENT_SEARCHES)));
        localStorage.setItem('likedSongs', JSON.stringify(state.likedSongs));
        localStorage.setItem('playlists', JSON.stringify(state.playlists));
        localStorage.setItem('recentlyPlayed', JSON.stringify(state.recentlyPlayed.slice(0, 50)));
        localStorage.setItem('theme', state.theme);
        localStorage.setItem('volume', state.volume.toString());
        localStorage.setItem('queue', JSON.stringify(state.queue));
        localStorage.setItem('currentQueueIndex', state.currentQueueIndex.toString());
    } catch (error) {
        console.warn('Failed to save state:', error);
    }
}

function loadSavedState() {
    try {
        const savedVolume = localStorage.getItem('volume');
        if (savedVolume) {
            state.volume = parseInt(savedVolume);
            elements.audioPlayer.volume = state.volume / 100;
            elements.volumeSlider.value = state.volume;
        }
        
        const savedQueue = localStorage.getItem('queue');
        const savedIndex = localStorage.getItem('currentQueueIndex');
        if (savedQueue && savedIndex) {
            state.queue = JSON.parse(savedQueue);
            state.currentQueueIndex = parseInt(savedIndex);
            updateQueueCount();
        }
    } catch (error) {
        console.warn('Failed to load saved state:', error);
    }
}

// ===== EVENT LISTENERS SETUP =====
function setupEventListeners() {
    // Navigation
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            navigateTo(page);
        });
    });
    
    elements.lyricsToggleBtn.addEventListener('click', () => navigateTo('lyrics'));
    elements.queueToggleBtn.addEventListener('click', showQueueModal);
    
    // Search
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // Debounced search
    let searchTimeout;
    elements.searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (e.target.value.length >= 2) {
                handleSearch();
            }
        }, CONFIG.DEBOUNCE_DELAY);
    });
    
    elements.searchEngine.addEventListener('change', (e) => {
        state.searchEngine = e.target.value;
    });
    
    // Player Controls
    elements.playPauseBtn.addEventListener('click', togglePlayPause);
    elements.prevBtn.addEventListener('click', playPrevious);
    elements.nextBtn.addEventListener('click', playNext);
    elements.shuffleBtn.addEventListener('click', toggleShuffle);
    elements.repeatBtn.addEventListener('click', toggleRepeat);
    
    // Progress Controls
    elements.progressSlider.addEventListener('input', (e) => {
        const percent = e.target.value;
        if (elements.audioPlayer.duration) {
            elements.audioPlayer.currentTime = (percent / 100) * elements.audioPlayer.duration;
        }
    });
    
    // Volume Controls
    elements.volumeSlider.addEventListener('input', (e) => {
        const volume = parseInt(e.target.value);
        setVolume(volume);
    });
    
    elements.muteBtn.addEventListener('click', toggleMute);
    
    // Like Buttons
    elements.likeBtn.addEventListener('click', toggleLike);
    elements.playerLikeBtn.addEventListener('click', toggleLike);
    elements.miniLikeBtn.addEventListener('click', toggleLike);
    
    // Queue Modal
    elements.closeQueueModal.addEventListener('click', hideQueueModal);
    elements.clearQueueBtn.addEventListener('click', clearQueue);
    elements.saveQueueBtn.addEventListener('click', saveQueueAsPlaylist);
    
    window.addEventListener('click', (e) => {
        if (e.target === elements.queueModal) {
            hideQueueModal();
        }
        if (e.target === elements.settingsModal) {
            hideSettingsModal();
        }
    });
    
    // Settings
    elements.settingsBtn.addEventListener('click', showSettingsModal);
    elements.closeSettingsModal.addEventListener('click', hideSettingsModal);
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.dataset.theme;
            setTheme(theme);
        });
    });
    
    elements.crossfade.addEventListener('input', (e) => {
        elements.crossfadeValue.textContent = `${e.target.value}s`;
    });
    
    elements.clearCacheBtn.addEventListener('click', clearCache);
    
    // Copy Lyrics
    elements.copyLyricsBtn.addEventListener('click', copyLyrics);
    
    // Quick Actions
    elements.quickActionCards.forEach(card => {
        card.addEventListener('click', () => {
            const action = card.dataset.action;
            handleQuickAction(action);
        });
    });
    
    // Create Playlist
    elements.createPlaylistBtn.addEventListener('click', createPlaylist);
    elements.addToPlaylistBtn.addEventListener('click', addToPlaylist);
    
    // Keyboard Shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Window Events
    window.addEventListener('beforeunload', saveState);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);
}

function setupAudioPlayer() {
    const audio = elements.audioPlayer;
    
    audio.volume = state.volume / 100;
    
    // Time Update
    audio.addEventListener('timeupdate', () => {
        state.currentTime = audio.currentTime;
        state.duration = audio.duration || 0;
        updateProgress();
        updateCurrentTime();
    });
    
    // Loaded Metadata
    audio.addEventListener('loadedmetadata', () => {
        state.duration = audio.duration;
        updateDuration();
    });
    
    // Play
    audio.addEventListener('play', () => {
        state.isPlaying = true;
        updatePlayPauseButton();
    });
    
    // Pause
    audio.addEventListener('pause', () => {
        state.isPlaying = false;
        updatePlayPauseButton();
    });
    
    // Ended
    audio.addEventListener('ended', () => {
        if (state.repeatMode === 'one') {
            audio.currentTime = 0;
            audio.play();
        } else if (state.repeatMode === 'all' || state.currentQueueIndex < state.queue.length - 1) {
            playNext();
        }
    });
    
    // Error
    audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        showToast('Error playing audio. Trying next track...', 'error');
        playNext();
    });
}

// ===== NAVIGATION =====
function navigateTo(page) {
    // Update active nav item
    elements.navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });
    
    // Update active page
    elements.pages.forEach(pageElement => {
        pageElement.classList.remove('active');
    });
    
    const targetPage = document.getElementById(`${page}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
        state.currentPage = page;
    }
    
    // Special handling for pages
    switch(page) {
        case 'home':
            updateRecentSearches();
            break;
        case 'search':
            if (state.searchResults.length > 0) {
                displaySearchResults(state.searchResults);
            }
            break;
        case 'lyrics':
            if (state.currentLyrics) {
                displayLyrics(state.currentLyrics);
            }
            break;
        case 'liked':
            displayLikedSongs();
            break;
    }
}

// ===== SEARCH FUNCTIONALITY =====
async function handleSearch() {
    const query = elements.searchInput.value.trim();
    if (!query) {
        showToast('Please enter a search query', 'warning');
        return;
    }
    
    state.searchQuery = query;
    state.isLoading = true;
    
    // Add to search history
    if (!state.searchHistory.includes(query)) {
        state.searchHistory.unshift(query);
        if (state.searchHistory.length > CONFIG.MAX_RECENT_SEARCHES) {
            state.searchHistory.pop();
        }
        updateRecentSearches();
        saveState();
    }
    
    // Show loading
    elements.loadingResults.style.display = 'block';
    elements.resultsContainer.innerHTML = '';
    
    // Check cache first
    const cacheKey = `${query}-${state.searchEngine}`;
    if (state.searchCache.has(cacheKey)) {
        const cached = state.searchCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
            processSearchResults(cached.data);
            return;
        }
    }
    
    try {
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/search?q=${encodeURIComponent(query)}&searchEngine=${state.searchEngine}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // Cache the results
        state.searchCache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });
        
        processSearchResults(data);
        
    } catch (error) {
        console.error('Search error:', error);
        showToast('Failed to search. Please try again.', 'error');
        elements.resultsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Search failed</p>
                <p class="hint">${error.message}</p>
            </div>
        `;
    } finally {
        state.isLoading = false;
        elements.loadingResults.style.display = 'none';
    }
}

function processSearchResults(data) {
    if (data.success && data.data && data.data.length > 0) {
        state.searchResults = data.data;
        displaySearchResults(data.data);
        navigateTo('search');
    } else {
        elements.resultsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>No results found for "${state.searchQuery}"</p>
                <p class="hint">Try different keywords or search engine</p>
            </div>
        `;
        elements.resultsCount.textContent = '0 results';
    }
}

function displaySearchResults(tracks) {
    elements.resultsCount.textContent = `${tracks.length} results`;
    
    const html = tracks.map((track, index) => `
        <div class="track-card" data-track-index="${index}">
            <div class="track-image-container">
                <img src="${track.image || 'https://via.placeholder.com/300x300?text=No+Image'}" 
                     alt="${track.title}" 
                     class="track-image"
                     onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                <div class="play-overlay">
                    <i class="fas fa-play"></i>
                </div>
            </div>
            <div class="track-info">
                <h4 class="track-title" title="${track.title}">${track.title}</h4>
                <p class="track-artist" title="${track.artists || 'Unknown Artist'}">
                    ${track.artists || 'Unknown Artist'}
                </p>
            </div>
            <div class="track-actions">
                <button class="btn-secondary play-btn" data-index="${index}">
                    <i class="fas fa-play"></i> Play
                </button>
                <button class="btn-secondary queue-btn" data-index="${index}">
                    <i class="fas fa-plus"></i> Queue
                </button>
                <button class="btn-secondary like-btn" data-track-id="${track.id}">
                    <i class="far fa-heart"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    elements.resultsContainer.innerHTML = html;
    
    // Add event listeners to new elements
    document.querySelectorAll('.track-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.track-actions')) {
                const index = parseInt(card.dataset.trackIndex);
                playTrackFromSearch(index);
            }
        });
    });
    
    document.querySelectorAll('.play-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            playTrackFromSearch(index);
        });
    });
    
    document.querySelectorAll('.queue-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            addTrackToQueue(state.searchResults[index]);
        });
    });
    
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const trackId = btn.dataset.trackId;
            const track = state.searchResults.find(t => t.id === trackId);
            if (track) {
                toggleLikeTrack(track);
                updateLikeButton(btn, track);
            }
        });
    });
}

// ===== PLAYBACK FUNCTIONS =====
async function playTrack(track) {
    if (!track || !track.id) {
        showToast('Invalid track', 'error');
        return;
    }
    
    try {
        // Show loading
        showToast(`Loading ${track.title}...`, 'info');
        
        // Check cache
        const cacheKey = `track-${track.id}`;
        if (state.trackCache.has(cacheKey)) {
            const cached = state.trackCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
                playAudio(cached.data.data, track);
                return;
            }
        }
        
        // Fetch track data
        const response = await fetch(`${CONFIG.API_BASE_URL}/fetch?id=${track.id}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (!data.success || !data.data) {
            throw new Error('No audio data received');
        }
        
        // Cache the result
        state.trackCache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });
        
        playAudio(data.data, track);
        
    } catch (error) {
        console.error('Play error:', error);
        showToast(`Failed to play ${track.title}`, 'error');
    }
}

function playAudio(audioUrl, track) {
    // Update state
    state.currentTrack = track;
    state.currentQueueIndex = state.queue.findIndex(t => t.id === track.id);
    
    // Update UI
    updateTrackInfo(track);
    updateLikeButtonState();
    
    // Set audio source
    elements.audioPlayer.src = audioUrl;
    elements.audioPlayer.load();
    
    // Play
    elements.audioPlayer.play().catch(error => {
        console.error('Playback failed:', error);
        showToast('Click play button to start playback', 'warning');
    });
    
    // Add to recently played
    addToRecentlyPlayed(track);
    
    // Fetch lyrics
    fetchLyrics(track.id);
}

function playTrackFromSearch(index) {
    const track = state.searchResults[index];
    if (!track) return;
    
    // Clear queue and add all search results
    state.queue = [...state.searchResults];
    state.currentQueueIndex = index;
    state.originalQueue = [...state.queue];
    
    playTrack(track);
    updateQueueCount();
}

function addTrackToQueue(track) {
    if (!track) return;
    
    state.queue.push(track);
    updateQueueCount();
    
    showToast(`Added "${track.title}" to queue`, 'success');
    
    // If this is the first track in queue and nothing is playing, play it
    if (state.queue.length === 1 && !state.currentTrack) {
        playTrack(track);
    }
}

function addToRecentlyPlayed(track) {
    // Remove if already exists
    state.recentlyPlayed = state.recentlyPlayed.filter(t => t.id !== track.id);
    
    // Add to beginning
    state.recentlyPlayed.unshift(track);
    
    // Limit size
    if (state.recentlyPlayed.length > 50) {
        state.recentlyPlayed.pop();
    }
    
    saveState();
}

function togglePlayPause() {
    if (!elements.audioPlayer.src) {
        if (state.queue.length > 0) {
            playTrack(state.queue[0]);
        }
        return;
    }
    
    if (state.isPlaying) {
        elements.audioPlayer.pause();
    } else {
        elements.audioPlayer.play().catch(error => {
            console.error('Play failed:', error);
            showToast('Playback failed. Please try again.', 'error');
        });
    }
}

function playPrevious() {
    if (state.queue.length === 0) return;
    
    let newIndex;
    if (state.isShuffled) {
        newIndex = Math.floor(Math.random() * state.queue.length);
    } else {
        newIndex = state.currentQueueIndex - 1;
        if (newIndex < 0) {
            if (state.repeatMode === 'all') {
                newIndex = state.queue.length - 1;
            } else {
                showToast('This is the first track', 'info');
                return;
            }
        }
    }
    
    const track = state.queue[newIndex];
    if (track) {
        state.currentQueueIndex = newIndex;
        playTrack(track);
    }
}

function playNext() {
    if (state.queue.length === 0) return;
    
    let newIndex;
    if (state.isShuffled) {
        newIndex = Math.floor(Math.random() * state.queue.length);
    } else {
        newIndex = state.currentQueueIndex + 1;
        if (newIndex >= state.queue.length) {
            if (state.repeatMode === 'all') {
                newIndex = 0;
            } else {
                showToast('Reached end of queue', 'info');
                return;
            }
        }
    }
    
    const track = state.queue[newIndex];
    if (track) {
        state.currentQueueIndex = newIndex;
        playTrack(track);
    }
}

function toggleShuffle() {
    state.isShuffled = !state.isShuffled;
    elements.shuffleBtn.classList.toggle('active', state.isShuffled);
    
    if (state.isShuffled) {
        // Shuffle the queue (keep current track in place)
        const currentTrack = state.queue[state.currentQueueIndex];
        const otherTracks = state.queue.filter((_, i) => i !== state.currentQueueIndex);
        
        // Fisher-Yates shuffle
        for (let i = otherTracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [otherTracks[i], otherTracks[j]] = [otherTracks[j], otherTracks[i]];
        }
        
        // Reconstruct queue with current track in place
        state.queue = [
            ...otherTracks.slice(0, state.currentQueueIndex),
            currentTrack,
            ...otherTracks.slice(state.currentQueueIndex)
        ];
        
        showToast('Shuffle enabled', 'success');
    } else {
        // Restore original order
        if (state.originalQueue.length > 0) {
            state.queue = [...state.originalQueue];
            state.currentQueueIndex = state.queue.findIndex(t => 
                t.id === state.currentTrack?.id
            );
        }
        showToast('Shuffle disabled', 'info');
    }
    
    saveState();
}

function toggleRepeat() {
    const modes = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(state.repeatMode);
    state.repeatMode = modes[(currentIndex + 1) % modes.length];
    
    // Update UI
    elements.repeatBtn.classList.remove('active', 'repeat-one');
    if (state.repeatMode !== 'none') {
        elements.repeatBtn.classList.add('active');
        if (state.repeatMode === 'one') {
            elements.repeatBtn.classList.add('repeat-one');
            elements.repeatBtn.innerHTML = '<i class="fas fa-redo"></i>1';
            showToast('Repeat one', 'success');
        } else {
            elements.repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';
            showToast('Repeat all', 'success');
        }
    } else {
        elements.repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';
        showToast('Repeat off', 'info');
    }
    
    elements.audioPlayer.loop = state.repeatMode === 'one';
}

// ===== VOLUME CONTROL =====
function setVolume(volume) {
    state.volume = Math.max(0, Math.min(100, volume));
    elements.audioPlayer.volume = state.volume / 100;
    elements.volumeSlider.value = state.volume;
    
    // Update mute button icon
    if (state.volume === 0) {
        elements.muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else if (state.volume < 50) {
        elements.muteBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
    } else {
        elements.muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
    
    saveState();
}

function toggleMute() {
    if (state.isMuted) {
        // Unmute
        state.isMuted = false;
        setVolume(state.previousVolume);
        showToast(`Volume: ${state.volume}%`, 'info');
    } else {
        // Mute
        state.isMuted = true;
        state.previousVolume = state.volume;
        setVolume(0);
        showToast('Muted', 'info');
    }
}

// ===== LYRICS =====
async function fetchLyrics(trackId) {
    if (!trackId) return;
    
    // Check cache
    if (state.lyricsCache.has(trackId)) {
        const cached = state.lyricsCache.get(trackId);
        if (Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
            displayLyrics(cached.data);
            return;
        }
    }
    
    elements.loadingLyrics.style.display = 'block';
    elements.lyricsContainer.innerHTML = '';
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/lyrics?id=${trackId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (data.success && data.data) {
            // Cache lyrics
            state.lyricsCache.set(trackId, {
                data: data.data,
                timestamp: Date.now()
            });
            
            state.currentLyrics = data.data;
            displayLyrics(data.data);
            
            if (state.currentPage === 'lyrics') {
                navigateTo('lyrics');
            }
        } else {
            displayLyrics('No lyrics available for this track.');
        }
    } catch (error) {
        console.error('Lyrics error:', error);
        displayLyrics('Failed to load lyrics.');
    } finally {
        elements.loadingLyrics.style.display = 'none';
    }
}

function displayLyrics(lyrics) {
    elements.lyricsContainer.innerHTML = `
        <div class="lyrics-content">
            ${typeof lyrics === 'string' ? lyrics.replace(/\n/g, '<br>') : 'No lyrics available'}
        </div>
    `;
}

function copyLyrics() {
    const lyrics = elements.lyricsContainer.innerText;
    if (!lyrics || lyrics.includes('Select a song to view lyrics')) {
        showToast('No lyrics to copy', 'warning');
        return;
    }
    
    navigator.clipboard.writeText(lyrics)
        .then(() => showToast('Lyrics copied to clipboard', 'success'))
        .catch(() => showToast('Failed to copy lyrics', 'error'));
}

// ===== QUEUE MANAGEMENT =====
function showQueueModal() {
    updateQueueList();
    elements.queueModal.style.display = 'block';
}

function hideQueueModal() {
    elements.queueModal.style.display = 'none';
}

function updateQueueList() {
    if (state.queue.length === 0) {
        elements.queueList.innerHTML = '';
        elements.emptyQueue.style.display = 'block';
        return;
    }
    
    elements.emptyQueue.style.display = 'none';
    
    const html = state.queue.map((track, index) => `
        <li class="${index === state.currentQueueIndex ? 'active' : ''}" data-index="${index}">
            <div class="queue-item-info">
                <img src="${track.image || 'https://via.placeholder.com/40'}" 
                     alt="${track.title}" 
                     class="queue-item-image">
                <div>
                    <strong class="queue-item-title">${track.title}</strong>
                    <br>
                    <small class="queue-item-artist">${track.artists || 'Unknown Artist'}</small>
                </div>
            </div>
            <div class="queue-item-actions">
                <button class="icon-btn play-queue-btn" data-index="${index}" title="Play">
                    <i class="fas fa-play"></i>
                </button>
                <button class="icon-btn remove-queue-btn" data-index="${index}" title="Remove">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </li>
    `).join('');
    
    elements.queueList.innerHTML = html;
    
    // Add event listeners
    document.querySelectorAll('.queue-item-info').forEach(item => {
        item.addEventListener('click', (e) => {
            const index = parseInt(e.target.closest('li').dataset.index);
            playTrackFromQueue(index);
        });
    });
    
    document.querySelectorAll('.play-queue-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            playTrackFromQueue(index);
        });
    });
    
    document.querySelectorAll('.remove-queue-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            removeFromQueue(index);
        });
    });
}

function updateQueueCount() {
    elements.queueCount.textContent = state.queue.length;
    saveState();
}

function clearQueue() {
    if (state.queue.length === 0) {
        showToast('Queue is already empty', 'info');
        return;
    }
    
    // Keep current track if playing
    const currentTrack = state.currentTrack;
    state.queue = currentTrack ? [currentTrack] : [];
    state.currentQueueIndex = currentTrack ? 0 : -1;
    state.originalQueue = [...state.queue];
    
    updateQueueList();
    updateQueueCount();
    showToast('Queue cleared', 'success');
}

function saveQueueAsPlaylist() {
    if (state.queue.length === 0) {
        showToast('Queue is empty', 'warning');
        return;
    }
    
    const playlistName = prompt('Enter playlist name:', `Queue ${new Date().toLocaleDateString()}`);
    if (!playlistName || playlistName.trim() === '') return;
    
    const newPlaylist = {
        id: `playlist-${Date.now()}`,
        name: playlistName.trim(),
        tracks: [...state.queue],
        created: new Date().toISOString()
    };
    
    state.playlists.push(newPlaylist);
    saveState();
    updatePlaylistsList();
    showToast(`Playlist "${playlistName}" created`, 'success');
}

function playTrackFromQueue(index) {
    if (index < 0 || index >= state.queue.length) return;
    
    state.currentQueueIndex = index;
    playTrack(state.queue[index]);
    hideQueueModal();
}

function removeFromQueue(index) {
    if (index < 0 || index >= state.queue.length) return;
    
    const track = state.queue[index];
    state.queue.splice(index, 1);
    
    // Adjust current index if needed
    if (state.currentQueueIndex >= index && state.currentQueueIndex > 0) {
        state.currentQueueIndex--;
    }
    
    updateQueueList();
    updateQueueCount();
    showToast(`Removed "${track.title}" from queue`, 'info');
}

// ===== LIKED SONGS =====
function toggleLike() {
    if (!state.currentTrack) {
        showToast('No track is playing', 'warning');
        return;
    }
    
    toggleLikeTrack(state.currentTrack);
    updateLikeButtonState();
}

function toggleLikeTrack(track) {
    const index = state.likedSongs.findIndex(t => t.id === track.id);
    
    if (index === -1) {
        // Add to liked songs
        state.likedSongs.push(track);
        showToast(`Added "${track.title}" to Liked Songs`, 'success');
    } else {
        // Remove from liked songs
        state.likedSongs.splice(index, 1);
        showToast(`Removed "${track.title}" from Liked Songs`, 'info');
    }
    
    updateLikedCount();
    saveState();
}

function updateLikeButtonState() {
    if (!state.currentTrack) return;
    
    const isLiked = state.likedSongs.some(t => t.id === state.currentTrack.id);
    const icon = isLiked ? 'fas fa-heart' : 'far fa-heart';
    const color = isLiked ? 'var(--primary-color)' : 'var(--text-secondary)';
    
    [elements.likeBtn, elements.playerLikeBtn, elements.miniLikeBtn].forEach(btn => {
        btn.innerHTML = `<i class="${icon}"></i>`;
        btn.style.color = color;
    });
}

function updateLikeButton(button, track) {
    const isLiked = state.likedSongs.some(t => t.id === track.id);
    const icon = isLiked ? 'fas fa-heart' : 'far fa-heart';
    const color = isLiked ? 'var(--primary-color)' : 'var(--text-secondary)';
    
    button.innerHTML = `<i class="${icon}"></i>`;
    button.style.color = color;
}

function updateLikedCount() {
    elements.likedCount.textContent = state.likedSongs.length;
}

function displayLikedSongs() {
    if (state.likedSongs.length === 0) {
        document.getElementById('liked-page').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart"></i>
                <p>No liked songs yet</p>
                <p class="hint">Like songs while listening to add them here</p>
            </div>
        `;
        return;
    }
    
    // Implementation for displaying liked songs page
}

// ===== PLAYLISTS =====
function updatePlaylistsList() {
    const html = state.playlists.map(playlist => `
        <li data-playlist-id="${playlist.id}">
            <i class="fas fa-list-music"></i>
            <span>${playlist.name}</span>
            <small>(${playlist.tracks.length})</small>
        </li>
    `).join('');
    
    elements.playlistList.innerHTML = html;
    
    // Add event listeners
    document.querySelectorAll('#playlist-list li').forEach(item => {
        item.addEventListener('click', () => {
            const playlistId = item.dataset.playlistId;
            viewPlaylist(playlistId);
        });
    });
}

function createPlaylist() {
    const name = prompt('Enter playlist name:');
    if (!name || name.trim() === '') return;
    
    const newPlaylist = {
        id: `playlist-${Date.now()}`,
        name: name.trim(),
        tracks: [],
        created: new Date().toISOString()
    };
    
    state.playlists.push(newPlaylist);
    saveState();
    updatePlaylistsList();
    showToast(`Playlist "${name}" created`, 'success');
}

function addToPlaylist() {
    if (!state.currentTrack) {
        showToast('No track is playing', 'warning');
        return;
    }
    
    if (state.playlists.length === 0) {
        showToast('Create a playlist first', 'warning');
        return;
    }
    
    // Create playlist selection dialog
    const playlistOptions = state.playlists.map(playlist => 
        `${playlist.name} (${playlist.tracks.length} tracks)`
    ).join('\n');
    
    const selection = prompt(
        `Add "${state.currentTrack.title}" to which playlist?\n\n${playlistOptions}`
    );
    
    if (!selection) return;
    
    const playlistIndex = state.playlists.findIndex(p => 
        selection.includes(p.name)
    );
    
    if (playlistIndex !== -1) {
        const playlist = state.playlists[playlistIndex];
        
        // Check if already in playlist
        if (playlist.tracks.some(t => t.id === state.currentTrack.id)) {
            showToast('Track already in playlist', 'info');
            return;
        }
        
        playlist.tracks.push(state.currentTrack);
        saveState();
        showToast(`Added to "${playlist.name}"`, 'success');
    }
}

function viewPlaylist(playlistId) {
    const playlist = state.playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    // Create a temporary search results page for playlist
    state.searchResults = playlist.tracks;
    displaySearchResults(playlist.tracks);
    navigateTo('search');
    showToast(`Viewing playlist: ${playlist.name}`, 'info');
}

// ===== THEME MANAGEMENT =====
function setupTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    
    // Update theme toggle button
    elements.themeToggle.innerHTML = state.theme === 'dark' 
        ? '<i class="fas fa-moon"></i>'
        : '<i class="fas fa-sun"></i>';
    
    // Update theme options
    elements.themeOptions.forEach(option => {
        option.classList.remove('active');
        if (option.dataset.theme === state.theme) {
            option.classList.add('active');
        }
    });
}

function toggleTheme() {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    setupTheme();
    saveState();
    showToast(`Theme: ${theme}`, 'success');
}

// ===== UI UPDATES =====
function updateUI() {
    updatePlayPauseButton();
    updateProgress();
    updateCurrentTime();
    updateDuration();
    updateTrackInfo(state.currentTrack);
    updateLikeButtonState();
    updateLikedCount();
    updateQueueCount();
    updateRecentSearches();
    updatePlaylistsList();
}

function updateTrackInfo(track) {
    if (!track) {
        track = {
            title: 'No track playing',
            artists: 'Select a song to play',
            image: 'https://via.placeholder.com/300x300?text=No+Track'
        };
    }
    
    const defaultImage = 'https://via.placeholder.com/300x300?text=No+Image';
    
    // Update all track info elements
    const elementsToUpdate = [
        { element: elements.currentTrackTitle, value: track.title },
        { element: elements.currentTrackArtist, value: track.artists || 'Unknown Artist' },
        { element: elements.playerTrackTitle, value: track.title },
        { element: elements.playerTrackArtist, value: track.artists || 'Unknown Artist' },
        { element: elements.largeTrackTitle, value: track.title },
        { element: elements.largeTrackArtist, value: track.artists || 'Unknown Artist' },
        { element: elements.miniTrackTitle, value: track.title },
        { element: elements.miniTrackArtist, value: track.artists || 'Unknown Artist' }
    ];
    
    elementsToUpdate.forEach(({ element, value }) => {
        if (element) element.textContent = value;
    });
    
    // Update images
    const imageElements = [
        elements.currentTrackImg,
        elements.playerTrackImg,
        elements.largeTrackImg,
        elements.miniTrackImg
    ];
    
    imageElements.forEach(img => {
        if (img) {
            img.src = track.image || defaultImage;
            img.onerror = () => {
                img.src = defaultImage;
            };
        }
    });
}

function updatePlayPauseButton() {
    const icon = state.isPlaying ? 'fa-pause' : 'fa-play';
    elements.playPauseBtn.innerHTML = `<i class="fas ${icon}"></i>`;
    
    // Also update large play button
    const largePlayBtn = document.getElementById('play-large-btn');
    if (largePlayBtn) {
        largePlayBtn.innerHTML = `<i class="fas ${icon}"></i>`;
    }
}

function updateProgress() {
    if (!elements.audioPlayer.duration) return;
    
    const percent = (state.currentTime / state.duration) * 100;
    elements.progressSlider.value = percent;
    
    // Update custom progress fill
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        progressFill.style.width = `${percent}%`;
    }
}

function updateCurrentTime() {
    elements.currentTime.textContent = formatTime(state.currentTime);
}

function updateDuration() {
    elements.duration.textContent = formatTime(state.duration);
}

function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateRecentSearches() {
    if (!elements.recentSearchesList) return;
    
    if (state.searchHistory.length === 0) {
        elements.recentSearchesList.innerHTML = `
            <div class="empty-state">
                <p>No recent searches</p>
            </div>
        `;
        return;
    }
    
    const html = state.searchHistory.map(query => `
        <div class="recent-item" data-query="${query}">
            <i class="fas fa-history"></i>
            ${query}
        </div>
    `).join('');
    
    elements.recentSearchesList.innerHTML = html;
    
    // Add event listeners
    document.querySelectorAll('.recent-item').forEach(item => {
        item.addEventListener('click', () => {
            const query = item.dataset.query;
            elements.searchInput.value = query;
            handleSearch();
        });
    });
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${getToastIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getToastIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'info': 
        default: return 'fa-info-circle';
    }
}

// ===== QUICK ACTIONS =====
function handleQuickAction(action) {
    switch(action) {
        case 'trending':
            elements.searchInput.value = 'latest songs 2024';
            handleSearch();
            break;
        case 'playlists':
            navigateTo('playlists');
            break;
        case 'search':
            elements.searchInput.focus();
            break;
    }
}

// ===== CACHE MANAGEMENT =====
function clearCache() {
    // Clear localStorage
    localStorage.clear();
    
    // Clear in-memory caches
    state.trackCache.clear();
    state.lyricsCache.clear();
    state.searchCache.clear();
    
    // Reset state
    state = {
        ...state,
        searchHistory: [],
        likedSongs: [],
        playlists: [
            { id: 'default-1', name: 'Favorites', tracks: [] },
            { id: 'default-2', name: 'Workout Mix', tracks: [] },
            { id: 'default-3', name: 'Chill Vibes', tracks: [] }
        ],
        recentlyPlayed: [],
        queue: [],
        currentQueueIndex: -1,
        originalQueue: []
    };
    
    // Update UI
    updateUI();
    showToast('Cache cleared successfully', 'success');
}

// ===== KEYBOARD SHORTCUTS =====
function handleKeyboardShortcuts(e) {
    // Don't trigger shortcuts when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    switch(e.key.toLowerCase()) {
        case ' ':
            e.preventDefault();
            togglePlayPause();
            break;
        case 'arrowleft':
            if (e.ctrlKey) {
                e.preventDefault();
                elements.audioPlayer.currentTime -= CONFIG.SEEK_INCREMENT;
            }
            break;
        case 'arrowright':
            if (e.ctrlKey) {
                e.preventDefault();
                elements.audioPlayer.currentTime += CONFIG.SEEK_INCREMENT;
            }
            break;
        case 'arrowup':
            if (e.ctrlKey) {
                e.preventDefault();
                setVolume(state.volume + CONFIG.VOLUME_INCREMENT);
            }
            break;
        case 'arrowdown':
            if (e.ctrlKey) {
                e.preventDefault();
                setVolume(state.volume - CONFIG.VOLUME_INCREMENT);
            }
            break;
        case 'm':
            if (e.ctrlKey) {
                e.preventDefault();
                toggleMute();
            }
            break;
        case 'l':
            if (e.ctrlKey) {
                e.preventDefault();
                toggleLike();
            }
            break;
        case 's':
            if (e.ctrlKey) {
                e.preventDefault();
                toggleShuffle();
            }
            break;
        case 'r':
            if (e.ctrlKey) {
                e.preventDefault();
                toggleRepeat();
            }
            break;
        case 'f':
            if (e.ctrlKey) {
                e.preventDefault();
                const playerBar = document.querySelector('.player-bar');
                playerBar.requestFullscreen?.();
            }
            break;
    }
}

// ===== NETWORK STATUS =====
function handleOnlineStatus() {
    showToast('You are back online', 'success');
}

function handleOfflineStatus() {
    showToast('You are offline. Some features may not work.', 'warning');
}

// ===== MODAL FUNCTIONS =====
function showSettingsModal() {
    elements.settingsModal.style.display = 'block';
}

function hideSettingsModal() {
    elements.settingsModal.style.display = 'none';
}

// ===== INITIALIZE APP =====
// Check if DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Make some functions globally available for inline event handlers
window.playTrackFromSearch = playTrackFromSearch;
window.addTrackToQueue = addTrackToQueue;
window.toggleLikeTrack = toggleLikeTrack;
window.updateLikeButton = updateLikeButton;

// Export for debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        state,
        CONFIG,
        init,
        playTrack,
        togglePlayPause,
        handleSearch
    };
}