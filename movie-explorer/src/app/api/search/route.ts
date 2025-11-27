// src/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title');

  if (!title) {
    return NextResponse.json({ message: 'Movie title is required' }, { status: 400 });
  }

  const apiKey = process.env.TMDB_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
  }

  try {
    // Step 1: Search for the movie
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(title)}`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.results || searchData.results.length === 0) {
      return NextResponse.json({ message: 'Movie not found.' }, { status: 404 });
    }

    const movieId = searchData.results[0].id;

    // Step 2: Fetch details + credits + recommendations
    const detailsUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=credits,reviews,recommendations`;
    const detailsResponse = await fetch(detailsUrl);
    const movieData = await detailsResponse.json();

    return NextResponse.json(movieData, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}