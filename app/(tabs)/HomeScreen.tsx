import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Image,
  FlatList,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import axios from 'axios';

const defaultImageUri = require('@/assets/images/45777.png');

const popularPlants = [
  {
    id: '1',
    name: 'Monstera Deliciosa',
    nameKey: 'monsteraDeliciosa',
    descriptionKey: 'monsteraDescription',
    description:
      'A stunning tropical plant with large split leaves that thrives in indirect sunlight and requires moderate watering to maintain its lush appearance.',
    sunlight: 'medium',
    imageUri: null,
  },
  {
    id: '2',
    name: 'Fiddle Leaf Fig',
    nameKey: 'fiddleLeafFig',
    descriptionKey: 'fiddleDescription',
    description:
      'Known for its broad, violin-shaped leaves, this plant is a favorite among interior designers. It requires bright, indirect light and moderate watering.',
    sunlight: 'high',
    imageUri: null,
  },
  {
    id: '3',
    name: 'Snake Plant',
    nameKey: 'snakePlant',
    descriptionKey: 'snakeDescription',
    description:
      'A hardy plant with upright, sword-like leaves that tolerate low light and minimal watering.',
    sunlight: 'low',
    imageUri: null,
  },
];

const recommendedPlants = [
  {
    id: '4',
    name: 'Aloe Vera',
    nameKey: 'aloeVera',
    descriptionKey: 'aloeDescription',
    description:
      'An easy-to-grow succulent with medicinal properties. It thrives in bright sunlight and requires infrequent watering.',
    sunlight: 'high',
    imageUri: null,
  },
  {
    id: '5',
    name: 'Peace Lily',
    nameKey: 'peaceLily',
    descriptionKey: 'peaceDescription',
    description:
      'A beautiful plant known for its white flowers. It prefers shaded areas with moderate watering.',
    sunlight: 'medium',
    imageUri: null,
  },
  {
    id: '6',
    name: 'Spider Plant',
    nameKey: 'spiderPlant',
    descriptionKey: 'spiderDescription',
    description:
      'A resilient plant with arching green and white leaves. It adapts well to a variety of conditions.',
    sunlight: 'low',
    imageUri: null,
  },
];

const HomeScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const [selectedPlant, setSelectedPlant] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const isFocused = useIsFocused();

  const openModal = (plant) => {
    setSelectedPlant(plant);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const addToGarden = async (plant) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert(t('error'), t('noUserLoggedIn'));
        return;
      }

      const plantRef = doc(db, 'users', userId, 'garden', plant.id);

      const plantData = {
        name: plant.name,
        description: plant.description, 
        sunlight: plant.sunlight,
        imageUri: plant.imageUri || null,
        dateAdded: selectedDate.toISOString(),
      };

      await setDoc(plantRef, plantData);
      Alert.alert(t('success'), t('plantAddedToGarden', { plant: plant.name }));
      closeModal();
    } catch (error) {
      console.error('Error adding plant to garden:', error);
      Alert.alert(t('error'), t('addPlantFailed'));
    }
  };

  const renderSunlightIcons = (sunlightLevel) => {
    const sunCount = sunlightLevel === 'low' ? 1 : sunlightLevel === 'medium' ? 2 : 3;
    return Array(sunCount)
      .fill(0)
      .map((_, index) => (
        <Icon key={`sun-${index}`} name="sunny" size={20} color="#FFD700" style={styles.sunIcon} />
      ));
  };
  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image style={styles.logo} source={require('@/assets/images/PlantPortal-logo.png')} />
        </View>
        <Icon name="notifications-outline" size={24} color="#4A4A4A" />
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor="#B0B0B0"
        />
        <Icon name="search" size={20} color="#B0B0B0" style={styles.searchIcon} />
      </View>

      <Text style={styles.sectionTitle}>{t('mostPopular')}</Text>
      <FlatList
        data={popularPlants}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openModal(item)} style={styles.card}>
            <Image
              source={item.imageUri ? { uri: item.imageUri } : defaultImageUri}
              style={styles.plantImage}
            />
            <Text style={styles.plantName}>{t(item.nameKey)}</Text>
            <View style={styles.iconRow}>{renderSunlightIcons(item.sunlight)}</View>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.sectionTitle}>{t('recommended')}</Text>
      <FlatList
        data={recommendedPlants}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openModal(item)} style={styles.card}>
            <Image
              source={item.imageUri ? { uri: item.imageUri } : defaultImageUri}
              style={styles.plantImage}
            />
            <Text style={styles.plantName}>{t(item.nameKey)}</Text>
            <View style={styles.iconRow}>{renderSunlightIcons(item.sunlight)}</View>
          </TouchableOpacity>
        )}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(tabs)/SeasonalTips')}
        >
          <Text style={styles.buttonText}>{t('seasonalTips')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(tabs)/PersonalAssistantScreen')}
        >
          <Text style={styles.buttonText}>{t('personalAssistant')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(tabs)/askOthers')}
        >
          <Text style={styles.buttonText}>{t('askOthers')}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedPlant && (
              <>
                <Image
                  source={selectedPlant.imageUri ? { uri: selectedPlant.imageUri } : defaultImageUri}
                  style={styles.modalImage}
                />
                <Text style={styles.modalTitle}>{t(selectedPlant.nameKey)}</Text>
                <Text style={styles.modalDescription}>{t(selectedPlant.descriptionKey)}</Text>
                <View style={styles.iconRow}>
                  {renderSunlightIcons(selectedPlant.sunlight)}
                </View>
                 <TouchableOpacity style={styles.modalButton} onPress={showDatePickerModal}>
                  <Text style={styles.modalButtonText}>
                    {`${t('selectedDate')}: ${selectedDate.toDateString()}`}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    maximumDate={new Date()} 
                  />
                )}

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => addToGarden(selectedPlant)}
                >
                  <Text style={styles.modalButtonText}>{t('addToGarden')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalCloseButton} onPress={closeModal}>
                  <Text style={styles.modalButtonText}>{t('close')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/HomeScreen')} style={styles.iconContainer}>
          <Icon name="home-outline" size={24} color="#4A4A4A" />
          {isFocused && <View style={styles.activeIndicator} />}
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
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  sectionTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#4A4A4A',
    paddingHorizontal: 20,
    marginVertical: 15,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    borderRadius: 10,
    padding: 15,
    width: 180,
    alignItems: 'center',
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
    justifyContent: 'center',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalImage: {
    width: 150,
    height: 150,
    borderRadius: 80,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#4A4A4A',
  },
  modalDescription: {
    fontSize: 16,
    color: '#4A4A4A',
    marginBottom: 10,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#F5F5DC',
  },
  iconContainer: {
    alignItems: 'center',
  },
  sunIcon: {
    marginHorizontal: 2,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#BACBA9',
    paddingVertical: 12,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalCloseButton: {
    backgroundColor: '#FFA8A8',
    paddingVertical: 12,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginTop: 10,
  },
  activeIndicator: {
    width: 24,
    height: 3,
    backgroundColor: 'black', 
    marginTop: 5,
    borderRadius: 2,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  button: {
    backgroundColor: '#F5F5DC',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    transform: [{ scale: 1 }],
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
  },
  buttonText: {
    fontSize: 18,
    color: '#4A4A4A',
    fontWeight: 'bold',
  },
});

export default HomeScreen;
