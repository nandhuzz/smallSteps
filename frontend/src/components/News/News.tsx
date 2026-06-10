import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { GetIndianMarketNews, GetUpstoxMarketNews } from '../../../wailsjs/go/main/App';
import './News.css';

interface NewsArticle {
    title: string;
    description: string;
    url: string;
    publishedAt: string;
    source: string;
}

const News = () => {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadNews();
    }, []);

    const loadNews = async () => {
        try {
            // Try to get news from Upstox integration first
            const data = await GetUpstoxMarketNews();
            setNews(data || []);
        } catch (error) {
            console.error('Error loading news:', error);
            // Fallback to regular news API if Upstox fails
            try {
                const fallbackData = await GetIndianMarketNews();
                setNews(fallbackData || []);
            } catch (fallbackError) {
                console.error('Error loading fallback news:', fallbackError);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadNews();
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return <div className="container loading">Loading news...</div>;
    }

    return (
        <div className="container">
            <div className="header">
                <h1>📰 Market News</h1>
                <p>Latest Indian market updates</p>
            </div>

            <div className="news-controls">
                <button
                    className="action-button action-button-primary"
                    onClick={handleRefresh}
                    disabled={refreshing}
                >
                    {refreshing ? '🔄 Refreshing...' : '🔄 Refresh News'}
                </button>
                <div className="news-info">
                    <span>📡 {news.length} articles loaded</span>
                </div>
            </div>

            <div className="news-list">
                {news.length === 0 ? (
                    <div className="card">
                        <p style={{ textAlign: 'center', color: '#666' }}>
                            No news articles available. Click refresh to load latest news.
                        </p>
                    </div>
                ) : (
                    news.map((article, index) => (
                        <div key={index} className="news-card">
                            <div className="news-header">
                                <span className="news-source">{article.source}</span>
                                <span className="news-time">{formatTime(article.publishedAt)}</span>
                            </div>

                            <h3 className="news-title">{article.title}</h3>

                            {article.description && (
                                <p className="news-description">{article.description}</p>
                            )}

                            <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="news-link"
                            >
                                Read full article →
                            </a>
                        </div>
                    ))
                )}
            </div>

            <div className="news-footer">
                <p className="news-disclaimer">
                    ℹ️ News articles are fetched from external sources.
                    To enable real-time news, configure your NewsAPI key in app.go
                </p>
            </div>
        </div>
    );
};

export default News;

// Made with Bob
