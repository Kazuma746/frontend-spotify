const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Fonction utilitaire pour gérer les erreurs
const handleResponse = async (response) => {
  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.message || `Erreur ${response.status}: ${response.statusText}`);
    } catch (e) {
      // Si on ne peut pas analyser le JSON (par exemple, si la réponse n'est pas du JSON)
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
  }
  return response.json();
};

// Fonction utilitaire pour les requêtes avec authentification
const fetchWithAuth = async (endpoint, options = {}) => {
    const token = localStorage.getItem("token");
    const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    // Nous n'avons pas besoin de modifier l'endpoint car next.config.js gère la redirection
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    return handleResponse(response);
};

export const musicApi = {
    // Récupération de tous les morceaux avec pagination
    getAllTracks: async (page = 1, limit = 10) => {
        try {
            return await fetchWithAuth(`/tracks?page=${page}&limit=${limit}`);
        } catch (error) {
            return {
                success: false,
                data: [],
                pagination: { totalItems: 0 },
                error: error.message,
            };
        }
    },

    // Récupération de tous les artistes avec pagination
    getAllArtists: async (page = 1, limit = 10) => {
        try {
            return await fetchWithAuth(`/artists?page=${page}&limit=${limit}`);
        } catch (error) {
            return {
                success: false,
                data: [],
                pagination: { totalItems: 0 },
                error: error.message,
            };
        }
    },

    // Récupération de tous les albums avec pagination
    getAllAlbums: async (page = 1, limit = 10) => {
        try {
            return await fetchWithAuth(`/albums?page=${page}&limit=${limit}`);
        } catch (error) {
            return { albums: [], total: 0 };
        }
    },

    // Récupération d'une piste spécifique
    getTrack: async (trackId) => {
        return await fetchWithAuth(`/tracks/${trackId}`);
    },

    // Récupération d'un artiste
    getArtist: async (artistId) => {
        return await fetchWithAuth(`/artists/${artistId}`);
    },

    // Récupération des pistes d'un artiste
    getArtistTracks: async (artistId) => {
        return await fetchWithAuth(`/artists/${artistId}/top-tracks`);
    },

    // Récupération d'un album spécifique
    getAlbum: async (albumId) => {
        return await fetchWithAuth(`/albums/${albumId}`);
    },

    // Récupération des pistes d'un album
    getAlbumTracks: async (albumId) => {
        return await fetchWithAuth(`/albums/${albumId}/tracks`);
    },

    // Récupération des morceaux récents (pour la home)
    getRecentTracks: async () => {
        return await fetchWithAuth(`/tracks/recent`);
    },

    // Récupération des artistes populaires (pour la home)
    getPopularArtists: async () => {
        return await fetchWithAuth(`/artists/popular`);
    },

    // Récupération des albums récents (pour la home)
    getRecentAlbums: async () => {
        return await fetchWithAuth(`/albums/recent`);
    },

    // Récupération d'un morceau pour le streaming
    getTrackStream: async (trackId) => {
        const response = await fetch(`${BASE_URL}/tracks/${trackId}/stream`);
        return response.blob();
    },

    // Regular search
    search: async (query) => {
        try {
            return await fetchWithAuth(`/search?q=${encodeURIComponent(query)}`);
        } catch (error) {
            throw error;
        }
    },

    // Global search across tracks, artists, albums and playlists
    globalSearch: async (query, filter = 'Tout') => {
        try {
            const response = await fetchWithAuth(`/search?q=${encodeURIComponent(query)}`);
            if (response.success) {
                // Filtrer les résultats en fonction du filtre actif
                const filteredData = { ...response.data };
                switch (filter) {
                    case 'Titres':
                        filteredData.artists = [];
                        filteredData.albums = [];
                        filteredData.playlists = [];
                        break;
                    case 'Artistes':
                        filteredData.tracks = [];
                        filteredData.albums = [];
                        filteredData.playlists = [];
                        break;
                    case 'Albums':
                        filteredData.tracks = [];
                        filteredData.artists = [];
                        filteredData.playlists = [];
                        break;
                    case 'Playlists':
                        filteredData.tracks = [];
                        filteredData.artists = [];
                        filteredData.albums = [];
                        break;
                    default:
                        // Garder tous les résultats pour 'Tout'
                        break;
                }
                return { success: true, data: filteredData };
            }
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Gestion des likes
    likeTrack: async (trackId) => {
        const response = await fetch(`${BASE_URL}/tracks/${trackId}/like`, {
            method: 'POST',
        });
        return handleResponse(response);
    },

    unlikeTrack: async (trackId) => {
        const response = await fetch(`${BASE_URL}/tracks/${trackId}/like`, {
            method: 'DELETE',
        });
        return handleResponse(response);
    },

    // Gestion des playlists
    getPlaylist: async (playlistId) => {
        const response = await fetch(`${BASE_URL}/playlists/${playlistId}`);
        return handleResponse(response);
    },

    createPlaylist: async (data) => {
        const response = await fetch(`${BASE_URL}/playlists`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    updatePlaylist: async (playlistId, data) => {
        const response = await fetch(`${BASE_URL}/playlists/${playlistId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    // Lecteur audio
    getTrackMetadata: async (trackId) => {
        const response = await fetch(`${BASE_URL}/tracks/${trackId}/metadata`);
        return handleResponse(response);
    },

    // Sessions d'écoute
    createListeningSession: async () => {
        const response = await fetch(`${BASE_URL}/sessions`, {
            method: 'POST',
        });
        return handleResponse(response);
    },

    joinListeningSession: async (sessionId) => {
        const response = await fetch(`${BASE_URL}/sessions/${sessionId}/join`, {
            method: 'POST',
        });
        return handleResponse(response);
    },

    syncListeningSession: async (sessionId, data) => {
        const response = await fetch(`${BASE_URL}/sessions/${sessionId}/sync`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },
};
