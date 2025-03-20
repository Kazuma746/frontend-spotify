"use client";

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { setCurrentTrack, setIsPlaying } from "@store/slices/playerSlice";
import { musicApi } from "@services/musicApi";
import { GridLoader } from "@components/common/loaders";
import Card from "@/components/common/cards/Card";
import Pagination from "@components/common/Pagination";
import { useRouter } from "next/navigation";
import { DEFAULT_IMAGE } from "@/features/player/constants";
import { getAudioInstance } from "@/utils/audioInstance";
import { useTrackPlayback } from "@/hooks/useTrackPlayback";
import { isValidExternalUrl, getSpecialAlbumCoverUrl, getArtistName, getArtistImage } from "@utils/imageHelpers";

const Container = styled.div`
    padding: ${({ theme }) => theme.spacing.xl};
    direction: ${({ $isRTL }) => $isRTL ? 'rtl' : 'ltr'};

    @media (max-width: 680px) {
        padding: ${({ theme }) => theme.spacing.lg};
    }

    @media (max-width: 400px) {
        padding: ${({ theme }) => theme.spacing.md};
    }
`;

const Header = styled.div`
    margin-bottom: ${({ theme }) => theme.spacing.xl};
    padding: 0 24px;

    @media (max-width: 900px) {
        padding: 0 16px;
    }

    @media (max-width: 400px) {
        padding: 0 12px;
    }

    h1 {
        font-size: 2.5rem;
        color: ${({ theme }) => theme.colors.text};
        margin: 0;

        @media (max-width: 1200px) {
            font-size: 2.2rem;
        }

        @media (max-width: 900px) {
            font-size: 2rem;
        }

        @media (max-width: 680px) {
            font-size: 1.8rem;
        }

        @media (max-width: 400px) {
            font-size: 1.5rem;
        }
    }
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 24px;
    padding: 0 24px;

    @media (max-width: 1200px) {
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    }

    @media (max-width: 900px) {
        gap: 16px;
        padding: 0 16px;
    }

    @media (max-width: 680px) {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 12px;
        padding: 0 16px;
        font-size: 0.9rem;
    }

    @media (max-width: 400px) {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 10px;
        padding: 0 12px;
        font-size: 0.8rem;
    }
`;

const ITEMS_PER_PAGE = 20;

// Fonction pour traiter les morceaux avec URL externes
const processTrackImages = (tracks) => {
    if (!tracks || !Array.isArray(tracks)) return [];
    
    return tracks.map(track => {
        console.log('Traitement de la piste:', {
            titre: track.title,
            coverUrlInitiale: track.coverUrl,
            albumId: track.albumId,
            albumCoverImage: track.albumId?.coverImage
        });

        // 1. Si on a déjà une URL signée AWS, on la garde
        if (track.coverUrl?.includes('X-Amz-Signature')) {
            console.log('URL AWS signée trouvée:', track.coverUrl);
            return track;
        }

        let coverUrl = null;

        // 2. Pour les pistes avec album peuplé
        if (track.albumId && track.albumId.coverImage) {
            const coverImage = track.albumId.coverImage;
            if (typeof coverImage === 'object') {
                coverUrl = coverImage.large || 
                          coverImage.medium || 
                          coverImage.thumbnail;
            } else if (typeof coverImage === 'string') {
                coverUrl = coverImage;
            }
            console.log('URL extraite de l\'album:', coverUrl);
        }

        // 3. Si on a une URL AWS non signée ou une URL externe valide
        if (coverUrl && (coverUrl.includes('amazonaws.com') || isValidExternalUrl(coverUrl))) {
            console.log('URL valide trouvée:', coverUrl);
            return {
                ...track,
                coverUrl
            };
        }

        // 4. Cas spéciaux par titre
        if (track.title) {
            // Cas spécial pour foret titre
            if (track.title.toLowerCase() === 'foret titre') {
                coverUrl = 'https://www.mickeyshannon.com/photos/forest-photography.jpg';
                console.log('URL spéciale pour foret titre:', coverUrl);
                return {
                    ...track,
                    coverUrl
                };
            }
            // Cas spécial pour Sunflower
            if (track.title.toLowerCase().includes('sunflower') && track.title.toLowerCase().includes('spider-man')) {
                coverUrl = 'https://i.scdn.co/image/ab67616d0000b273e2e352d89826aef6dbd5ff8f';
                console.log('URL spéciale pour Sunflower:', coverUrl);
                return {
                    ...track,
                    coverUrl
                };
            }
        }

        // 5. Si on a une URL en base64 qui n'est PAS l'image par défaut
        if (track.coverUrl?.startsWith('data:image') && !track.coverUrl.includes('fill=%22%232A2A2A%22')) {
            console.log('URL base64 valide conservée:', track.coverUrl);
            return track;
        }

        console.log('Utilisation image par défaut pour:', track.title);
        return {
            ...track,
            coverUrl: DEFAULT_IMAGE
        };
    });
};

export default function TracksPage() {
    const dispatch = useDispatch();
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const { handlePlay, isCurrentTrack, isPlaying } = useTrackPlayback();
    const isRTL = i18n.language === 'ar';

    const loadTracks = async (pageNumber) => {
        try {
            setLoading(true);
            // Utiliser notre API proxy interne pour éviter les problèmes CORS/redirection
            const response = await musicApi.getTracksViaProxyApi(
                pageNumber,
                ITEMS_PER_PAGE
            );

            if (!response || !response.success) {
                throw new Error(t('common.error.invalidResponse'));
            }

            // Assurons-nous que nous avons des données valides
            const tracksData = response.data || [];
            
            // Traiter les pistes pour s'assurer que les images sont correctement gérées
            const processedTracks = tracksData.map(track => {
                // Vérifier la structure des données
                if (!track || !track.title) {
                    return null;
                }

                // Utiliser directement coverUrl s'il existe
                if (track.coverUrl) {
                    return track;
                }
                
                // Sinon, utiliser l'image de l'album
                let coverUrl = DEFAULT_IMAGE;
                
                if (track.albumId?.coverImage) {
                    const coverImage = track.albumId.coverImage;
                    if (typeof coverImage === 'object') {
                        coverUrl = coverImage.medium || coverImage.large || coverImage.thumbnail || DEFAULT_IMAGE;
                    } else if (typeof coverImage === 'string') {
                        coverUrl = coverImage;
                    }
                }
                
                return {
                    ...track,
                    coverUrl
                };
            }).filter(Boolean); // Filtrer les éléments null
            
            setTracks(processedTracks);
            setTotalItems(response.pagination?.totalItems || 0);
            setTotalPages(response.pagination?.totalPages || 0);
        } catch (error) {
            console.error("Erreur lors du chargement des morceaux:", error);
            setError(error.message || t('tracks.error.loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTracks(page);
    }, [page]);

    const handlePreviousPage = () => {
        if (page > 1) {
            setPage((p) => p - 1);
        }
    };

    const handleNextPage = () => {
        if (page < totalPages) {
            setPage((p) => p + 1);
        }
    };

    const handleTrackPlay = (track) => {
        handlePlay(track, { tracks, index: tracks.findIndex(t => t.id === track.id || t._id === track._id) });
    };

    if (loading && tracks.length === 0) {
        return (
            <Container $isRTL={isRTL}>
                <Header>
                    <h1>{t('tracks.allTracks')}</h1>
                </Header>
                <GridLoader count={ITEMS_PER_PAGE} />
            </Container>
        );
    }

    if (error && tracks.length === 0) {
        return (
            <Container $isRTL={isRTL}>
                <Header>
                    <h1>{t('tracks.allTracks')}</h1>
                </Header>
                <p>{error}</p>
            </Container>
        );
    }

    return (
        <Container $isRTL={isRTL}>
            <Header>
                <h1>{t('tracks.allTracks')}</h1>
            </Header>
            <Grid>
                {tracks.map((track) => (
                    <Card
                        key={track.id || track._id}
                        title={track.title}
                        subtitle={track.artistId?.name || "Artiste inconnu"}
                        imageUrl={track.coverUrl || DEFAULT_IMAGE}
                        type="track"
                        onClick={() => router.push(`/tracks/${track.id || track._id}`)}
                        onPlay={() => handleTrackPlay(track)}
                        isPlaying={isCurrentTrack(track) && isPlaying}
                    />
                ))}
            </Grid>
            <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                onPreviousPage={handlePreviousPage}
                onNextPage={handleNextPage}
                itemsLabel={t('tracks.tracksLabel')}
            />
        </Container>
    );
}
