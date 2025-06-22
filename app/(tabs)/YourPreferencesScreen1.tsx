import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native'; 
import { useRouter } from 'expo-router';

const YourPreferencesScreen1 = () => {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
      <Image style={styles.logo} source={require('../../assets/images/PlantPortal-logo.png')} />
      </View>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Your Preferences</Text>
        <Text style={styles.description}>
          What level of care do you prefer?
        </Text>
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionButton}>
            <Text style={styles.optionButtonText}>Easy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton}>
            <Text style={styles.optionButtonText}>Medium</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton}>
            <Text style={styles.optionButtonText}>Hard</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button}
       onPress={() => router.push('/(tabs)/YourPreferencesScreen2')}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}
        onPress={() => router.push('/(tabs)/HomeScreen')}>
          <Text style={styles.buttonText}>Skip</Text>
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
    marginBottom: 20,
    alignItems: 'center',
  },
  logoContainer: {
    position: 'absolute',
    height: 70,
    top: 10,
    left: 10,
  },
  logo: {
    width: 200, 
    height: 70, 
    resizeMode: 'contain',
  },
  title: {
    fontSize: 46,
    top: 100,
    color: '#4D7E3D', 
    fontFamily: 'Quicksand',
  },
  description: {
    fontSize: 25,
    marginTop: 110,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: 'Quicksand',
    fontWeight: 'medium',
    color: 'black'
  },
  optionsContainer: {
    marginTop: 30,
    marginRight: '50%',
    
    
  },
  optionButton: {
    backgroundColor: '#BACBA9',
    width: '100%',
    padding: 20,
    borderRadius: 5,
    marginBottom: 20,
  },
  optionButtonText: {
    fontSize: 16,
    color: 'black',
    width: 100,
    textAlign: 'center',
  },
  buttonContainer: {
    top: 40,
    width: '90%',
    justifyContent: 'center',
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

export default YourPreferencesScreen1;