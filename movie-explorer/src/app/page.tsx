// src/app/page.tsx
'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';

// Define the shape (interface) of the movie data for TypeScript safety
interface CastMember {
  cast_id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface Review {
  author: string;
  content: string;
  url: string;
}

interface RecommendedMovie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
}

interface MovieData {
  title: string;
  tagline: string;
  overview: string;
  release_date: string;
  runtime: number;
  vote_average: number;
  poster_path: string | null;
  genres: { id: number, name: string }[];
  credits: { cast: CastMember[] };
  reviews: { results: Review[] };
  recommendations: { results: RecommendedMovie[] };
}

// --- Custom Hook for LocalStorage ---
const useLocalStorage = (key: string, defaultValue: string[]) => {
  const [value, setValue] = useState<string[]>(() => {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value]);

  return [value, setValue] as const;
};

// --- Custom Hook for Drag Scroll ---
const useDragScroll = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true);
      setStartX(e.pageX - element.offsetLeft);
      setScrollLeft(element.scrollLeft);
      element.style.cursor = 'grabbing';
    };

    const handleMouseLeave = () => {
      setIsDragging(false);
      element.style.cursor = 'grab';
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      element.style.cursor = 'grab';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - element.offsetLeft;
      const walk = (x - startX) * 2; // Scroll speed
      element.scrollLeft = scrollLeft - walk;
    };

    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mousemove', handleMouseMove);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging, startX, scrollLeft]);

  return ref;
};

// --- Helper Components for Clean UI ---

// FEATURE 1: Skeleton Loading Component
const MovieSkeleton: React.FC = () => (
  <div className="bg-secondary-dark rounded-xl p-8 shadow-2xl animate-pulse">
    <div className="flex flex-col md:flex-row gap-8">
      {/* Poster Skeleton */}
      <div className="w-full md:w-1/3 h-96 bg-gray-700 rounded-lg"></div>

      {/* Details Skeleton */}
      <div className="flex-1 space-y-4">
        <div className="h-10 bg-gray-700 rounded w-3/4"></div>
        <div className="h-6 bg-gray-700 rounded w-1/2"></div>
        
        {/* Badges */}
        <div className="flex gap-3">
          <div className="h-8 w-20 bg-gray-700 rounded-full"></div>
          <div className="h-8 w-32 bg-gray-700 rounded-full"></div>
          <div className="h-8 w-24 bg-gray-700 rounded-full"></div>
        </div>

        {/* Genres */}
        <div className="space-y-2">
          <div className="h-6 bg-gray-700 rounded w-24"></div>
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-gray-700 rounded-full"></div>
            <div className="h-8 w-24 bg-gray-700 rounded-full"></div>
            <div className="h-8 w-20 bg-gray-700 rounded-full"></div>
          </div>
        </div>

        {/* Overview */}
        <div className="space-y-2">
          <div className="h-6 bg-gray-700 rounded w-32"></div>
          <div className="h-4 bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    </div>

    {/* Cast Skeleton */}
    <div className="mt-8">
      <div className="h-8 bg-gray-700 rounded w-32 mb-4"></div>
      <div className="flex gap-4 overflow-x-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex-shrink-0 w-32">
            <div className="w-full h-48 bg-gray-700 rounded-lg"></div>
            <div className="mt-2 h-4 bg-gray-700 rounded"></div>
            <div className="mt-1 h-3 bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Component to display a single cast member
const CastMemberCard: React.FC<{ member: CastMember }> = ({ member }) => {
  const imageUrl = member.profile_path
    ? `https://image.tmdb.org/t/p/w200${member.profile_path}`
    : 'https://via.placeholder.com/200?text=No+Image';

  return (
    <div className="flex-shrink-0 w-32 text-center">
      <img
        src={imageUrl}
        alt={member.name}
        draggable="false"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        className="w-full h-48 object-cover rounded-lg shadow-md"
      />
      <p className="mt-2 text-sm font-semibold">{member.name}</p>
      <p className="text-xs text-gray-400">as {member.character}</p>
    </div>
  );
};

// Component to display a single review
const ReviewCard: React.FC<{ review: Review }> = ({ review }) => (
  <div className="bg-secondary-dark p-4 rounded-lg shadow-md mb-4">
    <h4 className="font-bold text-accent mb-2">{review.author}</h4>
    <p className="text-sm text-gray-300 line-clamp-3">{review.content}</p>
    <a
      href={review.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent text-xs mt-2 inline-block hover:underline"
    >
      Read Full Review →
    </a>
  </div>
);

// FEATURE 2: Recommended Movie Card Component
const RecommendedMovieCard: React.FC<{ 
  movie: RecommendedMovie; 
  onMovieClick: (title: string) => void 
}> = ({ movie, onMovieClick }) => {
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
    : 'https://via.placeholder.com/200x300?text=No+Poster';

  return (
    <div 
      className="flex-shrink-0 w-40 cursor-pointer group"
      onClick={() => onMovieClick(movie.title)}
    >
      <img
        src={posterUrl}
        alt={movie.title}
        draggable="false"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        className="w-full h-60 object-cover rounded-lg shadow-md group-hover:scale-105 transition-transform"
      />
      <p className="mt-2 text-sm font-semibold line-clamp-2 group-hover:text-accent">
        {movie.title}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-accent">⭐ {movie.vote_average.toFixed(1)}</span>
        <span className="text-xs text-gray-400">
          {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
        </span>
      </div>
    </div>
  );
};

// Component to display movie details
const MovieDetails: React.FC<{ 
  movie: MovieData; 
  onRecommendedClick: (title: string) => void 
}> = ({ movie, onRecommendedClick }) => {
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://via.placeholder.com/500?text=No+Poster';

  const topCast = useMemo(() => movie.credits.cast.slice(0, 6), [movie.credits.cast]);
  const recommendations = useMemo(
    () => movie.recommendations?.results?.slice(0, 10) || [], 
    [movie.recommendations]
  );

  // Drag scroll hooks for horizontal sections
  const castScrollRef = useDragScroll();
  const recommendScrollRef = useDragScroll();

  return (
    <div className="bg-secondary-dark rounded-xl p-8 shadow-2xl">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Poster */}
        <img
          src={posterUrl}
          alt={movie.title}
          draggable="false"
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          className="w-full md:w-1/3 rounded-lg poster-shadow"
        />

        {/* Details */}
        <div className="flex-1">
          <h2 className="text-4xl font-bold text-accent mb-2">{movie.title}</h2>
          <p className="text-lg italic text-gray-400 mb-4">
            {movie.tagline || 'A great cinematic experience.'}
          </p>

          {/* Key Info Badges */}
          <div className="flex flex-wrap gap-3 mb-4">
            <span className="bg-accent text-white px-3 py-1 rounded-full text-sm font-semibold">
              ⭐ {movie.vote_average.toFixed(1)}
            </span>
            <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">
              📅 {movie.release_date}
            </span>
            <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">
              ⏱️ {movie.runtime} min
            </span>
          </div>

          {/* Genres */}
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">Genres</h3>
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="bg-gray-700 px-3 py-1 rounded-full text-sm"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          </div>

          {/* Overview */}
          <div>
            <h3 className="text-xl font-semibold mb-2">Overview</h3>
            <p className="text-gray-300 leading-relaxed">{movie.overview}</p>
          </div>
        </div>
      </div>

      {/* Cast Section with Drag Scroll */}
      {topCast.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-semibold mb-4">Top Cast</h3>
          <div 
            ref={castScrollRef}
            className="flex gap-4 overflow-x-auto pb-4 draggable-scroll no-scrollbar"
          >
            {topCast.map((member) => (
              <CastMemberCard key={member.cast_id} member={member} />
            ))}
          </div>
        </div>
      )}

      {/* FEATURE 2: Recommendations Section with Drag Scroll */}
      {recommendations.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-semibold mb-4">Similar Movies You Might Like</h3>
          <div 
            ref={recommendScrollRef}
            className="flex gap-4 overflow-x-auto pb-4 draggable-scroll no-scrollbar"
          >
            {recommendations.map((recMovie) => (
              <RecommendedMovieCard 
                key={recMovie.id} 
                movie={recMovie} 
                onMovieClick={onRecommendedClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      {movie.reviews.results.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-semibold mb-4">User Reviews</h3>
          <div className="max-h-96 overflow-y-auto">
            {movie.reviews.results.slice(0, 3).map((review, index) => (
              <ReviewCard key={index} review={review} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Component ---
export default function Home() {
  const [title, setTitle] = useState('');
  const [movieData, setMovieData] = useState<MovieData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // FEATURE 3: Search History with LocalStorage
  const [searchHistory, setSearchHistory] = useLocalStorage('movieSearchHistory', []);

  // Disable right-click on entire page
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    
    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Function to add search to history
  const addToHistory = useCallback((searchTerm: string) => {
    setSearchHistory((prev) => {
      const newHistory = [searchTerm, ...prev.filter(item => item !== searchTerm)];
      return newHistory.slice(0, 5);
    });
  }, [setSearchHistory]);

  // Function to clear history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, [setSearchHistory]);

  // useCallback to prevent unnecessary re-creations of the function
  const searchMovie = useCallback(async (searchTerm?: string) => {
    const movieTitle = searchTerm || title;
    
    if (!movieTitle.trim()) {
      setError('Please enter a movie title.');
      return;
    }

    setLoading(true);
    setError('');
    setMovieData(null);

    try {
      const response = await fetch(`/api/search?title=${encodeURIComponent(movieTitle)}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to fetch movie data.');
        return;
      }

      setMovieData(data);
      addToHistory(movieTitle);
      if (!searchTerm) setTitle('');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [title, addToHistory]);

  // Handle recommended movie click
  const handleRecommendedClick = useCallback((movieTitle: string) => {
    setTitle(movieTitle);
    searchMovie(movieTitle);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchMovie]);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <h1 className="text-5xl font-extrabold text-center mb-8 text-accent">
          🎬 Movie Explorer
        </h1>

        {/* Search Bar */}
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchMovie()}
            placeholder="Enter a movie title..."
            className="flex-1 px-4 py-3 rounded-lg bg-secondary-dark text-text-light border border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={() => searchMovie()}
            disabled={loading}
            className="px-6 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* FEATURE 3: Search History */}
        {searchHistory.length > 0 && !loading && !movieData && (
          <div className="bg-secondary-dark rounded-lg p-4 mb-8">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-400">Recent Searches</h3>
              <button
                onClick={clearHistory}
                className="text-xs text-accent hover:underline"
              >
                Clear History
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setTitle(search);
                    searchMovie(search);
                  }}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-sm transition"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-8">
            Error: {error}
          </div>
        )}

        {/* FEATURE 1: Loading Skeleton */}
        {loading && <MovieSkeleton />}

        {/* Movie Details */}
        {movieData && !loading && (
          <MovieDetails 
            movie={movieData} 
            onRecommendedClick={handleRecommendedClick}
          />
        )}

        {/* Empty State */}
        {!movieData && !loading && !error && (
          <div className="text-center text-gray-400 mt-16">
            <p className="text-2xl">🎬 Your cinematic journey begins here!</p>
            <p className="mt-2">Enter a title above to fetch details from TMDb.</p>
          </div>
        )}
      </div>
    </div>
  );
}
