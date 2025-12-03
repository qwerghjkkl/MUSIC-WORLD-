const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'MusicStream API is running!' });
});

// DEMO API Endpoints (Always work)
app.get('/api/search', (req, res) => {
    const { q } = req.query;
    
    const demoResults = [
        {
            id: "song-1",
            title: q ? `${q} - Song 1` : "Blinding Lights",
            artists: "The Weeknd",
            image: "https://i.scdn.co/image/ab67616d00001e02/88625d2f0c0f5e8c8871d6f43719af582c2b6e55",
            duration: "3:22"
        },
        {
            id: "song-2",
            title: q ? `${q} - Song 2` : "Shape of You",
            artists: "Ed Sheeran",
            image: "https://i.scdn.co/image/ab67616d00001e02/84243e4c6b2c6e19e5e11a0a2c52c8172e9b5583",
            duration: "3:54"
        },
        {
            id: "song-3",
            title: q ? `${q} - Song 3` : "Dance Monkey",
            artists: "Tones and I",
            image: "https://i.scdn.co/image/ab67616d00001e02/418a3eaf6b54c2a0d9b8b4b3c5f5f5f5",
            duration: "3:30"
        },
        {
            id: "song-4",
            title: q ? `${q} - Song 4` : "Bad Guy",
            artists: "Billie Eilish",
            image: "https://i.scdn.co/image/ab67616d00001e02/3a7f5e2f2c2c2c2c2c2c2c2c2c2c2c2c",
            duration: "3:14"
        },
        {
            id: "song-5",
            title: q ? `${q} - Song 5` : "Levitating",
            artists: "Dua Lipa",
            image: "https://i.scdn.co/image/ab67616d00001e02/5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c",
            duration: "3:24"
        }
    ];
    
    res.json({
        success: true,
        data: demoResults
    });
});

app.get('/api/lyrics', (req, res) => {
    res.json({
        success: true,
        data: `🎵 Demo Lyrics 🎵\n\nThis is a sample lyric text.\nWhen you implement a real API,\nactual song lyrics will appear here.\n\nMusic makes the world go round!`
    });
});

app.get('/api/fetch', (req, res) => {
    // Return a working demo audio URL
    const demoAudioUrls = [
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
    ];
    
    const randomUrl = demoAudioUrls[Math.floor(Math.random() * demoAudioUrls.length)];
    
    res.json({
        success: true,
        data: randomUrl
    });
});

// Serve frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Handle all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`
🚀 MusicStream Server Started!
──────────────────────────────
✅ Port: ${PORT}
✅ Health: http://localhost:${PORT}/health
✅ API: http://localhost:${PORT}/api/search?q=test
✅ Frontend: http://localhost:${PORT}
──────────────────────────────
    `);
});
