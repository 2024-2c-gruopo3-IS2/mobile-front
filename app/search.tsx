// search.tsx

import styles from '../styles/search';
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from 'react-native';
import { getAllUsers } from '@/handlers/profileHandler';
import BackButton from '../components/backButton';
import { useRouter } from 'expo-router';

import debounce from 'lodash.debounce';
import Footer from '@/components/footer';
import { usePostContext } from '../context/postContext'; 

export default function SearchUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<string[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addNewPost } = usePostContext(); 
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await getAllUsers();
      if (response.success) {
        if (response.users) {
          setUsers(response.users); // Guardamos todos los usuarios
          setFilteredUsers(response.users); // Inicialmente mostramos todos
        }
      } else {
        console.error('Error al obtener los usuarios:', response.message);
      }
      setIsLoading(false);
    };

    fetchUsers();
  }, []);

  const handleSearch = useCallback(
    debounce((query: string) => {
      if (query.trim() === '') {
        setFilteredUsers(users);
      } else {
        const lowerCaseQuery = query.toLowerCase();
        const filtered = users.filter((username) =>
          username.toLowerCase().startsWith(lowerCaseQuery)
        );
        setFilteredUsers(filtered);
      }
    }), 
    [users]
  );

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, handleSearch]);

  const renderItem = ({ item }: { item: string }) => (
    <Pressable
      style={styles.userContainer}
      onPress={() => router.push({
        pathname: '/profileView',
        params: { username: item },
      })}
    >
      <Text style={styles.username}>@{item}</Text>
    </Pressable>
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
      <View style={styles.header}>
        <BackButton style={styles.backButton} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar usuarios..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.content}>
        {filteredUsers.length > 0 ? (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
          />
        ) : (
          <Text style={styles.noResultsText}>No se encontraron usuarios</Text>
        )}
      </View>

      <Footer />
    </View>
  );
}
