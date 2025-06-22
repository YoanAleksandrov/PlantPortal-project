import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "*********************",
  authDomain: "*********************",
  projectId: "*********************",
  storageBucket: "*********************",
  messagingSenderId: "*********************",
  appId: "*********************",
  measurementId: "*********************"
  };

  let app;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  export { auth, db };