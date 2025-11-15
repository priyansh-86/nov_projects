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
    console.error('TMDB_API_KEY is not set.');
    return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
  }

  try {
    // Step 1: Search for the movie to get its ID
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(title)}`;
    const searchResponse = await fetch(searchUrl, {
      cache: 'no-store'
    });
    const searchData = await searchResponse.json();

    if (!searchData.results || searchData.results.length === 0) {
      return NextResponse.json({ message: 'Movie not found on TMDb.' }, { status: 404 });
    }

    const movieId = searchData.results[0].id;

    // Step 2: Fetch detailed movie data, including credits and reviews
    const detailsUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=credits,reviews,recommendations`;
    const detailsResponse = await fetch(detailsUrl, {
      cache: 'no-store'
    });
    const movieData = await detailsResponse.json();

    return NextResponse.json(movieData, { status: 200 });
  } catch (error) {
    console.error('API Fetch Error:', error);
    return NextResponse.json({ message: 'An error occurred while fetching movie data.' }, { status: 500 });
  }
}
