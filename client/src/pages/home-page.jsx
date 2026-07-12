/* Home page — hero section, folder cards, recent memes */
import { useState, useEffect } from 'react';
import { getStats, getMemes } from '../services/api-service';
import FolderCard from '../components/folder-card';
import MemeCard from '../components/meme-card';
import MediaViewerModal from '../components/media-viewer-modal';
import './home-page.css';

export default function HomePage() {
  const [stats, setStats] = useState({ images: 0, gifs: 0, videos: 0 });
  const [recentMemes, setRecentMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeme, setSelectedMeme] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, memesData] = await Promise.all([
          getStats(),
          getMemes(),
        ]);
        setStats(statsData);
        setRecentMemes(memesData.slice(0, 6));
      } catch (err) {
        console.error('Failed to fetch homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  /* Listen to global events for optimistic updates without reloading */
  useEffect(() => {
    const handleUpload = (e) => {
      setRecentMemes((prev) => [e.detail, ...prev].slice(0, 6));
      setStats((prev) => {
        const key = e.detail.media_type + 's';
        return { ...prev, [key]: (prev[key] || 0) + 1 };
      });
    };
    const handleReact = (e) => {
      const { memeId, likes, dislikes, userReaction } = e.detail;
      setRecentMemes((prev) => prev.map(m => 
        m.id === memeId ? { ...m, like_count: likes, dislike_count: dislikes, user_reaction: userReaction } : m
      ));
      if (selectedMeme?.id === memeId) {
        setSelectedMeme((prev) => ({ ...prev, like_count: likes, dislike_count: dislikes, user_reaction: userReaction }));
      }
    };
    const handleEdit = (e) => {
      const edited = e.detail;
      setRecentMemes((prev) => prev.map((m) => (m.id === edited.id ? { ...m, title: edited.title, description: edited.description } : m)));
      if (selectedMeme?.id === edited.id) {
        setSelectedMeme((prev) => ({ ...prev, title: edited.title, description: edited.description }));
      }
    };
    const handleDelete = (e) => {
      const deletedId = e.detail;
      setRecentMemes((prev) => prev.filter((m) => m.id !== deletedId));
      if (selectedMeme?.id === deletedId) setSelectedMeme(null);
    };

    window.addEventListener('meme-uploaded', handleUpload);
    window.addEventListener('meme-reacted', handleReact);
    window.addEventListener('meme-edited', handleEdit);
    window.addEventListener('meme-deleted', handleDelete);
    return () => {
      window.removeEventListener('meme-uploaded', handleUpload);
      window.removeEventListener('meme-reacted', handleReact);
      window.removeEventListener('meme-edited', handleEdit);
      window.removeEventListener('meme-deleted', handleDelete);
    };
  }, [selectedMeme]);

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="home__hero">
        <h1 className="home__title">
          Welcome to <span className="home__title-accent">Foru</span>
        </h1>
        <p className="home__subtitle">
          A cozy little corner for memes, vibes, and good times.
        </p>
      </section>

      {/* Folder Cards */}
      <section className="home__folders container">
        <h2 className="home__section-heading">Browse by Category</h2>
        <div className="home__folder-grid">
          <FolderCard type="image" count={stats.images || 0} />
          <FolderCard type="gif" count={stats.gifs || 0} />
          <FolderCard type="video" count={stats.videos || 0} />
        </div>
      </section>

      {/* Recent Uploads */}
      <section className="home__recent container">
        <h2 className="home__section-heading">Recent Uploads</h2>

        {loading ? (
          <div className="home__skeleton-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="home__skeleton-card" />
            ))}
          </div>
        ) : recentMemes.length === 0 ? (
          <div className="home__empty">
            <p className="home__empty-text">No memes yet... be the first!</p>
          </div>
        ) : (
          <div className="home__meme-grid">
            {recentMemes.map((meme) => (
              <MemeCard
                key={meme.id}
                meme={meme}
                onClick={() => setSelectedMeme(meme)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Media Viewer Modal */}
      <MediaViewerModal
        meme={selectedMeme}
        isOpen={!!selectedMeme}
        onClose={() => setSelectedMeme(null)}
      />
    </div>
  );
}
