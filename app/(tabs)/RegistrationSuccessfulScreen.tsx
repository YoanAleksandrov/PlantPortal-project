import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';

const RegistrationSuccessfulScreen = () => {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
      <Image style={styles.logo} source={require('../../assets/images/PlantPortal-logo.png')} />
      </View>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Registration Successful</Text>
        <Text style={styles.description}>
          Your account has been created successfully. Let's get started!
        </Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button}
       onPress={() => router.push('/(tabs)/WelcomeScreen')}>
          <Text style={styles.buttonText}>Start exploring</Text>
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
  headerContainer: {
    marginBottom: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 30,
    color: '#4D7E3D',
    fontFamily: 'Quicksand',
  },
  description: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#BACBA9',
    width: '100%',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontSize: 16,
    color: 'black',
  },
});

export default RegistrationSuccessfulScreen;