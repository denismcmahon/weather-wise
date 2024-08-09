import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Alert, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

interface WeatherData {
  data_1h: {
    temperature: number[];
    time: string[];
    pictocode: number[];
  };
  units: {
    temperature: string;
  };
}

const App: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ city: string; country: string } | null>(null);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'We need access to your location to show weather data.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS permissions are handled in Info.plist
  };

  const fetchGeolocationData = async (lat: number, lon: number) => {
    const apiKey = '7f25f28cfa5d4440953059eede9c9b68'; // Replace with your OpenCage API key
    try {
      const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${apiKey}`);
      const data = await response.json();
      const locationInfo = data.results[0].components;
      setLocation({
        city: locationInfo.city || locationInfo.town || locationInfo.village || 'Unknown',
        country: locationInfo.country || 'Unknown',
      });
    } catch (error) {
      console.error('Error fetching location data:', error);
      Alert.alert('Error', 'Could not fetch location data');
    }
  };

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const response = await fetch(
          `https://my.meteoblue.com/packages/basic-1h?apikey=5XYBAeGUdl0yKtFQ&lat=${lat}&lon=${lon}&format=json`
        );
        const data = await response.json();
        console.log('Weather data:', data);
        setWeather(data);
      } catch (error) {
        console.error('Error fetching weather data:', error);
      } finally {
        setLoading(false);
      }
    };

    const getLocationAndFetchData = async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Location permission is required to fetch weather data.');
        setLoading(false);
        return;
      }

      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeather(latitude, longitude);
          fetchGeolocationData(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          Alert.alert('Error', 'Could not fetch location');
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    };

    getLocationAndFetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!weather || !location) {
    return (
      <View style={styles.container}>
        <Text>Error fetching weather data</Text>
      </View>
    );
  }

  // Extract the first hour's data for demonstration purposes
  const { temperature, time, pictocode } = weather.data_1h;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weather Forecast</Text>
      <Text style={styles.location}>
        Location: {location.city}, {location.country}
      </Text>
      <Text style={styles.temperature}>
        Temp: {temperature[0]}°{weather.units.temperature}
      </Text>
      <Text style={styles.time}>Time: {time[0]}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  location: {
    fontSize: 20,
    marginVertical: 5,
  },
  temperature: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  time: {
    fontSize: 18,
    color: '#888',
  },
  description: {
    fontSize: 18,
    color: '#888',
  },
});

export default App;