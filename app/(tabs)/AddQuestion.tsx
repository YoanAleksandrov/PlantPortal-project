import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { db } from './firebaseConfig';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

const AddQuestion = () => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Gardening');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [username, setUsername] = useState('Anonymous');
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
      const fetchUsername = async () => {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUsername(userDoc.data().username || t('anonymous'));
        } else {
          console.log('No user document found!');
        }
      };

      fetchUsername();
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setTitle('');
      setCategory('Gardening');
      setDescription('');
      setIsAnonymous(false);

      return () => {};
    }, [])
  );

  const handleAddQuestion = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }

    try {
      await addDoc(collection(db, 'questions'), {
        title,
        category,
        description,
        username: isAnonymous ? t('anonymous') : username,
        createdAt: Timestamp.fromDate(new Date()),
        answers: [],
        likes: 0,
      });
      Alert.alert(t('success'), t('questionAdded'));
      router.push('/askOthers');
    } catch (error) {
      Alert.alert(t('error'), `${t('errorAddingQuestion')}: ${error.message}`);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/askOthers')}
          >
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <Text style={styles.header}>{t('askAQuestion')}</Text>

          <Text style={styles.label}>{t('title')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('enterQuestionTitle')}
            placeholderTextColor="#777"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>{t('category')}</Text>
          <View style={styles.categoryContainer}>
            {['Gardening', 'Education', 'PersonalAdvice'].map((catKey) => (
              <TouchableOpacity
                key={catKey}
                onPress={() => setCategory(catKey)}
                style={[
                  styles.categoryButton,
                  category === catKey && styles.categoryButtonSelected,
                ]}
              >
                <Icon
                  name={
                    catKey === 'gardening'
                      ? 'leaf-outline'
                      : catKey === 'education'
                      ? 'book-outline'
                      : 'chatbubble-ellipses-outline'
                  }
                  size={18}
                  color={category === catKey ? '#fff' : '#555'}
                />
                <Text
                  style={[
                    styles.categoryText,
                    category === catKey && styles.categoryTextSelected,
                  ]}
                >
                  {t(catKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{t('description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t('describeYourQuestion')}
            placeholderTextColor="#777"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <View style={styles.anonymousContainer}>
            <Text style={styles.label}>{t('postAnonymously')}</Text>
            <Switch value={isAnonymous} onValueChange={setIsAnonymous} />
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleAddQuestion}>
            <Text style={styles.addButtonText}>{t('addQuestion')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  backButton: {
    marginBottom: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  categoryButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F1F1F1',
  },
  categoryButtonSelected: {
    backgroundColor: '#BA9',
  },
  categoryText: {
    fontSize: 12,
    color: '#555',
    marginTop: 5,
  },
  categoryTextSelected: {
    color: '#FFF',
  },
  anonymousContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#BA9',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddQuestion;
