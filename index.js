const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Search songs
app.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query required' });

    const response = await axios.get(
      'https://www.jiosaavn.com/api.php', {
        params: {
          __call: 'search.getResults',
          _format: 'json',
          _marker: '0',
          api_version: '4',
          ctx: 'web6dot0',
          query: query,
          n: '50',
          p: '1'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.jiosaavn.com/'
        }
      }
    );

    const results = response.data?.results || [];

    const songs = results.map(song => ({
      id: song.id,
      title: (song.title || song.song || 'Unknown')
        .replace(/&amp;/g, '&')
        .replace(/&#039;/g, "'")
        .replace(/<[^>]*>/g, ''),
      artistName: (song.primary_artists || song.singers || 'Unknown')
        .replace(/&amp;/g, '&')
        .replace(/<[^>]*>/g, ''),
      albumArt: (song.image || '')
        .replace('150x150', '500x500'),
      duration: parseInt(song.duration) || 0,
      encUrl: song.encrypted_media_url || '',
      preview: song.media_preview_url || ''
    })).filter(s => s.id);

    res.json({ songs });
  } catch (error) {
    res.status(500).json({ error: error.message, songs: [] });
  }
});

// Get full song URL
app.get('/song/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const encUrl = req.query.enc || '';

    // Method 1: Direct media URL
    const response = await axios.get(
      'https://www.jiosaavn.com/api.php', {
        params: {
          __call: 'song.generateAuthToken',
          _format: 'json',
          _marker: '0',
          bitrate: '320',
          url: encUrl,
          ctx: 'web6dot0'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.jiosaavn.com/'
        }
      }
    );

    const url = response.data?.auth_url || response.data?.url || '';
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: error.message, url: '' });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'SurTaal Backend Running!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
