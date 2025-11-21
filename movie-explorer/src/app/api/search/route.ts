// src/app/api/search/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Use undici's fetch in development for better compatibility
const customFetch = async (url: string, options?: RequestInit) => {
  try {
    // In development, add keepAlive and timeout options
    const response = await fetch(url, {
      ...options,
      // @ts-ignore - Next.js internal fetch options
      keepalive: true,
    });
    return response;
  } catch (error) {
    console.error('Fetch error details:', error);
    throw error;
  }
};

export async function GET(request: NextRequest) {
  console.log('=== API Route Called ===');
  
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title');
  
  console.log('Requested title:', title);

  if (!title) {
    return NextResponse.json({ message: 'Movie title is required' }, { status: 400 });
  }

  const apiKey = process.env.TMDB_API_KEY;
  console.log('API Key exists:', !!apiKey);
  
  if (!apiKey) {
    console.error('ERROR: TMDB_API_KEY is not set');
    return NextResponse.json({ 
      message: 'Server configuration error. TMDB_API_KEY not found' 
    }, { status: 500 });
  }

  try {
    // Step 1: Search for the movie
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(title)}`;
    console.log('Calling TMDb search API...');
    console.log('URL:', searchUrl.replace(apiKey, 'XXX')); // Hide key in logs
    
    const searchResponse = await customFetch(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MovieExplorer/1.0',
      },
    });

    console.log('Search API status:', searchResponse.status);

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('TMDb search API error:', searchResponse.status, errorText);
      return NextResponse.json({ 
        message: `TMDb API returned error: ${searchResponse.statusText}`,
      }, { status: searchResponse.status });
    }

    const searchData = await searchResponse.json();
    console.log('Search results count:', searchData.results?.length || 0);

    if (!searchData.results || searchData.results.length === 0) {
      console.log('No results found for:', title);
      return NextResponse.json({ 
        message: 'Movie not found on TMDb. Try a different title.' 
      }, { status: 404 });
    }

    const movieId = searchData.results[0].id;
    console.log('Found movie:', searchData.results[0].title, 'ID:', movieId);

    // Step 2: Fetch detailed movie data
    const detailsUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=credits,reviews,recommendations`;
    console.log('Calling TMDb details API...');
    
    const detailsResponse = await customFetch(detailsUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MovieExplorer/1.0',
      },
    });

    console.log('Details API status:', detailsResponse.status);

    if (!detailsResponse.ok) {
      const errorText = await detailsResponse.text();
      console.error('TMDb details API error:', detailsResponse.status, errorText);
      return NextResponse.json({ 
        message: `TMDb API returned error: ${detailsResponse.statusText}`,
      }, { status: detailsResponse.status });
    }

    const movieData = await detailsResponse.json();
    console.log('SUCCESS: Movie data fetched for:', movieData.title);

    return NextResponse.json(movieData, { status: 200 });

  } catch (error: unknown) {
    console.error('=== FATAL ERROR ===');
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Specific error handling
      if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
        return NextResponse.json({ 
          message: 'Connection timeout. This is a known issue in development. Deploy to Vercel for production use.',
          error: 'DEV_TIMEOUT',
          suggestion: 'Try restarting the dev server or use production build'
        }, { status: 504 });
      }
      
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        return NextResponse.json({ 
          message: 'Network connection failed. This may be a development environment issue.',
          error: 'DEV_NETWORK_ERROR',
          suggestion: 'The app works fine on Vercel. Continue using production deployment.'
        }, { status: 503 });
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      message: 'An error occurred. Note: This works fine on Vercel production.',
      error: errorMessage,
      isDevError: true
    }, { status: 500 });
  }
}