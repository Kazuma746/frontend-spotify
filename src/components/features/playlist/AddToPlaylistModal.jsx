import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Plus, X } from 'react-feather';
import playlistApi from '@/services/playlistApi';
import { useTranslation } from 'react-i18next';

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 16px;
`;

const ModalContent = styled.div`
    background: #282828;
    padding: 24px;
    border-radius: 8px;
    width: 100%;
    max-width: 480px;
    position: relative;
    box-shadow: 0 8px 24px rgba(0,0,0,.5);

    @media (max-width: 768px) {
        padding: 20px;
        max-width: 100%;
    }
`;

const CloseButton = styled.button`
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    color: #b3b3b3;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    
    &:hover {
        color: #fff;
        transform: scale(1.1);
    }
`;

const Title = styled.h2`
    margin: 0 0 24px;
    color: #fff;
    font-size: 24px;
    font-weight: 700;

    @media (max-width: 768px) {
        font-size: 20px;
        margin: 0 0 20px;
    }
`;

const PlaylistList = styled.div`
    max-height: 300px;
    overflow-y: auto;
    margin: 16px -24px;
    padding: 0 24px;

    @media (max-width: 768px) {
        max-height: 250px;
        margin: 12px -20px;
        padding: 0 20px;
    }

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background: #666;
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: #888;
    }
`;

const PlaylistItem = styled.button`
    width: 100%;
    padding: 12px 16px;
    background: transparent;
    border: none;
    border-radius: 4px;
    display: flex;
    align-items: center;
    color: #fff;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 16px;
    text-align: left;

    @media (max-width: 768px) {
        padding: 10px 12px;
        font-size: 14px;
    }

    &:hover {
        background: rgba(255, 255, 255, 0.1);
    }
`;

const CreatePlaylistButton = styled(PlaylistItem)`
    color: #b3b3b3;
    margin-top: 8px;
    padding: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    gap: 16px;

    @media (max-width: 768px) {
        padding: 12px;
        gap: 12px;
    }

    &:hover {
        color: #fff;
    }

    svg {
        width: 24px;
        height: 24px;

        @media (max-width: 768px) {
            width: 20px;
            height: 20px;
        }
    }
`;

const Input = styled.input`
    width: 100%;
    padding: 14px;
    margin-bottom: 16px;
    background: #3e3e3e;
    border: 1px solid transparent;
    border-radius: 4px;
    color: #fff;
    font-size: 16px;
    transition: all 0.2s;

    @media (max-width: 768px) {
        padding: 12px;
        font-size: 14px;
        margin-bottom: 12px;
    }

    &:focus {
        outline: none;
        border-color: #fff;
    }

    &::placeholder {
        color: #b3b3b3;
    }
`;

const ButtonContainer = styled.div`
    display: flex;
    gap: 16px;
    margin-bottom: 16px;

    @media (max-width: 768px) {
        gap: 12px;
        margin-bottom: 12px;
    }
`;

const BackButton = styled.button`
    flex: 1;
    padding: 14px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 500px;
    color: ${({ theme }) => theme.colors.text};
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;

    @media (max-width: 768px) {
        padding: 12px;
        font-size: 14px;
    }

    &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.02);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const CreateButton = styled.button`
    flex: 1;
    padding: 14px;
    background: #1db954;
    border: none;
    border-radius: 500px;
    color: #000;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;

    @media (max-width: 768px) {
        padding: 12px;
        font-size: 14px;
    }

    &:hover {
        background: #1ed760;
        transform: scale(1.02);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const Message = styled.div`
    padding: 12px;
    margin-bottom: 16px;
    border-radius: 4px;
    font-size: 14px;
    text-align: center;
    
    @media (max-width: 768px) {
        padding: 10px;
        font-size: 13px;
        margin-bottom: 12px;
    }
    
    &.success {
        background: rgba(29, 185, 84, 0.1);
        color: #1db954;
    }
    
    &.error {
        background: rgba(255, 0, 0, 0.1);
        color: #ff4444;
    }
`;

const AddToPlaylistModal = ({ isOpen, onClose, trackId }) => {
    const [playlists, setPlaylists] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { t, i18n } = useTranslation();

    useEffect(() => {
        if (isOpen) {
            if (!trackId) {
                setMessage({ type: 'error', text: "L'identifiant de la piste est requis" });
                return;
            }
            loadPlaylists();
            setMessage(null);
        }
    }, [isOpen, trackId]);

    const loadPlaylists = async () => {
        try {
            const response = await playlistApi.getUserPlaylists();
            setPlaylists(Array.isArray(response) ? response : []);
        } catch (error) {
            console.error(t('addToPlaylistModal.error.loadFailed'), error);
            setMessage({ type: 'error', text: t('addToPlaylistModal.error.loadFailed') });
            setPlaylists([]);
        }
    };

    const handleAddToPlaylist = async (playlistId) => {
        try {
            setIsLoading(true);
            setMessage(null);
            
            if (!trackId) {
                throw new Error("L'identifiant de la piste est requis");
            }
            
            const response = await playlistApi.addTrackToPlaylist(playlistId, trackId);
            setMessage({ 
                type: 'success', 
                text: response.message || t('addToPlaylistModal.success.trackAdded')
            });
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error) {
            console.error(t('addToPlaylistModal.error.addFailed'), error);
            setMessage({ 
                type: 'error', 
                text: error.message || t('addToPlaylistModal.error.addFailed')
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName.trim()) {
            setMessage({ type: 'error', text: t('addToPlaylistModal.error.enterName') });
            return;
        }

        if (!trackId) {
            setMessage({ type: 'error', text: "L'identifiant de la piste est requis" });
            return;
        }

        try {
            setIsLoading(true);
            setMessage(null);
            const newPlaylist = await playlistApi.createPlaylist({
                name: newPlaylistName,
                description: '',
            });

            if (newPlaylist && newPlaylist._id) {
                const response = await playlistApi.addTrackToPlaylist(newPlaylist._id, trackId);
                setMessage({ 
                    type: 'success', 
                    text: response.message || t('addToPlaylistModal.success.playlistCreated')
                });
                setTimeout(() => {
                    onClose();
                }, 1500);
            }
        } catch (error) {
            console.error(t('addToPlaylistModal.error.createFailed'), error);
            setMessage({ 
                type: 'error', 
                text: error.message || t('addToPlaylistModal.error.createFailed')
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <CloseButton onClick={onClose} disabled={isLoading}>
                    <X size={24} />
                </CloseButton>
                <Title>{t('addToPlaylistModal.title')}</Title>
                
                {message && (
                    <Message className={message.type}>
                        {message.text}
                    </Message>
                )}
                
                {isCreating ? (
                    <>
                        <Input
                            type="text"
                            placeholder={t('addToPlaylistModal.newPlaylistName')}
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            autoFocus
                            disabled={isLoading}
                        />
                        <ButtonContainer>
                            <BackButton 
                                onClick={() => {
                                    setIsCreating(false);
                                    setNewPlaylistName('');
                                    setMessage(null);
                                }}
                                disabled={isLoading}
                            >
                                {t('addToPlaylistModal.back')}
                            </BackButton>
                            <CreateButton 
                                onClick={handleCreatePlaylist}
                                disabled={isLoading}
                            >
                                {isLoading ? t('addToPlaylistModal.creating') : t('addToPlaylistModal.createAndAdd')}
                            </CreateButton>
                        </ButtonContainer>
                    </>
                ) : (
                    <>
                        <PlaylistList>
                            {playlists.map((playlist) => (
                                <PlaylistItem
                                    key={playlist._id}
                                    onClick={() => handleAddToPlaylist(playlist._id)}
                                    disabled={isLoading}
                                >
                                    {playlist.name}
                                </PlaylistItem>
                            ))}
                        </PlaylistList>
                        <CreatePlaylistButton 
                            onClick={() => setIsCreating(true)}
                            disabled={isLoading}
                        >
                            <Plus size={24} />
                            {t('addToPlaylistModal.createNew')}
                        </CreatePlaylistButton>
                    </>
                )}
            </ModalContent>
        </ModalOverlay>
    );
};

export default AddToPlaylistModal; 