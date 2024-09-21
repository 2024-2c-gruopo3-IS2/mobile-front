// app/profile/view.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getProfile, getUserProfile } from '@/handlers/profileHandler';
import BackButton from '@/components/backButton'; // Asegúrate de que la ruta sea correcta
import { Alert } from 'react-native';
import styles from '../styles/profileView';

export default function ProfileView() {
    const router = useRouter();
    const { username: routeUsername } = useLocalSearchParams(); 
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isOwnProfile = !routeUsername;

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            let response;
            if (isOwnProfile) {
                response = await getProfile();
            } else {
                response = await getUserProfile(routeUsername as string);
            }

            if (response.success) {
                setProfile(response.profile);
            } else {
                Alert.alert('Error', response.message || 'No se pudo obtener el perfil.');
            }
            setIsLoading(false);
        };

        fetchProfile();
    }, [routeUsername]);

    if (isLoading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#1DA1F2" />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No se encontró el perfil.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header con BackButton y Título */}
            <View style={styles.headerContainer}>
                <BackButton />
                {/* Espacio vacío para balancear el layout */}
                <View style={styles.rightSpace} />
            </View>

            {/* Foto de Portada */}
            <Image 
                source={{ uri: profile.cover_photo || 'https://via.placeholder.com/800x200' }} 
                style={styles.coverPhoto}
            />

            {/* Foto de Perfil */}
            <View style={styles.profilePictureContainer}>
                <Image 
                    source={{ uri: profile.profile_picture || 'https://via.placeholder.com/150' }} 
                    style={styles.profilePicture}
                />
            </View>

            {/* Nombre, Apellido y Username */}
            <Text style={styles.name}>
                {profile.name} {profile.surname}
            </Text>
            <Text style={styles.username}>@{profile.username}</Text>

            {/* Seguidores y Seguidos (Placeholder) */}
            <View style={styles.followContainer}>
                <View style={styles.followSection}>
                    <Text style={styles.followNumber}>100</Text>
                    <Text style={styles.followLabel}>Seguidos</Text>
                </View>
                <View style={styles.followSection}>
                    <Text style={styles.followNumber}>200</Text>
                    <Text style={styles.followLabel}>Seguidores</Text>
                </View>
            </View>

            {/* Botón de Editar Perfil */}
            {isOwnProfile && (
                <Pressable style={styles.editButton} onPress={() => router.push('/profileEdit')}>
                    <Icon name="edit" size={24} color="#fff" />
                    <Text style={styles.editButtonText}>Editar Perfil</Text>
                </Pressable>
            )}
        </View>
    );
}
