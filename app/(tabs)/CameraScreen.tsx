import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView, Modal, Button } from 'react-native';
import { Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import { getPlantDescriptionFromFirestore, savePlantDescriptionToFirestore } from './firestoreHelpers'; 
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig'; 
import { useRouter } from 'expo-router';
import { auth } from './firebaseConfig';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';

const CameraScreen = () => {
  const isFocused = useIsFocused();
  const [image, setImage] = useState<string | null>(null);
  const [plantModalVisible, setPlantModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plantName, setPlantName] = useState<string | null>(null);
  const [plantDetails, setPlantDetails] = useState<any>(null);
  const [selectedOrgan, setSelectedOrgan] = useState('leaf'); 
  const [showOrganPicker, setShowOrganPicker] = useState(false); 
  const [isCameraImage, setIsCameraImage] = useState(false);
  const [isPlantIdentified, setIsPlantIdentified] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); 
  const { t } = useTranslation();
  const router = useRouter();

  const resetPlantState = () => {
    setPlantName(null);
    setPlantDetails(null);
    setIsPlantIdentified(false);
    setErrorMessage(null);
  };

  const translatePlantDetails = async (name, description, targetLang) => {
    try {
      const apiKey = '************************************'; // DeepL API ключ
  
      const [nameResponse, descriptionResponse] = await Promise.all([
        axios.post('https://api-free.deepl.com/v2/translate', null, {
          params: {
            auth_key: apiKey,
            text: name,
            target_lang: targetLang.toUpperCase(),
          },
        }),
        axios.post('https://api-free.deepl.com/v2/translate', null, {
          params: {
            auth_key: apiKey,
            text: description,
            target_lang: targetLang.toUpperCase(),
          },
        }),
      ]);
  
      return {
        plantName: nameResponse.data.translations[0]?.text || name,
        description: descriptionResponse.data.translations[0]?.text || description,
      };
    } catch (error) {
      console.error('Error translating plant details:', error);
      return { plantName: name, description }; 
    }
  };
  

  const fetchSunlightRequirement = async (plantName) => {
    const apiKey = '******************************************************';
    const prompt = `What level of sunlight does a ${plantName} need? Respond only with "low", "medium", or "high".`;
  
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 10,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      const sunlightRequirement = response.data.choices[0]?.message?.content.trim().toLowerCase();
      return ['low', 'medium', 'high'].includes(sunlightRequirement) ? sunlightRequirement : 'medium';
    } catch (error) {
      console.error('Error fetching sunlight requirement:', error);
      return 'medium'; 
    }
  };

  const takeImageWithCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access the camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setIsCameraImage(true);
      setShowOrganPicker(true); 
      resetPlantState(); 
    }
  };

  const pickImageFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access the gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setIsCameraImage(false);
      setShowOrganPicker(true);
      resetPlantState(); 
    }
  };

  const fetchPlantDescriptionFromGPT = async (plantName) => {
    const apiKey = '*********************************************************************************';
    const prompt = `Give a brief and consistent description of the plant ${plantName}. Include its common uses, habitat, and key features with max 30 worrds.`;
  
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 60,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      const gptResponse = response.data.choices[0]?.message?.content;
      return gptResponse ? gptResponse.trim() : 'Description not available';
    } catch (error) {
      console.error('Error fetching plant description from GPT:', error);
      return 'Description not available';
    }
  };

  const analyzeImage = async () => {
    if (!image) {
      Alert.alert(t('error'), t('selectPhotoFirst'));
      return;
    }
  
    setLoading(true);
    resetPlantState();
  
    const formData = new FormData();
    formData.append('images', {
      uri: image,
      type: 'image/jpeg',
      name: 'photo.jpg',
    });
  
    formData.append('organs', selectedOrgan);
  
    const plantNetApiKey = '****************************';
    const url = `https://my-api.plantnet.org/v2/identify/all?api-key=${plantNetApiKey}`;
  
    try {
      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      const plantSuggestions = response.data.results;
      if (plantSuggestions && plantSuggestions.length > 0) {
        const detectedPlantName =
          plantSuggestions[0].species.commonNames[0] || plantSuggestions[0].species.scientificNameWithoutAuthor;
  
        const englishDescription = await fetchPlantDescriptionFromGPT(detectedPlantName);
        const sunlightRequirement = await fetchSunlightRequirement(detectedPlantName);
  
        const translatedDetails =
          i18n.language === 'bg'
            ? await translatePlantDetails(detectedPlantName, englishDescription, 'bg')
            : { plantName: detectedPlantName, description: englishDescription };
  
        setPlantName(detectedPlantName);
        setPlantDetails({
          description: translatedDetails.description, 
          originalDescription: englishDescription, 
          sunlight: sunlightRequirement,
          image: image, 
        });
  
        setIsPlantIdentified(true);
      } else {
        setPlantName(t('noPlantFound'));
        setIsPlantIdentified(false);
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error analyzing the image:', error);
      Alert.alert(t('error'), t('analyzeFailed'));
    } finally {
      setLoading(false);
    }
  };
  

  const savePlantDescriptionToFirestore = async (plantName, data) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
  
    try {
      await setDoc(doc(db, 'users', userId, 'collection', plantName), {
        plantName: plantName, 
        description: data.description, 
        sunlight: data.sunlight || 'medium', 
        image: data.image, 
      });
    } catch (error) {
      console.error('Error saving plant description to Firestore:', error);
    }
  };

  const showDescription = () => {
    if (plantDetails) {
      setPlantModalVisible(true);
    }
  };

  

  const addToCollection = async () => {
    if (!plantName || !plantDetails?.originalDescription || !plantDetails?.image) {
      Alert.alert(t('error'), t('missingData'));
      return;
    }
  
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert(t('error'), t('noUserLoggedIn'));
        return;
      }
  
      await setDoc(doc(db, 'users', userId, 'collection', plantName), {
        plantName: plantName, 
        description: plantDetails.originalDescription, 
        sunlight: plantDetails.sunlight || 'medium', 
        image: plantDetails.image, 
      });
  
      Alert.alert(t('success'), t('plantAddedToCollection'));
    } catch (error) {
      console.error('Error adding plant to collection:', error);
      Alert.alert(t('error'), t('addToCollectionFailed'));
    }
  };

 

  return (
    <View style={styles.container}>
  <View style={styles.header}>
    <View style={styles.logoContainer}>
      <Image style={styles.logo} source={require('../../assets/images/PlantPortal-logo.png')} />
    </View>
    <Icon name="notifications-outline" size={24} color="#4A4A4A" />
  </View>

  <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>{t('identifyPlant')}</Text>

    <TouchableOpacity style={styles.button} onPress={takeImageWithCamera}>
      <Icon name="camera-outline" size={24} color="#4A4A4A" />
      <Text style={styles.buttonText}>{t('takePhoto')}</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.button} onPress={pickImageFromGallery}>
      <Icon name="images-outline" size={24} color="#4A4A4A" />
      <Text style={styles.buttonText}>{t('selectFromGallery')}</Text>
    </TouchableOpacity>

    {image && <Image source={{ uri: image }} style={styles.imagePreview} />}

    {showOrganPicker && (
      <View style={styles.organSelection}>
        <Text style={styles.pickerLabel}>{t('selectPlantPart')}</Text>
        <View style={styles.organButtons}>
          {['leaf', 'flower', 'fruit', 'bark', 'stem'].map((organ) => (
            <TouchableOpacity
              key={organ}
              style={[
                styles.organButton,
                selectedOrgan === organ && styles.selectedOrganButton,
              ]}
              onPress={() => setSelectedOrgan(organ)}
            >
              <Text style={styles.organButtonText}>{t(organ)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )}
    {image && (
      <TouchableOpacity style={styles.button} onPress={analyzeImage} disabled={loading}>
        <Icon name="analytics-outline" size={24} color="#4A4A4A" />
        <Text style={styles.buttonText}>{t('analyzeImage')}</Text>
      </TouchableOpacity>
    )}

    {loading && <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 20 }} />}

    {plantName && !loading && (
      <Text style={styles.resultText}>
        {t('identifiedPlant')}: {plantName}
      </Text>
    )}

    {plantDetails && plantName && !loading && (
      <TouchableOpacity style={styles.button} onPress={showDescription}>
        <Icon name="information-circle-outline" size={24} color="#4A4A4A" />
        <Text style={styles.buttonText}>{t('viewDescription')}</Text>
      </TouchableOpacity>
    )}

    {isCameraImage && image && isPlantIdentified && !loading && (
      <TouchableOpacity style={styles.button} onPress={addToCollection}>
        <Icon name="add-circle-outline" size={24} color="#4A4A4A" />
        <Text style={styles.buttonText}>{t('addToCollection')}</Text>
      </TouchableOpacity>
    )}
  </ScrollView>

      <View style={styles.footer}>
      <TouchableOpacity onPress={() => router.push('/(tabs)/HomeScreen')} style={styles.iconContainer}>
          <Icon name="home-outline" size={24} color="#4A4A4A" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/MyGarden')} style={styles.iconContainer}>
          <Icon name="leaf-outline" size={24} color="#4A4A4A" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/CameraScreen')} style={styles.iconContainer}>
          <Icon name="camera-outline" size={24} color="#4A4A4A" />
          {isFocused && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/Collection')} style={styles.iconContainer}>
          <Icon name="albums-outline" size={24} color="#4A4A4A" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/Profile')} style={styles.iconContainer}>
          <Icon name="person-outline" size={24} color="#4A4A4A" />
        </TouchableOpacity>
      </View>
      
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
  <View style={styles.modalContainer}>
    <View style={styles.modalView}>
      <Text style={styles.modalText}>{t('noPlantFound')}</Text>
      <TouchableOpacity style={styles.buttonClose} onPress={() => setModalVisible(false)}>
        <Text style={styles.textStyle}>{t('ok')}</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

<Modal
        animationType="slide"
        transparent={true}
        visible={plantModalVisible}
        onRequestClose={() => setPlantModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('plantDetails')}</Text>
            <Text style={styles.modalText}>
              {`${t('description')}: ${
                plantDetails?.description || t('noAdditionalInfo')
              }`}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setPlantModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 30,
    marginTop:20,
    textAlign: 'center',
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
    resizeMode: 'cover',
  },
  button: {
    backgroundColor: '#F5F5DC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', 
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 15,
    width: 250,
  },
  buttonText: {
    fontSize: 16,
    color: '#4A4A4A',
    fontWeight: 'bold',
    textAlign: 'center',
    marginLeft: 10 
  },
  resultText: {
    fontSize: 20,
    marginTop: 20,
    color: '#4A4A4A',
    fontWeight: 'bold',
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
  organSelection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  organButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  organButton: {
    padding: 10,
    backgroundColor: '#E8E8E8',
    borderRadius: 10,
    margin: 5,
    width: 100,
    alignItems: 'center',
  },
  selectedOrganButton: {
    backgroundColor: '#4CAF50',
  },
  organButtonText: {
    fontSize: 16,
    color: '#4A4A4A',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonClose: {
    backgroundColor: '#4CAF50',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: '#FFC0C0',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CameraScreen;
