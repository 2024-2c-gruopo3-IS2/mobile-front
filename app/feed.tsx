// Feed.tsx

import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  getAllSnaps,
  getFeedSnaps,
  likeSnap,
  unlikeSnap,
  shareSnap,
  getSharedSnaps,
} from '@/handlers/postHandler';
import Footer from '../components/footer';
import { useRouter } from 'expo-router';
import styles from '../styles/feed';
import SnapItem from '../components/snapItem';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { usePostContext } from '../context/postContext';
import Toast from 'react-native-toast-message';
import { getLikedSnaps, getFavouriteSnaps, favouriteSnap, unfavouriteSnap } from '@/handlers/postHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '@/context/authContext';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../firebaseConfig';

interface Snap {
  id: string;
  username: string;
  time: string;
  message: string;
  isPrivate: boolean;
  likes: number;
  likedByUser: boolean;
  canViewLikes: boolean;
  favouritedByUser: boolean;
  profileImage: string;
  retweetUsername: string; // Si está vacío, es un snap normal; si no, es un retweet
  isShared?: boolean;
  originalUsername?: string;
}

interface Post {
  id?: string;
  username: string;
  time: string;
  message: string;
  isPrivate: boolean;
}

export default function Feed() {
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addNewPost, snaps: contextSnaps } = usePostContext();
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const currentUsername = user?.username || '';

    const fetchProfileImage = async (username: string) => {
      try {
        console.log("\n\nfetching", `profile_photos/${username}.png`);
        // Usar storage().ref en lugar de ref de `firebase/storage`
        const imageRef = ref(`profile_photos/${username}.png`);
        console.log("imageRef", imageRef);
        const url = await imageRef.getDownloadURL();
        console.log("url", url);
        return url;
      } catch (error) {
        return 'https://via.placeholder.com/150';
      }
    };

  useEffect(() => {
    const fetchSnaps = async () => {
      setIsLoading(true);

      try {
        // Ejecutar las tres llamadas a la API en paralelo
        const [response, favouriteResponse, likesResponse, sharedResponse] = await Promise.all([
          getFeedSnaps(),
          getFavouriteSnaps(),
          getLikedSnaps(),
          getSharedSnaps(),
        ]);

        const favouriteSnapIds = favouriteResponse.snaps?.map(favSnap => favSnap.id) || [];
        const likedSnapIds = likesResponse.snaps?.map(likeSnap => likeSnap.id) || [];
        const sharedSnapIds = sharedResponse.snaps?.map(sharedSnap => sharedSnap.id) || [];

        if (response.success && response.snaps && response.snaps.length > 0) {
          const fetchedSnaps: Snap[] = await Promise.all(response.snaps.map(async (snap: any) => ({
            id: snap._id,
            username: snap.username,
            time: snap.time,
            message: snap.message,
            isPrivate: snap.isPrivate,
            likes: snap.likes || 0,
            likedByUser: likedSnapIds.includes(snap._id),
            canViewLikes: true,
            favouritedByUser: favouriteSnapIds.includes(snap._id),
            isShared: sharedSnapIds.includes(snap._id),
            profileImage: await fetchProfileImage(snap.username),
            originalUsername: snap.originalUsername || undefined, // Asegurar que se define
          })));
          setSnaps(fetchedSnaps);
          console.log(snaps);
        } else {
          setSnaps([]);
        }
      } catch (error) {
        console.error("Error fetching feed snaps:", error);
        Toast.show({
          type: 'error',
          text1: 'Error al obtener los snaps del feed',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSnaps();
  }, []);

  const allSnaps = [...contextSnaps, ...snaps];

  // Función para manejar el Like
  const handleLike = async (snapId: string, likedByUser: boolean) => {
    // Optimizar la UI primero
    setSnaps(prevSnaps =>
      prevSnaps.map(snap => {
        if (snap.id === snapId) {
          const updatedLikeStatus = !likedByUser;
          const updatedLikes = updatedLikeStatus ? snap.likes + 1 : snap.likes - 1;
          return {
            ...snap,
            likedByUser: updatedLikeStatus,
            likes: updatedLikes,
          };
        }
        return snap;
      })
    );

    // Llamada a la API
    const apiResponse = likedByUser ? await unlikeSnap(snapId) : await likeSnap(snapId);

    if (apiResponse.success) {
      // Usar Toast
      Toast.show({
        type: 'success',
        text1: likedByUser ? 'Has quitado el "me gusta"' : 'Has dado "me gusta" exitosamente',
      });
    } else {
      // Revertir el cambio en caso de error
      setSnaps(prevSnaps =>
        prevSnaps.map(snap => {
          if (snap.id === snapId) {
            const revertedLikeStatus = likedByUser;
            const revertedLikes = revertedLikeStatus ? snap.likes + 1 : snap.likes - 1;
            return {
              ...snap,
              likedByUser: revertedLikeStatus,
              likes: revertedLikes,
            };
          }
          return snap;
        })
      );
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: apiResponse.message || 'Hubo un problema al procesar tu solicitud.',
      });
    }
  };

  const handleFavourite = async (snapId: string, favouritedByUser: boolean) => {
    setSnaps(prevSnaps =>
      prevSnaps.map(snap => {
        if (snap.id === snapId) {
          return {
            ...snap,
            favouritedByUser: !favouritedByUser,
          };
        }
        return snap;
      })
    );
    const apiResponse = favouritedByUser ? await unfavouriteSnap(snapId) : await favouriteSnap(snapId);

    if (apiResponse.success) {
      Toast.show({
        type: 'success',
        text1: favouritedByUser ? 'Has quitado el favorito' : 'Has marcado como favorito exitosamente',
      });
    } else {
      setSnaps(prevSnaps =>
        prevSnaps.map(snap => {
          if (snap.id === snapId) {
            return {
              ...snap,
              favouritedByUser: favouritedByUser,
            };
          }
          return snap;
        })
      );
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: apiResponse.message || 'Hubo un problema al procesar tu solicitud.',
      });
    }
  };

  // Función para manejar la compartición de un snap (solo compartir, no descompartir)
  const handleShare = async (snap: Snap) => {
    try {
      const result = await shareSnap(snap.id); // Llama al endpoint para compartir el snap

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Snap compartido',
          text2: 'El snap ha sido compartido exitosamente.',
        });

        // Crear un nuevo snap compartido solo si es tu propio feed
        const sharedSnap = {
          ...snap,
          id: `${snap.id}-shared-${Date.now()}`, // Generar un ID único para el compartido
          username: currentUsername, // Asegurarse de que el snap compartido pertenece al usuario actual
          isShared: true,
          originalUsername: snap.username,
          time: new Date().toLocaleString(),
        };
        setSnaps(prevSnaps => [sharedSnap, ...prevSnaps]);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error al compartir',
          text2: result.message || 'Hubo un problema al compartir el snap.',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Ocurrió un error al intentar compartir el snap.',
      });
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: Snap }) => (
      <SnapItem
        snap={item}
        onLike={() => handleLike(item.id, item.likedByUser)}
        onFavourite={() => handleFavourite(item.id, item.favouritedByUser)}
        onSnapShare={() => handleShare(item)} // Usar handleShare en lugar de handleToggleShare
        likeIconColor={item.likedByUser ? 'red' : 'gray'}
        favouriteIconColor={item.favouritedByUser ? 'yellow' : 'gray'}
        shareIconColor={item.isShared ? 'green' : 'gray'} // Color del botón de compartir
        currentUsername={currentUsername} // Pasar el nombre de usuario actual
      />
    ),
    [currentUsername]
  );

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1DA1F2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Lista de snaps */}
      {snaps.length > 0 ? (
        <FlatList
          data={snaps}
          keyExtractor={(item) => item.id?.toString() || ''}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.flatListContent}
        />
      ) : (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No se encontraron snaps</Text>
        </View>
      )}
      {/* Añadir Toast */}
      <Toast />
    </View>
  );
}
