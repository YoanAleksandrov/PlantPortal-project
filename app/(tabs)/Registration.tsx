import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView, Image, Alert, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from './firebaseConfig'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore'; 

const SignUpScreen = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const db = getFirestore();

  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const handleSignUp = async () => {
    let valid = true;

    if (!validateEmail(email)) {
      setEmailError('Invalid email format');
      valid = false;
    } else {
      setEmailError('');
    }

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      valid = false;
    } else {
      setPasswordError('');
    }

    if (!valid) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        username: username,
        email: email,
      });

      router.push('/RegistrationSuccessfulScreen');
    } catch (error) {
      if (error.code === 'auth/weak-password') {
        setPasswordError('Password should be at least 6 characters.');
      } else if (error.code === 'auth/invalid-email') {
        setEmailError('Invalid email format');
      } else if (error.code === 'auth/email-already-in-use') {
        setEmailError('This email is already in use');
      } else {
        Alert.alert('Error', error.message);
      }
    }
  };

  return (
    <ImageBackground
      source={require('@/assets/images/RegistrationImage.webp')} 
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
            placeholder="Username"
            placeholderTextColor="gray"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="gray"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="gray"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleSignUp}>
            <Text style={styles.buttonText}>Sign up</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(tabs)/Login')}
          >
            <Text style={styles.secondaryButtonText}>Already have an account? Sign In</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
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
    color: '#FFF',
    fontFamily: 'Quicksand',
  },
  inputContainer: {
    width: '80%',
    marginBottom: 0,
  },
  input: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'lightgray',
    marginBottom: 5,
    fontSize: 16,
    color: 'black',
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
  secondaryButton: {
    marginTop: 10,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
});

export default SignUpScreen;
