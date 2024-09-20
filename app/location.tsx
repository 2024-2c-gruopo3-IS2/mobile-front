import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import styles from '../styles/location';

export default function UbicacionPage() {
  const [country, setCountry] = useState<string>(''); 
  const [countryCode, setCountryCode] = useState<CountryCode>('AR'); // Código de país predeterminado
  const router = useRouter();

  const handleSelectCountry = (countryData: Country) => {
    if (typeof countryData.name === 'string') {
      setCountry(countryData.name); // Almacenar el nombre del país seleccionado si es un string
    }
    setCountryCode(countryData.cca2 as CountryCode); // Asegurar que sea un código válido
  };

  const handleNext = async () => {
    if (!country) {
      Alert.alert('Error', 'Por favor, selecciona tu país de residencia.');
    } else {
      try {
        //await AsyncStorage.setItem('selectedCountry', country);
        await SecureStore.setItemAsync('country', country);
        router.push('./interests');
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'No se pudo guardar la información del país.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Dónde resides?</Text>
      <Text style={styles.label}>Selecciona o ingresa tu país de residencia:</Text>
      
      {/* Country Picker */}
      <View style={styles.pickerContainer}>
        <CountryPicker
          countryCode={countryCode} 
          withFlag={true}
          withFilter={true}
          withCountryNameButton={true}
          withAlphaFilter={true}
          withCallingCode={false}
          onSelect={handleSelectCountry}
          containerButtonStyle={styles.countryButton}
        />
        {country ? (
          <Text style={styles.selectedCountry}>País seleccionado: {country}</Text>
        ) : (
          <Text style={styles.selectedCountry}>No has seleccionado un país</Text>
        )}
      </View>

      {/* Botón Siguiente */}
      <Pressable style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.buttonText}>Siguiente</Text>
      </Pressable>
    </View>
  );
}
