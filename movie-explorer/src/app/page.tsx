// src/app/page.tsx
'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';

// --- Interfaces ---
interface CastMember {
  cast_id: number;
  id: number;
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

// Updated Actor Data Interface
interface ActorFilmography {
  actor: {
    name: string;
    biography: string;
    birthday: string;
    place_of_birth: string;
    profile_path: string | null;
  };
  pastMovies: Array<any>;
  upcomingMovies: Array<any>;
}

// --- Custom Hooks ---
const useLocalStorage = (key: string, defaultValue: string[]) => {
  const [value, setValue] = useState<string[]>(defaultValue);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    if (!isClient) return;
    try {
      const item = localStorage.getItem(key);
      if (item) setValue(JSON.parse(item));
    } catch (e) { console.error(e); }
  }, [key, isClient]);

  useEffect(() => {
    if (!isClient) return;
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value, isClient]);

  return [value, setValue] as const;
};

const useDragScroll = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const onDown = (e: MouseEvent) => { setIsDragging(true); setStartX(e.pageX - element.offsetLeft); setScrollLeft(element.scrollLeft); };
    const onLeave = () => setIsDragging(false);
    const onUp = () => setIsDragging(false);
    const onMove = (e: MouseEvent) => { if(!isDragging) return; e.preventDefault(); const x = e.pageX - element.offsetLeft; const walk = (x - startX) * 2; element.scrollLeft = scrollLeft - walk; };
    
    element.addEventListener('mousedown', onDown);
    element.addEventListener('mouseleave', onLeave);
    element.addEventListener('mouseup', onUp);
    element.addEventListener('mousemove', onMove);
    return () => { element.removeEventListener('mousedown', onDown); element.removeEventListener('mouseleave', onLeave); element.removeEventListener('mouseup', onUp); element.removeEventListener('mousemove', onMove); };
  }, [isDragging, startX, scrollLeft]);
  return ref;
};

// --- Components ---

// 1. Actor Modal (New Feature)
const ActorModal: React.FC<{
  actorData: ActorFilmography | null;
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
}> = ({ actorData, isOpen, onClose, loading }) => {
  const pastScroll = useDragScroll();
  const upcomingScroll = useDragScroll();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-secondary-dark rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl p-6 md:p-8" onClick={e => e.stopPropagation()}>
        {loading ? (
          <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto"></div><p className="mt-4 text-gray-400">Loading details...</p></div>
        ) : actorData ? (
          <>
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-bold text-white">{actorData.actor.name}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <img src={actorData.actor.profile_path ? `https://image.tmdb.org/t/p/w300${actorData.actor.profile_path}` : 'https://placehold.co/300x450?text=No+Image'} className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-full border-4 border-gray-700 shadow-lg" alt={actorData.actor.name} />
              <div>
                <div className="text-sm text-gray-400 mb-2">
                  {actorData.actor.birthday && <span>🎂 {new Date(actorData.actor.birthday).getFullYear()} </span>}
                  {actorData.actor.place_of_birth && <span>📍 {actorData.actor.place_of_birth}</span>}
                </div>
                <p className="text-sm text-gray-300 line-clamp-4">{actorData.actor.biography || "No biography available."}</p>
              </div>
            </div>

            {/* Past Movies */}
            {actorData.pastMovies.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-accent mb-3">⭐ Top Rated Movies</h3>
                <div ref={pastScroll} className="flex gap-4 overflow-x-auto pb-2 draggable-scroll no-scrollbar">
                  {actorData.pastMovies.map((m) => (
                    <div key={m.id} className="flex-shrink-0 w-32">
                      <img src={m.poster_path ? `https://image.tmdb.org/t/p/w200${m.poster_path}` : 'https://placehold.co/200x300?text=No+Poster'} className="w-full h-48 object-cover rounded-lg mb-2" alt={m.title}/>
                      <p className="text-xs text-white truncate">{m.title}</p>
                      <p className="text-[10px] text-gray-400">{m.vote_average.toFixed(1)} ⭐</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Movies */}
            {actorData.upcomingMovies.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-3">🎬 Upcoming Projects</h3>
                <div ref={upcomingScroll} className="flex gap-4 overflow-x-auto pb-2 draggable-scroll no-scrollbar">
                  {actorData.upcomingMovies.map((m) => (
                    <div key={m.id} className="flex-shrink-0 w-32 opacity-80 hover:opacity-100 transition">
                      <img src={m.poster_path ? `https://image.tmdb.org/t/p/w200${m.poster_path}` : 'https://placehold.co/200x300/334155/ffffff?text=Coming+Soon'} className="w-full h-48 object-cover rounded-lg mb-2" alt={m.title}/>
                      <p className="text-xs text-white truncate">{m.title}</p>
                      <p className="text-[10px] text-blue-300">Coming: {m.release_date || 'TBA'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : <p className="text-red-400">Data not available</p>}
      </div>
    </div>
  );
};

// 2. Skeleton (Original Style)
const MovieSkeleton = () => (
  <div className="bg-secondary-dark rounded-xl p-8 shadow-2xl animate-pulse">
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-1/3 h-96 bg-gray-700 rounded-lg"></div>
      <div className="flex-1 space-y-4">
        <div className="h-10 bg-gray-700 rounded w-3/4"></div>
        <div className="h-6 bg-gray-700 rounded w-1/2"></div>
        <div className="flex gap-3"><div className="h-8 w-20 bg-gray-700 rounded-full"></div><div className="h-8 w-32 bg-gray-700 rounded-full"></div></div>
        <div className="space-y-2 mt-4"><div className="h-4 bg-gray-700 rounded w-full"></div><div className="h-4 bg-gray-700 rounded w-full"></div></div>
      </div>
    </div>
  </div>
);

// 3. Main Movie Details
const MovieDetails: React.FC<{ 
  movie: MovieData; 
  onRecommendedClick: (title: string) => void;
  onActorClick: (id: number) => void;
}> = ({ movie, onRecommendedClick, onActorClick }) => {
  const topCast = movie.credits.cast.slice(0, 10);
  const recommendations = movie.recommendations?.results?.slice(0, 10) || [];
  const scrollRef = useDragScroll();
  const recScrollRef = useDragScroll();

  return (
    <div className="bg-secondary-dark rounded-xl p-8 shadow-2xl">
      <div className="flex flex-col md:flex-row gap-8">
        <img src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://placehold.co/500x750?text=No+Poster'} alt={movie.title} className="w-full md:w-1/3 rounded-lg poster-shadow" />
        <div className="flex-1">
          <h2 className="text-4xl font-bold text-accent mb-2">{movie.title}</h2>
          <p className="text-lg italic text-gray-400 mb-4">{movie.tagline}</p>
          <div className="flex gap-3 mb-4">
            <span className="bg-accent text-white px-3 py-1 rounded-full text-sm font-semibold">⭐ {movie.vote_average.toFixed(1)}</span>
            <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">📅 {movie.release_date?.split('-')[0]}</span>
            <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">⏱️ {movie.runtime} min</span>
          </div>
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">Genres</h3>
            <div className="flex flex-wrap gap-2">
              {movie.genres.map(g => <span key={g.id} className="bg-gray-700 px-3 py-1 rounded-full text-sm">{g.name}</span>)}
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Overview</h3>
          <p className="text-gray-300 leading-relaxed">{movie.overview}</p>
        </div>
      </div>

      {/* Cast (With Click Handler) */}
      {topCast.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-semibold mb-4">Top Cast <span className="text-sm text-gray-500 font-normal ml-2">(Click for details)</span></h3>
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 draggable-scroll no-scrollbar">
            {topCast.map(member => (
              <div key={member.cast_id} className="flex-shrink-0 w-32 text-center cursor-pointer group" onClick={() => onActorClick(member.id)}>
                <div className="relative overflow-hidden rounded-lg">
                  <img src={member.profile_path ? `https://image.tmdb.org/t/p/w200${member.profile_path}` : 'https://placehold.co/200x300?text=No+Image'} 
                       alt={member.name} className="w-full h-48 object-cover shadow-md group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
                </div>
                <p className="mt-2 text-sm font-semibold group-hover:text-accent transition-colors">{member.name}</p>
                <p className="text-xs text-gray-400 truncate">{member.character}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-semibold mb-4">Similar Movies</h3>
          <div ref={recScrollRef} className="flex gap-4 overflow-x-auto pb-4 draggable-scroll no-scrollbar">
            {recommendations.map(m => (
              <div key={m.id} className="flex-shrink-0 w-40 cursor-pointer group" onClick={() => onRecommendedClick(m.title)}>
                <img src={m.poster_path ? `https://image.tmdb.org/t/p/w200${m.poster_path}` : 'https://placehold.co/200x300?text=No+Poster'} 
                     className="w-full h-60 object-cover rounded-lg shadow-md group-hover:scale-105 transition-transform" alt={m.title} />
                <p className="mt-2 text-sm font-semibold line-clamp-2 group-hover:text-accent">{m.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Page ---
export default function Home() {
  const [title, setTitle] = useState('');
  const [movieData, setMovieData] = useState<MovieData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchHistory, setSearchHistory] = useLocalStorage('movieSearchHistory', []);
  
  // Actor Modal State
  const [actorModalOpen, setActorModalOpen] = useState(false);
  const [actorData, setActorData] = useState<ActorFilmography | null>(null);
  const [actorLoading, setActorLoading] = useState(false);

  const searchMovie = useCallback(async (searchTerm?: string) => {
    const query = searchTerm || title;
    if (!query.trim()) return setError('Please enter a title.');
    
    setLoading(true); setError(''); setMovieData(null);
    
    try {
      const res = await fetch(`/api/search?title=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      setMovieData(data);
      setSearchHistory(prev => [query, ...prev.filter(x => x !== query)].slice(0, 5));
      if (!searchTerm) setTitle('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [title, setSearchHistory]);

  const handleActorClick = async (id: number) => {
    setActorModalOpen(true);
    setActorLoading(true);
    setActorData(null);
    try {
      const res = await fetch(`/api/actor?id=${id}`);
      const data = await res.json();
      if (res.ok) setActorData(data);
    } catch (e) { console.error(e); }
    finally { setActorLoading(false); }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        {/* Restored Original Header Style */}
        <h1 className="text-5xl font-extrabold text-center mb-8 text-accent">
          🎬 Movie Explorer
        </h1>

        {/* Restored Original Input Style */}
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

        {/* Recent Searches */}
        {searchHistory.length > 0 && !loading && !movieData && (
          <div className="bg-secondary-dark rounded-lg p-4 mb-8">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-400">Recent Searches</h3>
              <button onClick={() => setSearchHistory([])} className="text-xs text-accent hover:underline">Clear History</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((s, i) => (
                <button key={i} onClick={() => { setTitle(s); searchMovie(s); }} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-sm transition">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <div className="bg-red-600 text-white p-4 rounded-lg mb-8">{error}</div>}
        
        {loading && <MovieSkeleton />}
        
        {movieData && !loading && (
          <MovieDetails 
            movie={movieData} 
            onRecommendedClick={(t) => { setTitle(t); searchMovie(t); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onActorClick={handleActorClick}
          />
        )}

        {!movieData && !loading && !error && (
          <div className="text-center text-gray-400 mt-16">
            <p className="text-2xl">🎬 Your cinematic journey begins here!</p>
            <p className="mt-2">Enter a title above to fetch details from TMDb.</p>
          </div>
        )}
      </div>

      <ActorModal 
        isOpen={actorModalOpen} 
        onClose={() => setActorModalOpen(false)} 
        actorData={actorData} 
        loading={actorLoading} 
      />
    </div>
  );
}
