import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Image, Alert, Modal, TextInput } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { auth } from './firebaseConfig';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { signOut, sendPasswordResetEmail, updateEmail } from 'firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import i18n from './i18n';
import { useTranslation } from 'react-i18next';

const Profile = () => {
  const isFocused = useIsFocused();
  const router = useRouter();
  const { t } = useTranslation();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [language, setLanguage] = useState('bg'); 
  const [gardenCount, setGardenCount] = useState(0);
  const [collectionCount, setCollectionCount] = useState(0);

  const db = getFirestore();
  const user = auth.currentUser;

  const loadUserData = async () => {
    try {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUsername(userData.username || 'Unknown User');
          setEmail(user.email || '');
          setLanguage(userData.language || 'bg');

          const gardenSnapshot = await getDocs(collection(db, `users/${user.uid}/garden`));
          setGardenCount(gardenSnapshot.size);

          const collectionSnapshot = await getDocs(collection(db, `users/${user.uid}/collection`));
          setCollectionCount(collectionSnapshot.size);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert(t('error'), t('failedToLoadUserData'));
    }
  };

  // Промяна на езика
  const handleLanguageChange = async () => {
    const newLanguage = language === 'bg' ? 'en' : 'bg';
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);

    try {
      if (user) {
        await setDoc(doc(db, 'users', user.uid), { language: newLanguage }, { merge: true });
      }
    } catch (error) {
      Alert.alert(t('error'), t('failedToUpdateLanguage'));
    }
  };

  // Излизане
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/Login');
    } catch (error) {
      Alert.alert(t('error'), t('failedToSignOut'));
    }
  };

  // Промяна на имейл
  const handleUpdateEmail = () => {
    setModalVisible(true);
  };

  const handleSaveEmail = async () => {
    try {
      if (newEmail) {
        await updateEmail(user, newEmail);
        Alert.alert(t('success'), t('emailUpdated'));
        setEmail(newEmail);
        setModalVisible(false);
      } else {
        Alert.alert(t('error'), t('enterValidEmail'));
      }
    } catch (error) {
      Alert.alert(t('error'), error.message);
    }
  };

  // Смяна на парола
  const handleChangePassword = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(t('success'), t('passwordResetEmailSent'));
    } catch (error) {
      Alert.alert(t('error'), error.message);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [isFocused]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image style={styles.logo} source={require('../../assets/images/PlantPortal-logo.png')} />
        </View>
        <Icon name="notifications-outline" size={24} color="#4A4A4A" />
      </View>
      <Text style={styles.title}>{t('hello')}, {username}</Text>
      <Text style={styles.emailText}>{t('email')}: {email}</Text>

      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Icon name="leaf-outline" size={30} color="#4D7E3D" />
          <Text style={styles.statText}>{t('garden')}: {gardenCount} {t('plants')}</Text>
        </View>
        <View style={styles.stat}>
          <Icon name="albums-outline" size={30} color="#4D7E3D" />
          <Text style={styles.statText}>{t('collection')}: {collectionCount} {t('plants')}</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleUpdateEmail}>
          <Icon name="mail-outline" size={20} color="#4A4A4A" />
          <Text style={styles.buttonText}>{t('changeEmail')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
          <Icon name="key-outline" size={20} color="#4A4A4A" />
          <Text style={styles.buttonText}>{t('changePassword')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleLanguageChange}>
          <Icon name="language-outline" size={20} color="#4A4A4A" />
          <Text style={styles.buttonText}>{t('changeLanguage')}: {language === 'bg' ? 'Български' : 'English'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Icon name="log-out-outline" size={20} color="#FFF" />
          <Text style={styles.signOutButtonText}>{t('signOut')}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>{t('enterNewEmail')}:</Text>
            <TextInput
              style={styles.input}
              placeholder={t('newEmail')}
              placeholderTextColor="gray"
              value={newEmail}
              onChangeText={setNewEmail}
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.modalButton} onPress={handleSaveEmail}>
                <Text style={styles.modalButtonText}>{t('save')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
          <View style={styles.footer}>
    <TouchableOpacity onPress={() => router.push('/(tabs)/HomeScreen')} style={styles.iconContainer}>
      <Icon name="home-outline" size={24} color="#4A4A4A" />
    </TouchableOpacity>
    <TouchableOpacity onPress={() => router.push('/(tabs)/MyGarden')} style={styles.iconContainer}>
      <Icon name="leaf-outline" size={24} color="#4A4A4A" />
    </TouchableOpacity>
    <TouchableOpacity onPress={() => router.push('/(tabs)/CameraScreen')} style={styles.iconContainer}>
      <Icon name="camera-outline" size={24} color="#4A4A4A" />
    </TouchableOpacity>
    <TouchableOpacity onPress={() => router.push('/(tabs)/Collection')} style={styles.iconContainer}>
      <Icon name="albums-outline" size={24} color="#4A4A4A" />
    </TouchableOpacity>
    <TouchableOpacity onPress={() => router.push('/(tabs)/Profile')} style={styles.iconContainer}>
      <Icon name="person-outline" size={24} color="#4A4A4A" />
      {isFocused && <View style={styles.activeIndicator} />}
    </TouchableOpacity>
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#BACBA9',
    paddingHorizontal: 20, 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F5F5DC',
    width: '100%', 
  },
  logoContainer: {
    height: 50,
  },
  logo: {
    width: 200,
    height: 50,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 50,
    color: '#4D7E3D',
    textAlign: 'center',
  },
  emailText: {
    fontSize: 18,
    color: '#4A4A4A',
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  button: {
    backgroundColor: '#F5F5DC',
    paddingVertical: 15,
    borderRadius: 30, 
    alignItems: 'center',
    marginBottom: 15,
    flexDirection: 'row', 
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: '#4A4A4A',
    fontWeight: 'bold',
    marginLeft: 10, 
  },
  signOutButton: {
    backgroundColor: '#FFA8A8',
    paddingVertical: 15,
    borderRadius: 30, 
    alignItems: 'center',
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signOutButtonText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalView: {
    width: 300,
    backgroundColor: '#FFF',
    borderRadius: 15, 
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    fontSize: 20, 
    marginBottom: 15,
    fontWeight: '500',
    color: '#4D7E3D',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#F0F0F0',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  modalButton: {
    backgroundColor: '#4D7E3D',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',  
    bottom: 0,  
    width: '100%',  
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#F5F5DC',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  activeIndicator: {
    width: 24,
    height: 3,
    backgroundColor: 'black', 
    marginTop: 5,
    borderRadius: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  iconContainer: {
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  stat: {
    alignItems: 'center',
  },
  statText: {
    fontSize: 16,
    color: '#4A4A4A',
    marginTop: 5,
  },
});

export default Profile;