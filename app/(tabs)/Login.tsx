import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView, Image, Alert, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from './firebaseConfig';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

const SignInScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
    } else {
      setEmailError('');
    }
  };

  const validatePassword = (password) => {
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
    } else {
      setPasswordError('');
    }
  };

  const handleSignIn = async () => {
    validateEmail(email);
    validatePassword(password);
    if (emailError || passwordError) {
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/(tabs)/HomeScreen'); // Navigate to HomeScreen
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address to reset your password.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Success', 'Password reset email sent! Check your inbox.');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ImageBackground
      source={require('@/assets/images/LoginImage.webp')} 
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.logoContainer}>
          <Image style={styles.logo} source={require('../../assets/images/PlantPortal-logo.png')} />
        </View>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Join PlantPortal</Text>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="gray"
            keyboardType="email-address"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              validateEmail(text);
            }}
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="gray"
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              validatePassword(text);
            }}
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleSignIn}>
            <Text style={styles.buttonText}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(tabs)/Registration')}
          >
            <Text style={styles.secondaryButtonText}>Don't have an account? Sign Up</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  logoContainer: {
    position: 'absolute',
    height: 90,
    top: 0,
    paddingLeft: 10,
    width: '100%',
    backgroundColor: '#F5F5DC',
  },
  logo: {
    width: 200,
    height: 90,
    resizeMode: 'contain',
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 46,
    color: '#FFFFFF',
    fontFamily: 'Quicksand',
    textAlign: 'center',
  },
  inputContainer: {
    width: '80%',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'lightgray',
    marginBottom: 10,
    fontSize: 16,
    color: '#4A4A4A',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
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
  forgotPasswordButton: {
    marginTop: 10,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  secondaryButton: {
    marginTop: 10,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
});

export default SignInScreen;
