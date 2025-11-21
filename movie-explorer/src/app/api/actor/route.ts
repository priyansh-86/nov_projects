// src/app/api/actor/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const actorId = searchParams.get('id');

  if (!actorId) {
    return NextResponse.json({ message: 'Actor ID is required' }, { status: 400 });
  }

  const apiKey = process.env.TMDB_API_KEY;
  
  if (!apiKey) {
    console.error('TMDB_API_KEY is not set.');
    return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
  }

  try {
    console.log('Fetching actor data for ID:', actorId);

    // Fetch actor details and movie credits
    const actorUrl = `https://api.themoviedb.org/3/person/${actorId}?api_key=${apiKey}`;
    const creditsUrl = `https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=${apiKey}`;

    const [actorResponse, creditsResponse] = await Promise.all([
      fetch(actorUrl, { 
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      }),
      fetch(creditsUrl, { 
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      })
    ]);

    if (!actorResponse.ok) {
      const errorText = await actorResponse.text();
      console.error('Actor API error:', actorResponse.status, errorText);
      return NextResponse.json({ 
        message: 'Failed to fetch actor data' 
      }, { status: actorResponse.status });
    }

    if (!creditsResponse.ok) {
      const errorText = await creditsResponse.text();
      console.error('Credits API error:', creditsResponse.status, errorText);
      return NextResponse.json({ 
        message: 'Failed to fetch actor credits' 
      }, { status: creditsResponse.status });
    }

    const actorData = await actorResponse.json();
    const creditsData = await creditsResponse.json();

    console.log('Actor data fetched successfully:', actorData.name);

    // Sort movies by popularity and get top movies
    const sortedMovies = (creditsData.cast || [])
      .filter((movie: any) => movie.poster_path) // Only movies with posters
      .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 15); // Top 15 movies

    return NextResponse.json({
      actor: actorData,
      movies: sortedMovies
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('API Fetch Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      message: 'An error occurred while fetching actor data.',
      error: errorMessage 
    }, { status: 500 });
  }
}