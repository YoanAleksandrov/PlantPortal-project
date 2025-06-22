import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';

const Index = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image style={styles.logo} source={require('../../assets/images/PlantPortal-logo.png')} />
      </View>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Join PlantPortal</Text>
        <Text style={styles.description}>
          Browse popular plants, get personalized advice, and track your garden.
        </Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/Registration')}>
          <Text style={styles.buttonText}>Sign up</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/Login')}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 100,
    alignItems: 'center',
  },
  logoContainer: {
    position: 'absolute',
    height: 90,
    top: 10,
    left: 10,
  },
  logo: {
    width: 200,
    height: 90,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 46,
    top: 60,
    color: '#4D7E3D',
    fontFamily: 'Quicksand',
  },
  description: {
    fontSize: 25,
    marginTop: 100,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: 'Quicksand',
    fontWeight: 'medium',
    color: 'black',
  },
  buttonContainer: {
    top: 110,
    width: '90%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#BACBA9',
    width: '100%',
    padding: 25,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 16,
    color: 'black',
  },
});

export default Index;
