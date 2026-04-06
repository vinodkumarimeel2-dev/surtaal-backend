const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query required' });

    const response = await axios.get(
      'https://www.jiosaavn.com/api.php', {
        params: {
          __call: 'autocomplete.get',
          _format: 'json',
          _marker: '0',
          cc: 'in',
          includeMetaTags: '1',
          query: query
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8'
        }
      }
    );

    const songResults = response.data?.songs?.data || [];

    const songs = songResults.map(song => ({
      id: song.id,
      title: (song.title || 'Unknown').replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/<[^>]*>/g, ''),
      artistName: (song.more_info?.primary_artists || song.description || 'Unknown').replace(/&amp;/g, '&').replace(/<[^>]*>/g, ''),
      albumArt: (song.image || '').replace('150x150', '500x500').replace('50x50', '500x500'),
      duration: parseInt(song.more_info?.duration) || 0,
      preview: song.more_info?.vcode || ''
    })).filter(s => s.id);

    res.json({ songs });
  } catch (error) {
    res.status(500).json({ error: error.message, songs: [] });
  }
});

app.get('/song/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const response = await axios.get(
      'https://www.jiosaavn.com/api.php', {
        params: {
          __call: 'song.generateAuthToken',
          _format: 'json',
          bitrate: '320',
          url: `https://www.jiosaavn.com/song/x/${id}`,
          ctx: 'web6dot0',
          _marker: '0'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      }
    );

    const url = response.data?.auth_url || '';
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
