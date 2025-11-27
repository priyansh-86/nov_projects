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

    // Actor details aur movie credits fetch karein
    const actorUrl = `https://api.themoviedb.org/3/person/${actorId}?api_key=${apiKey}`;
    const creditsUrl = `https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=${apiKey}`;

    const [actorResponse, creditsResponse] = await Promise.all([
      fetch(actorUrl, { cache: 'no-store', headers: { 'Accept': 'application/json' } }),
      fetch(creditsUrl, { cache: 'no-store', headers: { 'Accept': 'application/json' } })
    ]);

    if (!actorResponse.ok || !creditsResponse.ok) {
      return NextResponse.json({ message: 'Failed to fetch actor data' }, { status: 404 });
    }

    const actorData = await actorResponse.json();
    const creditsData = await creditsResponse.json();

    const today = new Date().toISOString().split('T')[0]; // Aaj ki date 'YYYY-MM-DD' format mein

    // 1. Upcoming Movies (Jo future mein release hongi)
    const upcomingMovies = (creditsData.cast || [])
      .filter((m: any) => m.release_date && m.release_date > today)
      .sort((a: any, b: any) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime()) // Date wise sort
      .slice(0, 10); // Top 10 upcoming

    // 2. Past Top Movies (Jo release ho chuki hain, rating ke hisaab se sort)
    const pastMovies = (creditsData.cast || [])
      .filter((m: any) => m.release_date && m.release_date <= today && m.poster_path)
      .sort((a: any, b: any) => (b.vote_average || 0) - (a.vote_average || 0)) // High rating pehle
      .slice(0, 10); // Top 10 past movies

    return NextResponse.json({
      actor: actorData,
      pastMovies: pastMovies,     // Ye Frontend mein required hai
      upcomingMovies: upcomingMovies // Ye bhi Frontend mein required hai
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
