import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet,Button, FlatList, Image, TextInput, TouchableOpacity, Modal, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { useNavigation, useIsFocused } from '@react-navigation/native'; 
import { collection, onSnapshot, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig'; 
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import DateTimePicker from '@react-native-community/datetimepicker';
import { updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useRouter } from 'expo-router';
import { auth } from './firebaseConfig';
import { Calendar, CalendarList, Agenda } from 'react-native-calendars';
import { useTranslation } from 'react-i18next'; 



const MyGardenScreen = () => {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const [isSearchInfoModalVisible, setSearchInfoModalVisible] = useState(false);
  const [isHelpModalVisible, setHelpModalVisible] = useState(false);
  const [fullScreenModalVisible, setFullScreenModalVisible] = useState(false);
  const [selectedPlantInModal, setSelectedPlantInModal] = useState(null);
  const [myPlants, setMyPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchQueryMain, setSearchQueryMain] = useState('');
  const [filteredPlants, setFilteredPlants] = useState([]);
  const [plantSuggestions, setPlantSuggestions] = useState([]);
  const [isInGarden, setIsInGarden] = useState(false);
  const [plantDescription, setPlantDescription] = useState('');
  const [wateringModalVisible, setWateringModalVisible] = useState(false);
  const [wateringDates, setWateringDates] = useState({}); 
  const [plantWateringDates, setPlantWateringDates] = useState({});
const [calendarSelectedDate, setCalendarSelectedDate] = useState(null); 
const [plantWateringStatus, setPlantWateringStatus] = useState({});
const [initialModalOpened, setInitialModalOpened] = useState(false);

const handlePlantSelection = async (plant) => {
  const translatedPlant = await translatePlantDataForUI(plant); 
  setSelectedPlantInModal(translatedPlant); 
};

const translateDescription = async (description, targetLanguage) => {
  if (targetLanguage === 'en') return description; 

  try {
    const response = await axios.post(
      'https://api-free.deepl.com/v2/translate',
      null,
      {
        params: {
          auth_key: '*************************', // DeepL API ключ
          text: description,
          target_lang: targetLanguage.toUpperCase(),
        },
      }
    );

    return response.data.translations[0]?.text || description;
  } catch (error) {
    console.error('Error translating description:', error);
    return description; 
  }
};

const translatePlantDataForUI = async (plant) => {
  const targetLanguage = i18n.language || 'en'; 

  try {
    console.log(`Translating plant data for: ${plant.name}`); 

    const responseName = await axios.post(
      'https://api-free.deepl.com/v2/translate',
      null,
      {
        params: {
          auth_key: '****************************', 
          text: plant.name,
          target_lang: targetLanguage.toUpperCase(),
        },
      }
    );

    const responseDescription = await axios.post(
      'https://api-free.deepl.com/v2/translate',
      null,
      {
        params: {
          auth_key: '********************************', 
          text: plant.description || '',
          target_lang: targetLanguage.toUpperCase(),
        },
      }
    );

    return {
      ...plant,
      name: responseName.data.translations[0]?.text || plant.name,
      description: responseDescription.data.translations[0]?.text || plant.description,
    };
  } catch (error) {
    console.error('Error translating plant data:', error);
    return plant;
  }
};



useEffect(() => {
  if (!initialModalOpened && myPlants.length > 0) {
    (async () => {
      for (const plant of myPlants) {
        setSelectedPlant(plant); 
        setModalVisible(true); 
        await new Promise((resolve) => setTimeout(resolve, 1)); 
        setModalVisible(false); 
      }
      setSelectedPlant(null); 
      setInitialModalOpened(true); 
    })();
  }
}, [myPlants, initialModalOpened]);

const renderModalContent = () => {
  if (!initialModalOpened) {
    return <View />;
  }

  return (
    <View style={styles.modalContent}>
      <Image
        source={selectedPlant?.image ? { uri: selectedPlant.image } : defaultImageUri}
        style={styles.modalImage}
      />
      <Text style={styles.modalTitle}>{selectedPlant?.name}</Text> 
<Text style={styles.modalDescription}>
  {t('date_planted')}: {new Date(selectedPlant?.dateAdded).toDateString() || t('n_a')}
</Text>
      <Text style={styles.modalDescription}>
      {t('description')}: {selectedPlant?.description || t('no_description_available')}
</Text>
      <View style={styles.modalButtons}>
      <TouchableOpacity style={styles.modalButton} onPress={handleGardenAction}>
  <Text style={styles.modalButtonText}>
    {isInGarden ? t('remove_from_garden') : t('add_to_garden')}
  </Text>
</TouchableOpacity>
<TouchableOpacity style={styles.modalButton} onPress={openWateringModal}>
  <Text style={styles.modalButtonText}>{t('watering')}</Text> 
</TouchableOpacity>
<TouchableOpacity
  style={styles.modalCloseButton}
  onPress={() => setModalVisible(false)}
>
  <Text style={styles.modalButtonText}>{t('close')}</Text> 
</TouchableOpacity>
      </View>
    </View>
  );
};


  const openWateringModal = () => {
    setWateringModalVisible(true);
  };
  const closeWateringModal = () => {
    setWateringModalVisible(false);
  };

  

const today = new Date().toISOString().split('T')[0];
useEffect(() => {
  if (selectedPlant?.id && selectedPlant?.dateAdded) {
    const plantingDate = new Date(selectedPlant.dateAdded).toISOString().split('T')[0];

    setPlantWateringDates((prev) => ({
      ...prev,
      [selectedPlant.id]: {
        ...prev[selectedPlant.id],
        [plantingDate]: {
          selected: false,
          customStyles: {
            container: { backgroundColor: 'transparent' },
            text: { color: 'purple', fontWeight: 'bold' },
          },
        },
        [today]: {
          customStyles: {
            container: { backgroundColor: 'transparent' },
            text: { color: 'green', fontWeight: 'bold' },
          },
        },
      },
    }));
  }
}, [selectedPlant]);
const getCurrentWateringDates = () => plantWateringDates[selectedPlant?.id] || {};

const updateRecommendedDates = (referenceDate, wateringInterval) => {
  if (!selectedPlant?.id) return;

  const plantId = selectedPlant.id;
  const plantDates = plantWateringDates[plantId] || {};

  const lastWateredDate = Object.keys(plantDates)
    .filter((date) => plantDates[date]?.customStyles?.container?.backgroundColor === 'blue')
    .sort()
    .pop();

  const actualReferenceDate = lastWateredDate
    ? new Date(Math.max(new Date(referenceDate), new Date(lastWateredDate))).toISOString().split('T')[0]
    : referenceDate;

  let nextDate = new Date(actualReferenceDate);

  setPlantWateringDates((prev) => {
    const updatedDates = { ...prev };
    const plantDates = updatedDates[plantId] || {};
    Object.keys(plantDates).forEach((key) => {
      if (plantDates[key]?.customStyles?.text?.color === 'yellow' || plantDates[key]?.customStyles?.text?.color === 'orange') {
        delete plantDates[key];
      }
    });
    updatedDates[plantId] = plantDates;
    return updatedDates;
  });

  const newDates = {};
  for (let i = 1; i <= 5; i++) {
    nextDate.setDate(nextDate.getDate() + wateringInterval);
    const formattedDate = nextDate.toISOString().split('T')[0];
    if (new Date(formattedDate) < new Date(today)) {
      const isWatered = plantWateringDates[plantId]?.[formattedDate]?.customStyles?.container?.backgroundColor === 'blue';

      if (!isWatered) {
        newDates[formattedDate] = {
          customStyles: {
            container: { backgroundColor: 'transparent' },
            text: { color: 'orange', fontWeight: 'bold' }, 
          },
        };
        continue;
      }
    }

    newDates[formattedDate] = {
      customStyles: {
        container: { backgroundColor: 'transparent' },
        text: { color: 'yellow', fontWeight: 'bold' },
      },
    };
  }

  setPlantWateringDates((prev) => ({
    ...prev,
    [plantId]: {
      ...prev[plantId],
      ...newDates,
    },
  }));
};

const handleDayPress = (day) => {
  const formattedDate = day.dateString;

  setCalendarSelectedDate(formattedDate); 
  setPlantWateringDates((prev) => {
    const updatedDates = { ...prev };
    const plantDates = updatedDates[selectedPlant.id] || {};

    if (plantDates[formattedDate]?.customStyles?.container?.backgroundColor === 'blue') {
      return updatedDates; 
    }
    Object.keys(plantDates).forEach((key) => {
      if (plantDates[key]?.customStyles?.container?.backgroundColor === 'red') {
        plantDates[key].customStyles.container.backgroundColor = 'transparent';
      }
    });

    plantDates[formattedDate] = {
      ...plantDates[formattedDate],
      customStyles: {
        ...plantDates[formattedDate]?.customStyles,
        container: { backgroundColor: 'red' },
      },
    };

    updatedDates[selectedPlant.id] = plantDates;
    return updatedDates;
  });
};

const fetchWateringFrequency = async (plantName) => {
  const apiKey = '*******************************'; // Заменете с вашия OpenAI API ключ
  const url = 'https://api.openai.com/v1/chat/completions';

  const data = {
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a plant expert. Respond concisely.',
      },
      {
        role: 'user',
        content: `How many days should pass between each watering for a ${plantName} give me only the number, nothing else?`,
      },
    ],
    max_tokens: 10,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      const interval = parseInt(result.choices[0].message.content, 10);
      if (!isNaN(interval) && interval > 0) {
        return interval; 
      }
    }
    console.error('Error parsing watering frequency:', result);
    return 7; 
  } catch (error) {
    console.error('Error fetching watering frequency:', error);
    return 7; 
  }
};

const getWateringStatus = (plantId) => {
  const plantDates = plantWateringDates[plantId] || {};
  const todayDate = new Date(today);
  let missedDatesCount = 0;
  Object.keys(plantDates).forEach((date) => {
    const dateObject = new Date(date);

    if (
      dateObject < todayDate &&
      plantDates[date]?.customStyles?.text?.color === 'orange' 
    ) {
      missedDatesCount++;
    }
  });
  if (missedDatesCount >= 2) {
    return 'red'; 
  } else if (missedDatesCount === 1) {
    return 'orange'; 
  } else {
    return 'blue';
  }
};

const handleWatering = async () => {
  if (!calendarSelectedDate || !selectedPlant?.id || !selectedPlant?.dateAdded) return;

  const plantId = selectedPlant.id;
  const plantRef = doc(db, 'users', auth.currentUser?.uid, 'garden', plantId);

  const plantingDate = new Date(selectedPlant.dateAdded);
  const selectedDate = new Date(calendarSelectedDate);
  const todayDate = new Date(today);

  if (selectedDate > todayDate) {
    alert('You cannot water a future date!');
    return;
  }

  if (selectedDate < plantingDate) {
    alert('You cannot water a date before the plant was planted!');
    return;
  }

  const isWatered = plantWateringDates[plantId]?.[calendarSelectedDate]?.customStyles?.container?.backgroundColor === 'blue';

  if (isWatered) {
    setPlantWateringDates((prev) => {
      const updatedDates = { ...prev };
      const plantDates = updatedDates[plantId] || {};

      if (calendarSelectedDate === today) {
        plantDates[calendarSelectedDate] = {
          ...plantDates[calendarSelectedDate],
          customStyles: {
            container: { backgroundColor: 'transparent' },
            text: { color: 'green', fontWeight: 'bold' },
          },
        };
      } else {
        plantDates[calendarSelectedDate] = {
          ...plantDates[calendarSelectedDate],
          customStyles: {
            container: { backgroundColor: 'transparent' },
            text: { color: 'black' },
          },
        };
      }

      updatedDates[plantId] = plantDates;
      return updatedDates;
    });

    await updateDoc(plantRef, {
      wateredDates: arrayRemove(calendarSelectedDate),
    });

    const plantDoc = await getDoc(plantRef);
    const data = plantDoc.data();
    const wateredDates = data?.wateredDates || [];

    if (wateredDates.length > 0) {
      const lastWateredDate = wateredDates.sort().pop();
      updateRecommendedDates(lastWateredDate, selectedPlant.wateringInterval);
    } else {
      updateRecommendedDates(selectedPlant.dateAdded, selectedPlant.wateringInterval);
    }
  } else {
    setPlantWateringDates((prev) => ({
      ...prev,
      [plantId]: {
        ...prev[plantId],
        [calendarSelectedDate]: {
          customStyles: { container: { backgroundColor: 'blue' }, text: { color: 'white' } },
        },
      },
    }));

    await updateDoc(plantRef, {
      wateredDates: arrayUnion(calendarSelectedDate),
    });
    updateRecommendedDates(calendarSelectedDate, selectedPlant.wateringInterval);
  }
};





const getLastWateredDates = async (plantId) => {
  const plantRef = doc(db, 'users', auth.currentUser?.uid, 'garden', plantId);

  try {
    const plantDoc = await getDoc(plantRef);
    if (plantDoc.exists()) {
      const data = plantDoc.data();
      const wateredDates = data.wateredDates || [];
      return wateredDates.sort(); 
    }
    return [];
  } catch (error) {
    console.error('Error fetching watered dates:', error);
    return [];
  }
};

useEffect(() => {
  const updateWateringStatus = () => {
    const statuses = {};
    myPlants.forEach((plant) => {
      statuses[plant.id] = getWateringStatus(plant.id);
    });
    setPlantWateringStatus(statuses);
  };

  updateWateringStatus();
}, [myPlants, plantWateringDates]);

const loadRecommendedDates = async () => {
  if (!selectedPlant?.id || !selectedPlant?.dateAdded) return;

  const plantId = selectedPlant.id;
  const plantRef = doc(db, 'users', auth.currentUser?.uid, 'garden', plantId);

  try {
    const plantDoc = await getDoc(plantRef);
    if (plantDoc.exists()) {
      const data = plantDoc.data();
      const wateredDates = data.wateredDates || [];
      let wateringInterval = selectedPlant?.wateringInterval;

      if (!wateringInterval) {
        wateringInterval = await fetchWateringFrequency(selectedPlant.name);
        await updateDoc(plantRef, { wateringInterval }); 
      }

      let referenceDate;
      if (wateredDates.length > 0) {
        const todayDate = new Date(today);
        referenceDate = wateredDates.reduce((closestDate, currentDate) => {
          const currentDateObj = new Date(currentDate);
          return Math.abs(todayDate - currentDateObj) < Math.abs(todayDate - new Date(closestDate))
            ? currentDate
            : closestDate;
        });
      } else {
        referenceDate = selectedPlant.dateAdded;
      }

      updateRecommendedDates(referenceDate, wateringInterval);
    }
  } catch (error) {
    console.error('Error loading recommended dates:', error);
  }
};

useEffect(() => {
  if (selectedPlant) {
    loadRecommendedDates();
  }
}, [selectedPlant]);


const loadWateredDates = async () => {
  if (!selectedPlant?.id) return;

  const plantId = selectedPlant.id;
  const plantRef = doc(db, 'users', auth.currentUser?.uid, 'garden', plantId);

  try {
    const plantDoc = await getDoc(plantRef);
    if (plantDoc.exists()) {
      const data = plantDoc.data();
      const wateredDates = data.wateredDates || [];

      const updatedDates = {};
      wateredDates.forEach((date) => {
        updatedDates[date] = {
          customStyles: {
            container: { backgroundColor: 'blue' },
            text: { color: 'white' },
          },
        };
      });

      setPlantWateringDates((prev) => ({
        ...prev,
        [plantId]: {
          ...prev[plantId],
          ...updatedDates,
        },
      }));
    }
  } catch (error) {
    console.error('Error loading watered dates:', error);
  }
};

useEffect(() => {
  if (selectedPlant) {
    loadWateredDates();
  }
}, [selectedPlant]);
  
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
    const savePlantToGarden = async (plantName, imageUri, description, selectedDate) => {
      try {
        const plantId = plantName.replace(/\s+/g, '_').toLowerCase();
    
        const wateringInterval = await fetchWateringFrequency(plantName);
    
        const sunlightLevel = await fetchSunlightRequirement(plantName);
    
        const plantData = {
          name: plantName,
          image: imageUri,
          description: description,
          dateAdded: selectedDate.toISOString(),
          wateringInterval, 
          sunlight: sunlightLevel, 
        };
    
        await setDoc(doc(db, 'users', auth.currentUser?.uid, 'garden', plantId), plantData);
    
        alert(t('plant_saved_successfully'));
      } catch (error) {
        console.error('Error saving plant to the garden:', error);
        alert(t('error_saving_plant'));
      }
    };
    

    const fetchSunlightRequirement = async (plantName) => {
      const url = 'https://api.openai.com/v1/chat/completions';
      const apiKey = '*****************************************';
    
      const data = {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable plant expert.',
          },
          {
            role: 'user',
            content: `What level of sunlight does a ${plantName} need? Respond only with "low", "medium", or "high".`,
          },
        ],
        max_tokens: 10,
      };
    
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(data),
        });
    
        const result = await response.json();
    
        if (response.ok) {
          return result.choices[0].message.content.toLowerCase();
        } else {
          console.error('Error fetching sunlight requirement:', result);
          return 'medium'; 
        }
      } catch (error) {
        console.error('Request failed:', error);
        return 'medium'; 
      }
    };

    const calculateDaysPlanted = (dateAdded) => {
      const currentDate = new Date();
      const plantedDate = new Date(dateAdded);
      const timeDifference = currentDate - plantedDate;
      const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
      return daysDifference;
    };
  
  const pickImageFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission to access the gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri); 
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const generatePlantDescription = async (plantName) => {
    const targetLanguage = i18n.language || 'en';
    const url = 'https://api.openai.com/v1/chat/completions';
    const apiKey = '**************************************'; // Замени със своя OpenAI API ключ
  
    const data = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that generates plant descriptions in English.`,
        },
        {
          role: 'user',
          content: `Generate a detailed description for the plant "${plantName}" with 30 words.`,
        },
      ],
      max_tokens: 200, 
    };
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(data),
      });
  
      const result = await response.json();
  
      if (response.ok) {
        const description = result.choices[0].message.content;
  
        const translatedDescription = await translateDescription(description, targetLanguage);
        return translatedDescription; 
      } else {
        console.error('Error generating plant description:', result);
        return t('no_description_available'); 
      }
    } catch (error) {
      console.error('Request failed:', error);
      return t('no_description_available'); 
    }
  };

  const fetchPlants = () => {
    const plantsCollection = collection(db, 'users', auth.currentUser?.uid, 'garden');
  
    const unsubscribe = onSnapshot(plantsCollection, async (snapshot) => {
      const plantsData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const plant = { id: doc.id, ...doc.data() };
  
          if (i18n.language !== 'en') {
            const translatedDescription = await translateDescription(plant.description, i18n.language);
            return { ...plant, description: translatedDescription };
          }
          return plant;
        })
      );
  
      setMyPlants(plantsData);
      setFilteredPlants(plantsData);
    });
  
    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribe = fetchPlants();
    return () => unsubscribe();
  }, []);

  const openFullScreenModal = async () => {
    if (selectedPlantInModal) {
      const translatedPlant = await translatePlantDataForUI(selectedPlantInModal);
  
      setSelectedPlantInModal(translatedPlant);
  
      const description = await generatePlantDescription(translatedPlant.name);
      setPlantDescription(description);
  
      setFullScreenModalVisible(true);
    } else {
      Alert.alert(t('please_select_a_plant_first')); 
    }
  };

  const closeFullScreenModal = () => {
    setFullScreenModalVisible(false);
  };

  const closeSearchModal = () => {
    setSearchModalVisible(false); 
  };

  const toggleHelpModal = () => {
    setHelpModalVisible(!isHelpModalVisible);
  };

  const checkIfInGarden = async (plantId) => {
    const plantRef = doc(db, 'users', auth.currentUser?.uid, 'garden', plantId);
    const plantDoc = await getDoc(plantRef);
    setIsInGarden(plantDoc.exists());
  };

  const defaultImageUri = require('@/assets/images/45777.png');

const addPlantCard = { id: 'add-plant-card', type: 'add' };

const combinedPlants = [addPlantCard, ...filteredPlants];

const renderPlantCard = ({ item }) => {
  if (item.type === 'add') {
    return (
      <TouchableOpacity style={styles.addPlantCard} onPress={() => setSearchModalVisible(true)}>
        <MaterialCommunityIcons name="plus-circle-outline" size={60} color="#6C757D" />
        <Text style={styles.addPlantText}>{t('add_plant')}</Text>
      </TouchableOpacity>
    );
  } else {
    const daysPlanted = calculateDaysPlanted(item.dateAdded);
    const sunlightIcons = Array(
      item.sunlight === 'low' ? 1 : item.sunlight === 'medium' ? 2 : 3
    ).fill(<Icon name="sunny" size={20} color="#FFC107" style={styles.sunIcon} />);
    const wateringStatusColor = plantWateringStatus[item.id] || 'blue'; 

    return (
      <TouchableOpacity onPress={() => openPlantModal(item)} style={styles.card}>
        <Image
          source={item.image && item.image.startsWith("file") ? { uri: item.image } : defaultImageUri}
          style={styles.plantImage}
        />
        <Text style={styles.plantName}>{item.name}</Text> 
        <Text style={styles.plantDateText}>
      {t('planted')}
      {'\n'} 
      {daysPlanted}  {t('days_ago')}
    </Text>
    <View style={[styles.iconRowWithWater]}>
    <View style={styles.waterDropContainer}>
    <Icon name="water" size={24} color={wateringStatusColor} />
  </View>
  <View style={[styles.iconRow, sunlightIcons.length === 2 && styles.twoIconsRow]}>
    {sunlightIcons}
  </View>

  
</View>
      </TouchableOpacity>
    );
  }
};


  const openPlantModal = async (plant) => {
    setSelectedPlant(plant);
    await checkIfInGarden(plant.id);
    setModalVisible(true);
  };

  const removeFromGarden = async (plantId) => {
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser?.uid, 'garden', plantId));
      Alert.alert('Removed', 'The plant has been removed from your garden.');
      setModalVisible(false);
      fetchPlants();
    } catch (error) {
      Alert.alert('Error', 'There was a problem removing the plant.');
    }
  };

  const handleSearchMain = (text) => {
    setSearchQueryMain(text);
    if (text === '') {
      setFilteredPlants(myPlants);
    } else {
      const filtered = myPlants.filter((plant) =>
        plant.plantName.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredPlants(filtered);
    }
  };

  const handleGardenAction = async () => {
    if (isInGarden) {
      await removeFromGarden(selectedPlant.id);
    } else {
      await addToGarden(selectedPlant);
      fetchPlants();
    }
  };

  const getPlantDataByQID = async (qid) => {
    const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
    try {
      const response = await axios.get(entityUrl);
      const entityData = response.data.entities[qid];
      const plantName = entityData.labels?.en?.value;

      const rank = entityData.claims?.P105?.[0]?.mainsnak?.datavalue?.value?.id;
      const validRanks = ['Q7432', 'Q34740', 'Q35409'];

      if (plantName && validRanks.includes(rank)) {
        return plantName;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  const searchPlants = async (query) => {
    if (query.length < 3) {
      setPlantSuggestions([]);
      return;
    }

    const apiUrl = `https://www.wikidata.org/w/api.php?action=query&list=search&srsearch=${query}%20plant&format=json&origin=*`;

    try {
      const response = await axios.get(apiUrl);
      const searchResults = response.data.query.search;

      const plantData = await Promise.all(
        searchResults.map(async (result) => {
          const name = await getPlantDataByQID(result.title);
          if (name) {
            return { id: result.pageid, name };
          }
          return null;
        })
      );

      const filteredPlantData = plantData.filter((plant) => plant !== null);
      const finalPlantData = filteredPlantData.filter((plant) =>
        plant.name.toLowerCase().includes(query.toLowerCase())
      );

      setPlantSuggestions(finalPlantData);
    } catch (error) {
      console.error('Error searching plants:', error);
    }
  };

  const renderPlantSuggestion = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.suggestionItem,
        selectedPlantInModal?.id === item.id && styles.selectedPlant,
      ]}
      onPress={() => handlePlantSelection(item)} 
    >
      <Text style={styles.suggestionText}>{item.name}</Text>
    </TouchableOpacity>
  );


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={require('@/assets/images/PlantPortal-logo.png')} style={styles.logo} />
        </View>
        <Icon name="notifications-outline" size={24} color="#4A4A4A" />
      </View>
      <Text style={styles.title}>{t('garden')}</Text>
      <View style={styles.searchContainer}>
  <View style={styles.inputWithIconContainer}>
    <TextInput
      style={styles.searchInput}
      placeholder="Търсене" 
      placeholderTextColor="#B0B0B0"
      value={searchQueryMain}
      onChangeText={handleSearchMain}
    />
    <Icon name="search" size={20} color="#B0B0B0" style={styles.searchIcon} />
  </View>

  <TouchableOpacity onPress={toggleHelpModal} style={styles.questionButton}>
  <Icon name="help-outline" size={30} color="#black" />
  </TouchableOpacity>

  <Modal
        visible={isHelpModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={toggleHelpModal}
      >
        <View style={styles.modalBackgroundOverlay}>
          <View style={styles.helpModalContainer}>
            <Text style={styles.helpModalTitle}>{t('calendar2')}</Text>
            <Text style={styles.helpModalText}>
              🌞 {t('suns')}
            </Text>
            <Text style={styles.helpModalText}>
              💧 {t('drop')}
            </Text>
            <Text style={styles.helpModalText}>
              📅 {t('calendar')}
            </Text>
            <TouchableOpacity onPress={toggleHelpModal} style={styles.helpModalCloseButton}>
              <Text style={styles.helpModalCloseButtonText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
</View>

      <FlatList
        data={combinedPlants}
        keyExtractor={(item) => item.id}
        renderItem={renderPlantCard}
        key={2}
        numColumns={2}
        contentContainerStyle={styles.plantList}
      />
      {selectedPlant && (
        <Modal
          animationType="none"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View
            style={[
              styles.modalContainer,
              !initialModalOpened && styles.transparentModalContainer,
            ]}
          >
            {renderModalContent()}
          </View>
        </Modal>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={searchModalVisible}
        onRequestClose={closeSearchModal}
      >
        <View style={styles.newModalContainer}>
          <View style={styles.newModalContent}>
            <TextInput
              style={styles.newSearchInput}
              placeholder={t('search_plants_by_name')} 
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                searchPlants(text);
              }}
            />
            <FlatList
              data={plantSuggestions}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderPlantSuggestion}
              style={styles.newFlatList}
            />
            <View style={styles.newModalButtons}>
            <TouchableOpacity 
                style={[styles.closeButton, styles.newBackground]} 
                onPress={closeSearchModal}

              >
                <Text style={styles.newModalButtonText}>{t('close')}</Text> 
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.newModalButton}
                onPress={() => {
                  if (selectedPlantInModal) {
                    closeSearchModal();
                    openFullScreenModal();
                  } else {
                    Alert.alert(t('please_select_a_plant_first')); 
                  }
                }}
              >
                <Text style={styles.newModalButtonText}>{t('add')}</Text> 
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
  animationType="slide"
  transparent={false}
  visible={fullScreenModalVisible}
  onRequestClose={closeFullScreenModal}
>
  <View style={styles.fullScreenModalContainer}>
    <View style={styles.fullScreenModalContent}>
      <Text style={styles.fullScreenModalTitle}>{t('selected_plant')}</Text> 
      <Text style={styles.selectedPlantName}>{selectedPlantInModal?.name}</Text> 

      {selectedImage && (
        <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
      )}

      <Text style={styles.plantDescription}>
        {plantDescription || t('loading_description')} 
      </Text>

      <TouchableOpacity style={styles.button} onPress={pickImageFromGallery}>
        <Text style={styles.buttonText}>{t('pick_image_from_gallery')}</Text> 
      </TouchableOpacity>

      <DateTimePicker
        style={styles.dateButton}
        value={selectedDate}
        mode="date"
        display="default"
        onChange={onDateChange}
        maximumDate={new Date()}
      />

      <Text style={styles.plantDateText}>
        {t('selected_date')}: {selectedDate.toDateString()} 
      </Text>

      <TouchableOpacity
        style={styles.fullScreenModalButton}
        onPress={() =>
          savePlantToGarden(
            selectedPlantInModal?.name,
            selectedImage,
            plantDescription,
            selectedDate
          )
        }
      >
        <Text style={styles.fullScreenModalButtonText}>{t('save_to_garden')}</Text>
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

      <Modal
  animationType="slide"
  transparent={true}
  visible={wateringModalVisible}
  onRequestClose={closeWateringModal}
>
  <View style={styles.wateringModalContainer}>
    <View style={styles.wateringModalContent}>
      <Text style={styles.wateringModalTitle}>{t('select_watering_date')}</Text> 
      <Calendar
        current={today}
        markedDates={getCurrentWateringDates()}
        onDayPress={handleDayPress}
        markingType="custom"
        theme={{
          todayTextColor: 'green',
          arrowColor: '#BACBA9',
          textDayFontWeight: 'bold',
          textDayFontSize: 16,
          textDayHeaderFontWeight: 'bold',
          textDayHeaderFontSize: 14,
        }}
      />

      <TouchableOpacity style={styles.wateringModalButton} onPress={handleWatering}>
        <Text style={styles.wateringModalButtonText}>
          {getCurrentWateringDates()[calendarSelectedDate]?.customStyles?.container?.backgroundColor === 'blue'
            ? t('remove_water') 
            : t('water')}       
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.wateringModalCloseButton}
        onPress={closeWateringModal}
      >
        <Text style={styles.wateringModalCloseButtonText}>{t('close')}</Text> 
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/HomeScreen')} style={styles.iconContainer}>
          <Icon name="home-outline" size={24} color="#4A4A4A" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/MyGarden')} style={styles.iconContainer}>
          <Icon name="leaf-outline" size={24} color="#4A4A4A" />
          {isFocused && <View style={styles.activeIndicator} />}
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
    height: 250,
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
    textAlign: 'left',
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'column',
    justifyContent: 'center',
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
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
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  selectedPlant: {
    backgroundColor: '#BACBA9', 
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
  newModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',  
  },
  newModalContent: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newSearchInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    width: '100%',
    backgroundColor: '#f5f5f5',  
  },
  newFlatList: {
    width: '100%',
    maxHeight: 250,  
  },
  newModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  newModalButton: {
    backgroundColor: '#BACBA9',
    padding: 12,
    borderRadius: 8,
    width: '40%',
    alignItems: 'center',
  },
  newModalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  fullScreenModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  fullScreenModalContent: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 20,
  },
  selectedPlantName: {
    fontSize: 20,
    color: '#333',
    marginBottom: 20,
  },
  plantDescription: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  fullScreenModalButton: {
    backgroundColor: '#BACBA9',
    padding: 12,
    borderRadius: 8,
    width: '60%',
    alignItems: 'center',
    marginTop: 20,
  },
  fullScreenModalCloseButton: {
    backgroundColor: '#FFA8A8',
    padding: 12,
    borderRadius: 8,
    width: '60%',
    alignItems: 'center',
    marginTop: 20,
  },
  fullScreenModalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  plantImageFullScreenModal: {
    width: 300,
    height: 300,
    marginTop: 20,
    borderRadius: 10,
  },
  plantDateText: {
    marginTop: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    width: 300,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center', 
    fontSize: 16,
  },
  imagePreview: {
    width: 120,
    height: 120,
    marginTop: 20,
    borderRadius: 200,
  },
  dateButton: {
    borderRadius:20,
    marginTop: 10,
    marginBottom: 20,        
  },
  dateButtonText: {
    color: '#fff',              
    fontSize: 16,              
    textAlign: 'center',        
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 10,
  },
  askOthersButton: {
    backgroundColor: '#6C757D', 
    padding: 10,
    borderRadius: 8,
    margin: 10,
    alignItems: 'center',
  },
  askOthersButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchButton: {
    backgroundColor: '#6C757D',
    padding: 10,
    borderRadius: 8,
    margin: 10,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  iconButton: {
    backgroundColor: '#6C757D',
    padding: 12,
    borderRadius: 30, 
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    flexDirection: 'column',
  },
  iconButtonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  addPlantCard: {
    backgroundColor: '#fff',
    margin: 5,
    borderRadius: 10,
    padding: 20, 
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', 
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    height: 250, 
    width: 180,  
  },
  addPlantText: {
    fontSize: 18, 
    color: '#6C757D',
    marginTop: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  wateringModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
  },
  wateringModalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  wateringModalButton: {
    backgroundColor: '#BACBA9',
    paddingVertical: 12,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginBottom: 10,
  },
  wateringModalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  wateringModalCloseButton: {
    backgroundColor: '#FFA8A8', 
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    margin: 10,
    width: '80%',
    textAlign: 'center',
    alignItems: 'center',
  },
  wateringModalCloseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  twoIconsRow: {
    justifyContent: 'space-around', 
    width: 50, 
  },
  sunIcon: {
    marginHorizontal: 2,
  },
  
  transparentModalContainer: {
    backgroundColor: 'transparent', 
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  iconRowWithWater: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
  },
  
  waterDropContainer: {
    marginRight: 10,
    marginTop: 15, 
  },
  closeButton: {
    backgroundColor: '#2196F3', 
    padding: 12,
    borderRadius: 8,
    width: '40%',
    alignItems: 'center',
  },
  newBackground: {
    backgroundColor: '#FFA8A8', 
  },
  inputWithIconContainer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    height: '100%',
  },
  searchIcon: {
    marginLeft: 10,
  },
  questionButton: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  modalBackgroundOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  helpModalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  helpModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  helpModalText: {
    fontSize: 16,
    marginVertical: 5,
    textAlign: 'center',
    color: '#555',
  },
  helpModalBoldText: {
    fontWeight: 'bold',
    color: '#000',
  },
  helpModalCloseButton: {
    marginTop: 20,
    backgroundColor: '#FFA8A8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '60%',
    borderRadius: 5,
  },
  helpModalCloseButtonText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#fff',
  },
  
});

export default MyGardenScreen;

