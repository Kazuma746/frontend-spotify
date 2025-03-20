import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Récupérer les paramètres de l'URL
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || 1;
    const limit = searchParams.get('limit') || 20;

    // Appeler directement l'API backend avec fetch
    const response = await fetch(
      `https://backend-spotify-f61v.onrender.com/api/tracks?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Si la réponse n'est pas ok, on renvoie une erreur
    if (!response.ok) {
      console.error(`Erreur API backend: ${response.status}`);
      
      // Tenter de récupérer le message d'erreur
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || `Erreur ${response.status}`;
      } catch (e) {
        errorMessage = `Erreur ${response.status}: ${response.statusText}`;
      }

      // Renvoyer une réponse d'erreur structurée
      return NextResponse.json(
        {
          success: false,
          data: [],
          pagination: { totalItems: 0, totalPages: 0 },
          error: errorMessage,
        },
        { status: 500 }
      );
    }

    // Récupérer les données
    const data = await response.json();
    
    // Retourner les données en conservant la structure
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erreur dans la route API tracks:', error);
    
    // Renvoyer une réponse d'erreur générique
    return NextResponse.json(
      {
        success: false,
        data: [],
        pagination: { totalItems: 0, totalPages: 0 },
        error: error.message || 'Une erreur est survenue',
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 