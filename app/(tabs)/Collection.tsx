import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TextInput, TouchableOpacity, SafeAreaView, Modal, Button, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { collection, getDocs, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import { onSnapshot } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';

const Collection = () => {
  const [rankings, setRankings] = useState([]);
  const isFocused = useIsFocused();
  const router = useRouter();
  const { t } = useTranslation();
  const [isRankingsModalVisible, setIsRankingsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPlants, setFilteredPlants] = useState([]);
  const [allPlants, setAllPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isFullScreenModalVisible, setIsFullScreenModalVisible] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [userLanguage, setUserLanguage] = useState('bg'); 

  const openRankingsModal = () => {
    setIsRankingsModalVisible(true);
  };
  
  const closeRankingsModal = () => {
    setIsRankingsModalVisible(false);
  };

  const fetchUserLanguage = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const userDoc = await getDoc(doc(db, 'users', userId));
      const language = userDoc.data()?.language || 'bg';
      setUserLanguage(language);
      i18n.changeLanguage(language); 
    } catch (error) {
      console.error('Error fetching user language:', error);
    }
  };

  const translatePlantDataForUI = async (plant) => {
    const currentLanguage = i18n.language || 'en';
  
    if (currentLanguage === 'en') {
      return plant; 
    }
  
    try {
      const responseName = await axios.post(
        'https://api-free.deepl.com/v2/translate',
        null,
        {
          params: {
            auth_key: '2082be7d-06ea-4c98-ac08-89dc1634edc9:fx',
            text: plant.plantName,
            target_lang: currentLanguage.toUpperCase(),
          },
        }
      );
  
      const responseDescription = await axios.post(
        'https://api-free.deepl.com/v2/translate',
        null,
        {
          params: {
            auth_key: '2082be7d-06ea-4c98-ac08-89dc1634edc9:fx',
            text: plant.description,
            target_lang: currentLanguage.toUpperCase(),
          },
        }
      );
  
      return {
        ...plant,
        plantName: responseName.data.translations[0]?.text || plant.plantName,
        description: responseDescription.data.translations[0]?.text || plant.description,
      };
    } catch (error) {
      console.error('Error translating plant data:', error);
      return plant; 
    }
  };

  const fetchPlants = () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error('No user is logged in.');
      return;
    }
  
    const plantsCollectionRef = collection(db, 'users', userId, 'collection');
  
    return onSnapshot(plantsCollectionRef, async (snapshot) => {
      const plantsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      const translatedPlants = await Promise.all(
        plantsData.map(async (plant) => await translatePlantDataForUI(plant))
      );
  
      setAllPlants(translatedPlants);
      setFilteredPlants(translatedPlants);
    });
  };

  useEffect(() => {
    const unsubscribe = fetchPlants(); 
  
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe(); 
      }
    };
  }, [isFocused]);

  // Функция за превод на описанието
  const translatePlantData = async (plant) => {
    const currentLanguage = i18n.language || 'en'; 
  
    if (currentLanguage === 'en') {
      return plant;
    }
  
    try {
      const responseName = await axios.post(
        'https://api-free.deepl.com/v2/translate',
        null,
        {
          params: {
            auth_key: '***********************************', // DeepL API ключ
            text: plant.plantName, 
            target_lang: currentLanguage.toUpperCase(),
          },
        }
      );
  
      const responseDescription = await axios.post(
        'https://api-free.deepl.com/v2/translate',
        null,
        {
          params: {
            auth_key: '**********************************', // DeepL API ключ
            text: plant.description, 
            target_lang: currentLanguage.toUpperCase(),
          },
        }
      );
  
      return {
        ...plant,
        plantName: responseName.data.translations[0].text,
        description: responseDescription.data.translations[0].text,
      };
    } catch (error) {
      console.error('Error translating plant data:', error);
      return plant; 
    }
  };

  useEffect(() => {
    fetchUserLanguage();
    const unsubscribe = fetchPlants();
    return () => unsubscribe();
  }, [isFocused]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text === '') {
      setFilteredPlants(allPlants);
    } else {
      const filtered = allPlants.filter((plant) =>
        plant.plantName.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredPlants(filtered);
    }
  };

  const openPlantModal = async (plant) => {
    const translatedPlant = await translatePlantData(plant);
    setSelectedPlant(translatedPlant); 
    setModalVisible(true);
  };

  const removeFromCollection = async (plantId) => {
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser?.uid, 'collection', plantId));
      Alert.alert(t('success'), t('plantRemoved'));
      setModalVisible(false);
    } catch (error) {
      console.error('Error removing plant:', error);
      Alert.alert(t('errorRemovingPlant'));
    }
  };

  const addToGarden = async () => {
    if (!selectedPlant) {
      Alert.alert('Error', 'No plant selected');
      return;
    }

    try {
      const plantId = selectedPlant.id;
      const gardenRef = doc(db, 'users', auth.currentUser?.uid, 'garden', plantId);

      const plantData = {
        name: selectedPlant.plantName,
        image: selectedPlant.image,
        description: selectedPlant.description,
        dateAdded: selectedDate.toISOString(),
      };

      await setDoc(gardenRef, plantData);
      Alert.alert(t('success'), t('plantAddedToGarden'));
      closeFullScreenModal();
    } catch (error) {
      console.error('Error adding plant to garden:', error);
      Alert.alert(t('errorAddingPlant'));
    }
  };

  const closeFullScreenModal = () => {
    setIsFullScreenModalVisible(false);
  };

  const openFullScreenModal = () => {
    setIsFullScreenModalVisible(true);
  };

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const renderPlantCard = ({ item }) => {
    const sunlightIcons = Array(
      item.sunlight === 'low' ? 1 : item.sunlight === 'medium' ? 2 : 3
    ).fill(<Icon name="sunny" size={20} color="#FFC107" style={styles.sunIcon} />);
  
    return (
      <TouchableOpacity onPress={() => openPlantModal(item)}>
        <View style={styles.card}>
          <Image source={{ uri: item.image }} style={styles.plantImage} />
          <Text style={styles.plantName}>{item.plantName}</Text> 
          <View style={[styles.iconRow, sunlightIcons.length === 2 && styles.twoIconsRow]}>
            {sunlightIcons}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const fetchRankings = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
  
      const userRankings = [];
  
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
  
        const collectionRef = collection(db, 'users', userId, 'collection');
        const collectionSnapshot = await getDocs(collectionRef);
  
        userRankings.push({
          username: userData.username || 'Unknown User', 
          plantCount: collectionSnapshot.size,
        });
      }
  
      const sortedRankings = userRankings.sort((a, b) => b.plantCount - a.plantCount);
      setRankings(sortedRankings);
    } catch (error) {
      console.error('Error fetching rankings:', error);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image style={styles.logo} source={require('../../assets/images/PlantPortal-logo.png')} />
        </View>
        <Icon name="notifications-outline" size={24} color="#4A4A4A" />
      </View>

      <Text style={styles.title}>{t('collection')}</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('search')}
          placeholderTextColor="#B0B0B0"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <Icon name="search" size={20} color="#B0B0B0" style={styles.searchIcon} />
      </View>

      <TouchableOpacity style={styles.rankingsButton} onPress={openRankingsModal}>
  <Text style={styles.rankingsButtonText}>{t('viewRankings')}</Text>
</TouchableOpacity>

{isRankingsModalVisible && (
  <Modal
    animationType="fade"
    transparent={true}
    visible={isRankingsModalVisible}
    onRequestClose={closeRankingsModal}
  >
    <View style={styles.enhancedModalContainer}>
      <View style={styles.enhancedModalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.enhancedModalTitle}>{t('rankings')}</Text>
        </View>

        <View style={styles.divider} />

        <FlatList
          data={rankings}
          keyExtractor={(item) => item.username}
          renderItem={({ item, index }) => (
            <View style={styles.rankRow}>
              <Text style={styles.rankIndex}>{index + 1}.</Text>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.plantCount}>
                {item.plantCount} {t('plants')}
              </Text>
            </View>
          )}
        />

        <TouchableOpacity style={styles.enhancedCloseButton} onPress={closeRankingsModal}>
          <Text style={styles.enhancedCloseButtonText}>{t('close')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
)}

      <FlatList
        data={filteredPlants}
        keyExtractor={(item) => item.id}
        renderItem={renderPlantCard}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.plantList}
      />



{selectedPlant && (
  <Modal
    animationType="slide"
    transparent={true}
    visible={modalVisible}
    onRequestClose={() => setModalVisible(false)}
  >
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Image source={{ uri: selectedPlant.image }} style={styles.modalImage} />

        <Text style={styles.modalTitle}>
          {selectedPlant.plantName || t('noName')}
        </Text>

        <View style={styles.modalDescriptionContainer}>
          <Text style={styles.plantDescription}>
            {selectedPlant.description || t('noDescription')}
          </Text>
        </View>

        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => removeFromCollection(selectedPlant.id)}
          >
            <Text style={styles.modalButtonText}>{t('removeFromCollection')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalButton} onPress={openFullScreenModal}>
            <Text style={styles.modalButtonText}>{t('addToGarden')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
          <Text style={styles.modalButtonText}>{t('close')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
)}

{selectedPlant && (
  <Modal
    animationType="slide"
    transparent={false}
    visible={isFullScreenModalVisible}
    onRequestClose={closeFullScreenModal}
  >
    <View style={styles.fullScreenModalContainer}>
      <View style={styles.fullScreenModalContent}>
        <Text style={styles.plantNameModal}>
          {selectedPlant.plantName || t('noName')}
        </Text>

        <Image source={{ uri: selectedPlant.image }} style={styles.imagePreview} />

        <Text style={styles.plantDescription}>
          {selectedPlant.description || t('noDescription')}
        </Text>

        <Button title={t('pickDate')} onPress={() => setShowDatePicker(true)} />

        <Text style={styles.plantDateText}>
          {t('selectedDate')}: {selectedDate.toDateString()}
        </Text>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        <TouchableOpacity style={styles.fullScreenModalButton} onPress={addToGarden}>
          <Text style={styles.fullScreenModalButtonText}>{t('addPlantToGarden')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fullScreenModalCloseButton}
          onPress={closeFullScreenModal}
        >
          <Text style={styles.fullScreenModalButtonText}>{t('close')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
)}

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
          {isFocused && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/Profile')} style={styles.iconContainer}>
          <Icon name="person-outline" size={24} color="#4A4A4A" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#BACBA9',
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
    fontSize: 25,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginTop:20,
    marginBottom: 0,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
  },
  searchInput: {
    flex: 1,
  },
  searchIcon: {
    marginLeft: 10,
  },
  plantList: {
    paddingHorizontal: 10,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#fff',
    margin: 5,
    borderRadius: 10,
    padding: 15,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    height: 185, 
    width: 185,  
  },
  plantImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  plantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A4A4A',
    textAlign: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 80,
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#F5F5DC',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    textAlign: 'left', 
    width: '100%', 
  },
  modalDescriptionContainer: {
    width: '100%',
    marginBottom: 20,
  },
  modalDescriptionText: {
    fontSize: 16,
    marginVertical: 5, 
  },
  modalDescriptionLabel: {
    fontWeight: 'bold',
    color: '#4A4A4A', 
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'column',
    justifyContent: 'center',
    width: '100%',
    alignItems: 'center',
  },
  modalButton: {
    backgroundColor: '#BACBA9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginVertical: 10, 
    width: '80%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalCloseButton: {
    backgroundColor: '#FFA8A8', 
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    margin: 10,
    width: '80%',
    textAlign: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
  },
  activeIndicator: {
    width: 24,
    height: 3,
    backgroundColor: 'black', 
    marginTop: 5,
    borderRadius: 2,
  },

  fullScreenModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenModalContent: {
    width: '90%',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  plantNameModal: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
    alignSelf: 'center',
  },
  plantDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  plantDateText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
  },
  fullScreenModalButton: {
    backgroundColor: '#BACBA9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: 'center',
  },
  fullScreenModalCloseButton: {
    backgroundColor: '#FFA8A8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: 'center',
  },
  fullScreenModalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  twoIconsRow: {
    justifyContent: 'space-around', 
    width: 50, 
  },
  sunIcon: {
    marginHorizontal: 2, 
  },
  rankingsButton: {
    backgroundColor: '#BA9',
    padding: 15,
    borderRadius: 5,
    width: '90%',
    margin: 'auto',
    alignItems: 'center',
    marginVertical: 5,
    marginBottom: 40,
  },
  rankingsButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  enhancedModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', 
  },
  enhancedModalContent: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  enhancedModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#BACBA9',
  },
  divider: {
    height: 1,
    backgroundColor: '#DDD',
    marginVertical: 10,
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  rankIndex: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  plantCount: {
    fontSize: 16,
    color: '#BACBA9',
    fontStyle: 'italic',
  },
  enhancedCloseButton: {
    marginTop: 20,
    backgroundColor: '#FFC0C0',
    paddingVertical: 10,
    paddingHorizontal: 100,
    borderRadius: 25,
    alignSelf: 'center',
  },
  enhancedCloseButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


export default Collection;