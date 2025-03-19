const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Fonction utilitaire pour gérer les erreurs
const handleResponse = async (response) => {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Une erreur est survenue');
        }
        return data;
    }
    throw new Error('Format de réponse invalide');
};

// Fonction utilitaire pour les requêtes avec authentification
const fetchWithAuth = async (endpoint, options = {}) => {
    const token = localStorage.getItem("token");
    const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    return handleResponse(response);
};

const playlistApi = {
    // Récupérer toutes les playlists de l'utilisateur
    getUserPlaylists: async () => {
        try {
            const userStr = localStorage.getItem("user");
            if (!userStr) {
                return [];
            }

            const userData = JSON.parse(userStr);
            const userId = userData.user?.id || userData.id;
            
            if (!userId) {
                return [];
            }

            const response = await fetchWithAuth(`/playlists?userId=${userId}`);
            return response.data || [];
        } catch (error) {
            return [];
        }
    },

    // Créer une nouvelle playlist
    createPlaylist: async (playlistData) => {
        try {
            const response = await fetchWithAuth('/playlists', {
                method: 'POST',
                body: JSON.stringify({
                    name: playlistData.name,
                    description: playlistData.description || '',
                    isPublic: false
                }),
            });
            return response.data || response;
        } catch (error) {
            throw error;
        }
    },

    // Ajouter une piste à une playlist
    addTrackToPlaylist: async (playlistId, trackId) => {
        try {
            // Vérification que trackId est défini et valide
            if (!trackId) {
                throw new Error("L'identifiant de la piste est requis");
            }
            
            const response = await fetchWithAuth(`/playlists/${playlistId}/tracks`, {
                method: 'POST',
                body: JSON.stringify({ trackId }),
            });
            return response.data || response;
        } catch (error) {
            throw error;
        }
    },

    // Supprimer une piste d'une playlist
    removeTrackFromPlaylist: async (playlistId, trackId) => {
        try {
            const response = await fetchWithAuth(`/playlists/${playlistId}/tracks/${trackId}`, {
                method: 'DELETE',
            });
            return response.data || response;
        } catch (error) {
            throw error;
        }
    },

    // Récupérer une playlist spécifique
    getPlaylist: async (playlistId) => {
        try {
            const response = await fetchWithAuth(`/playlists/${playlistId}`);
            
            if (response.data) {
                return { data: response.data };
            } else if (response.success && response.tracks) {
                return { data: response };
            }
            
            return { data: response };
        } catch (error) {
            throw error;
        }
    },

    // Supprimer une playlist
    deletePlaylist: async (playlistId) => {
        try {
            const response = await fetchWithAuth(`/playlists/${playlistId}`, {
                method: 'DELETE',
            });
            return response.data || response;
        } catch (error) {
            throw error;
        }
    },

    // Mettre à jour une playlist
    updatePlaylist: async (playlistId, updateData) => {
        try {
            const response = await fetchWithAuth(`/playlists/${playlistId}`, {
                method: 'PUT',
                body: JSON.stringify(updateData),
            });
            return response.data || response;
        } catch (error) {
            throw error;
        }
    }
};

export default playlistApi; 