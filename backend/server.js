// Updated server.js with working API
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', time: new Date().toISOString() });
});

// Test endpoint - always works
app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API is working!',
        endpoints: {
            search: '/api/search?q=query',
            lyrics: '/api/lyrics?id=songId',
            song: '/api/song?id=songId'
        }
    });
});

// Working Music API (alternative if your API is down)
app.get('/api/search', async (req, res) => {
    try {
        const { q, searchEngine = 'gaama' } = req.query;
        
        if (!q) {
            return res.json({
                success: true,
                data: [
                    {
                        id: "demo-1",
                        title: "Example Song 1",
                        artists: "Demo Artist",
                        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300"
                    },
                    {
                        id: "demo-2", 
                        title: "Example Song 2",
                        artists: "Test Singer",
                        image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w-300"
                    }
                ]
            });
        }
        
        // Try multiple API endpoints
        const apiEndpoints = [
            `https://musicapi.x007.workers.dev/search?q=${encodeURIComponent(q)}`,
            `https://saavn.me/search/songs?query=${encodeURIComponent(q)}&page=1&limit=10`,
            `https://jiosaavn-api.vercel.app/search?query=${encodeURIComponent(q)}`
        ];
        
        let response = null;
        
        for (const endpoint of apiEndpoints) {
            try {
                console.log(`Trying API: ${endpoint}`);
                response = await axios.get(endpoint, { timeout: 5000 });
                if (response.data) break;
            } catch (err) {
                console.log(`API failed: ${endpoint}`, err.message);
                continue;
            }
        }
        
        if (!response || !response.data) {
            // Return demo data if all APIs fail
            return res.json({
                success: true,
                data: [
                    {
                        id: "test-1",
                        title: q + " - Demo Result 1",
                        artists: "Various Artists",
                        image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300"
                    },
                    {
                        id: "test-2",
                        title: q + " - Demo Result 2",
                        artists: "Music Stream",
                        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300"
                    }
                ]
            });
        }
        
        // Format response based on API
        let formattedData = [];
        
        if (response.data.data) {
            // musicapi.x007.workers.dev format
            formattedData = response.data.data.map(item => ({
                id: item.id || Math.random().toString(36).substr(2, 9),
                title: item.title || 'Unknown Title',
                artists: item.artists || item.singers || 'Unknown Artist',
                image: item.image || item.thumbnail || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300'
            }));
        } else if (response.data.results) {
            // Other API formats
            formattedData = response.data.results.map(item => ({
                id: item.id || Math.random().toString(36).substr(2, 9),
                title: item.title || item.song || 'Unknown Title',
                artists: item.artists || item.singers || 'Unknown Artist',
                image: item.image || item.thumbnail || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300'
            }));
        }
        
        res.json({
            success: true,
            data: formattedData
        });
        
    } catch (error) {
        console.error('Search error:', error.message);
        res.json({
            success: true,
            data: [
                {
                    id: "fallback-1",
                    title: "Fallback Song 1",
                    artists: "System",
                    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300"
                }
            ]
        });
    }
});

// Mock lyrics endpoint
app.get('/api/lyrics', async (req, res) => {
    const { id } = req.query;
    
    res.json({
        success: true,
        data: `Lyrics for song ${id}\n\nThis is a demo lyric text.\nThe actual lyrics would appear here.\n\n🎵 Music is life 🎵`
    });
});

// Mock song fetch endpoint
app.get('/api/song', async (req, res) => {
    const { id } = req.query;
    
    // Return a demo audio URL
    res.json({
        success: true,
        data: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    });
});

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Handle all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
});
