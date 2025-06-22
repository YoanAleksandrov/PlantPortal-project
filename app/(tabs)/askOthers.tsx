import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Alert, Modal, KeyboardAvoidingView, Platform, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { db } from './firebaseConfig';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next'; // За превод

const AskOthersMain = () => {
  const { t } = useTranslation(); // Хук за превод
  const [searchQuery, setSearchQuery] = useState('');
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(t('all'));
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUsername, setCurrentUsername] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingAnswer, setEditingAnswer] = useState(null);
  const router = useRouter();

  const categoryMapping = {
    all: t('all'),
    gardening: t('gardening'),
    education: t('education'),
    personalAdvice: t('personalAdvice'),
  };

  const toggleLike = async (question) => {
    try {
      const questionRef = doc(db, 'questions', question.id);
      const userLiked = question.likes?.includes(currentUser);

      if (userLiked) {
        await updateDoc(questionRef, {
          likes: arrayRemove(currentUser),
        });
      } else {
        await updateDoc(questionRef, {
          likes: arrayUnion(currentUser),
        });
      }

      const updatedQuestionDoc = await getDoc(questionRef);
      const updatedQuestions = questions.map((q) =>
        q.id === question.id ? { ...updatedQuestionDoc.data(), id: question.id } : q
      );
      setQuestions(updatedQuestions);
      setFilteredQuestions(updatedQuestions);
    } catch (error) {
      Alert.alert(t('error'), t('likeFailed'));
    }
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const questionsCollection = collection(db, 'questions');
        const questionSnapshot = await getDocs(questionsCollection);
        const questionsList = questionSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          likes: doc.data().likes || [],
        }));
        setQuestions(questionsList);
        setFilteredQuestions(questionsList);
      } catch (error) {
        Alert.alert(t('error'), t('fetchQuestionsFailed'));
      }
    };

    const fetchCurrentUser = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        setCurrentUser(user.uid);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUsername(userDoc.data().username);
        } else {
          setCurrentUsername(t('anonymous'));
        }
      }
    };

    fetchQuestions();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    filterQuestions();
  }, [selectedCategory, searchQuery]);

  const filterQuestions = () => {
    const filtered = questions.filter((question) => {
      // Намерете ключа от мапинга (например, "gardening" за "Градинарство")
      const categoryKey = Object.keys(categoryMapping).find(
        (key) => categoryMapping[key] === selectedCategory
      );
  
      // Конвертирайте категорията от базата към малки букви за сравнение
      const questionCategoryLowerCase = question.category.toLowerCase();
  
      const matchesCategory =
        selectedCategory === t('all') || questionCategoryLowerCase === categoryKey.toLowerCase();
  
      const matchesSearch = question.title.toLowerCase().includes(searchQuery.toLowerCase());
  
      return matchesCategory && matchesSearch;
    });
  
    setFilteredQuestions(filtered);
  };

  const openQuestionModal = async (id) => {
    try {
      const questionDoc = await getDoc(doc(db, 'questions', id));
      if (questionDoc.exists()) {
        setSelectedQuestion({ ...questionDoc.data(), id });
      } else {
        Alert.alert(t('error'), t('questionNotFound'));
      }
    } catch (error) {
      Alert.alert(t('error'), t('fetchQuestionDetailsFailed'));
    }
  };

  const closeModal = () => {
    setSelectedQuestion(null);
    setAnswer('');
    setReplyingTo(null);
    setEditingAnswer(null);
  };

  const handleDeleteAnswer = async (itemToDelete) => {
    try {
      const questionRef = doc(db, 'questions', selectedQuestion.id);
  
      // Филтриране на отговорите за изтриване
      const updatedAnswers = selectedQuestion.answers.filter(
        (item) => item.createdAt !== itemToDelete.createdAt
      );
  
      // Запазване във Firebase
      await updateDoc(questionRef, { answers: updatedAnswers });
  
      // Обновяване на локалното състояние
      const updatedQuestionDoc = await getDoc(questionRef);
      setSelectedQuestion({ ...updatedQuestionDoc.data(), id: selectedQuestion.id });
  
      Alert.alert(t('success'), t('answerDeleted'));
    } catch (error) {
      console.error('Error deleting answer:', error);
      Alert.alert(t('error'), t('deleteAnswerFailed'));
    }
  };

  const handleEditAnswer = async (itemToEdit) => {
    if (!answer.trim()) {
      Alert.alert(t('error'), t('pleaseEnterText'));
      return;
    }
  
    try {
      const questionRef = doc(db, 'questions', selectedQuestion.id);
  
      // Актуализиране на отговора
      const updatedAnswers = selectedQuestion.answers.map((item) =>
        item.createdAt === itemToEdit.createdAt
          ? { ...item, text: answer }
          : item
      );
  
      // Запазване във Firebase
      await updateDoc(questionRef, { answers: updatedAnswers });
  
      // Обновяване на локалното състояние
      const updatedQuestionDoc = await getDoc(questionRef);
      setSelectedQuestion({ ...updatedQuestionDoc.data(), id: selectedQuestion.id });
  
      setAnswer('');
      setEditingAnswer(null);
  
      Alert.alert(t('success'), t('answerUpdated'));
    } catch (error) {
      console.error('Error editing answer:', error);
      Alert.alert(t('error'), t('editAnswerFailed'));
    }
  };

  
  const handleAddAnswerOrReply = async () => {
    if (!answer.trim()) {
      Alert.alert(t('error'), t('pleaseEnterText'));
      return;
    }
  
    try {
      const questionRef = doc(db, 'questions', selectedQuestion.id);
  
      let updatedAnswers = [...(selectedQuestion.answers || [])];
  
      if (replyingTo) {
        // Добавяне на реплика
        updatedAnswers = updatedAnswers.map((item) => {
          if (item.createdAt === replyingTo.createdAt) {
            return {
              ...item,
              replies: [
                ...(item.replies || []),
                {
                  text: answer,
                  createdAt: Timestamp.fromDate(new Date()),
                  username: currentUsername,
                  userId: currentUser,
                },
              ],
            };
          }
          return item;
        });
      } else if (editingAnswer) {
        // Редактиране на отговор
        updatedAnswers = updatedAnswers.map((item) =>
          item.createdAt === editingAnswer.createdAt
            ? { ...item, text: answer }
            : item
        );
      } else {
        // Добавяне на нов отговор
        const newAnswer = {
          text: answer,
          createdAt: Timestamp.fromDate(new Date()),
          username: currentUsername,
          userId: currentUser,
          replies: [],
        };
        updatedAnswers.push(newAnswer);
      }
  
      // Запазване във Firebase
      await updateDoc(questionRef, { answers: updatedAnswers });
  
      // Обновяване на локалното състояние
      const updatedQuestionDoc = await getDoc(questionRef);
      setSelectedQuestion({ ...updatedQuestionDoc.data(), id: selectedQuestion.id });
      setAnswer('');
      setReplyingTo(null);
      setEditingAnswer(null);
    } catch (error) {
      console.error('Error updating question:', error);
      Alert.alert(t('error'), t('submitFailed'));
    }
  };
  
  const startEditingAnswer = (answer) => {
    setEditingAnswer(answer);
    setAnswer(answer.text); // Показва текущия текст в инпута
  };

  const handleSaveChanges = async () => {
    if (!answer.trim()) {
      Alert.alert(t('error'), t('pleaseEnterText'));
      return;
    }
  
    try {
      const questionRef = doc(db, 'questions', selectedQuestion.id);
  
      // Актуализация на редактирания отговор
      const updatedAnswers = selectedQuestion.answers.map((item) =>
        item.createdAt === editingAnswer.createdAt
          ? { ...item, text: answer }
          : item
      );
  
      await updateDoc(questionRef, { answers: updatedAnswers });
  
      // Обновяване на локалното състояние
      const updatedQuestionDoc = await getDoc(questionRef);
      setSelectedQuestion({ ...updatedQuestionDoc.data(), id: selectedQuestion.id });
  
      // Изчистване на състоянията
      setEditingAnswer(null);
      setAnswer('');
      Alert.alert(t('success'), t('changesSaved'));
    } catch (error) {
      console.error('Error saving changes:', error);
      Alert.alert(t('error'), t('saveChangesFailed'));
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image style={styles.logo} source={require('../../assets/images/PlantPortal-logo.png')} />
        </View>
        <Icon name="notifications-outline" size={24} color="#4A4A4A" />
      </View>

      <Text style={styles.titleBig}>{t('forum')}</Text>
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchQuestions')}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Icon name="search-outline" size={24} color="#4A4A4A" />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.categories}>
  {Object.values(categoryMapping).map((category) => (
    <TouchableOpacity
      key={category}
      onPress={() => setSelectedCategory(category)}
      style={[
        styles.categoryButton,
        selectedCategory === category && styles.categoryButtonSelected,
      ]}
    >
      <Text style={styles.categoryText}>{category}</Text>
    </TouchableOpacity>
  ))}
</View>

      <FlatList
  data={filteredQuestions}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <View style={styles.questionRow}>
      <TouchableOpacity
        onPress={() => openQuestionModal(item.id)}
        style={styles.questionTextContainer}
      >
        <View>
          <Text style={styles.questionTitle}>{item.title}</Text>
          <Text style={styles.questionDetails}>
            {item.username} • {t(item.category.toLowerCase())}
          </Text>
          <Text style={styles.questionMeta}>
            {item.answers?.length || 0} {t('answers')} • {item.likes?.length || 0} {t('likes')}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Like Button */}
      <TouchableOpacity
        onPress={() => toggleLike(item)}
        style={styles.likeButton}
      >
        <Icon
          name={Array.isArray(item.likes) && item.likes.includes(currentUser) ? 'heart' : 'heart-outline'}
          size={24}
          color={Array.isArray(item.likes) && item.likes.includes(currentUser) ? '#BACBA9' : 'gray'}
        />
      </TouchableOpacity>
    </View>
  )}
/>

{/* Question Modal */}
{selectedQuestion && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedQuestion}
          onRequestClose={closeModal}
        >
          <KeyboardAvoidingView
            style={styles.modalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Icon name="close-outline" size={30} color="#333" />
              </TouchableOpacity>
              <FlatList
  data={selectedQuestion.answers || []}
  keyExtractor={(item, index) => index.toString()}
  ListHeaderComponent={
    <View style={styles.questionCard}>
      <Text style={styles.title}>{selectedQuestion.title}</Text>
      <Text style={styles.category}>{selectedQuestion.category}</Text>
      <Text style={styles.description}>{selectedQuestion.description}</Text>
      <Text style={styles.author}>
        By: {selectedQuestion.userId === null ? "Anonymous" : selectedQuestion.username}
      </Text>
    </View>
  }
  renderItem={({ item }) => (
    <View style={styles.answerCard}>
      <Text style={styles.answerText}>{item.text}</Text>
      <Text style={styles.answerAuthor}>By: {item.username}</Text>
      <View style={styles.answerActions}>
        {/* Edit Option */}
        {item.userId === currentUser && (
          <TouchableOpacity onPress={() => startEditingAnswer(item)}>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        )}

        {/* Delete Option */}
        {item.userId === currentUser && (
          <TouchableOpacity onPress={() => handleDeleteAnswer(item)}>
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        )}

        {/* Reply Option */}
        <TouchableOpacity onPress={() => setReplyingTo(item)}>
          <Text style={styles.actionText}>Reply</Text>
        </TouchableOpacity>
      </View>

      {/* Render replies if available */}
      {item.replies && item.replies.length > 0 && (
        <FlatList
          data={item.replies}
          keyExtractor={(reply, index) => index.toString()}
          renderItem={({ item: reply }) => (
            <View style={styles.replyCard}>
              <Text style={styles.replyText}>{reply.text}</Text>
              <Text style={styles.replyAuthor}>By: {reply.username}</Text>
            </View>
          )}
        />
      )}
    </View>
  )}
/>
<View style={styles.inputContainer}>
  <TextInput
    style={styles.input}
    placeholder={replyingTo ? t('writeYourReply') : t('writeYourAnswer')}
    value={answer}
    onChangeText={setAnswer}
  />
  
  {/* Бутон за изпращане */}
  <TouchableOpacity
    style={styles.addButton}
    onPress={handleAddAnswerOrReply}
  >
    <Text style={styles.addButtonText}>
      {replyingTo ? t('submitReply') : t('submitAnswer')}
    </Text>
  </TouchableOpacity>

  {/* Иконата X, ако се реплаяива */}
  {replyingTo && (
    <TouchableOpacity
      style={styles.cancelReplyButton}
      onPress={() => {
        setReplyingTo(null);
        setAnswer('');
      }}
    >
      <Text style={styles.cancelReplyText}>X</Text>
    </TouchableOpacity>
  )}
</View>

            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}


<TouchableOpacity
        style={styles.addButtonQuestion}
        onPress={() => router.push('/(tabs)/AddQuestion')}>
        <Icon name="add-outline" size={24} color="#fff" />
      </TouchableOpacity>

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
        </TouchableOpacity>
      </View>
      
     

    </View>



  );
};

//       {/* Add Question Button */}
//       <TouchableOpacity style={styles.addButton} onPress={() => Alert.alert('Add Question')}>
//         <Icon name="add-outline" size={24} color="#fff" />
//       </TouchableOpacity>

//       {/* Footer Navigation */}
//       <View style={styles.footer}>
//         <TouchableOpacity style={styles.iconContainer}>
//           <Icon name="home-outline" size={24} color="#4A4A4A" />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.iconContainer}>
//           <Icon name="leaf-outline" size={24} color="#4A4A4A" />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.iconContainer}>
//           <Icon name="camera-outline" size={24} color="#4A4A4A" />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.iconContainer}>
//           <Icon name="albums-outline" size={24} color="#4A4A4A" />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.iconContainer}>
//           <Icon name="person-outline" size={24} color="#4A4A4A" />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// Styles
const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  backText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 5,
  },
  questionCard: {
    backgroundColor: '#F5F5DC',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    marginHorizontal: 10,
  },
  titleBig: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginTop:20,
    marginBottom: 0,
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  category: {
    fontSize: 14,
    color: '#777',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  author: {
    fontSize: 14,
    color: '#777',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  answerCard: {
    backgroundColor: '#EFEFEF',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
    marginHorizontal: 10,
  },
  answerText: {
    fontSize: 14,
    color: '#333',
  },
  answerAuthor: {
    fontSize: 12,
    color: '#777',
    fontStyle: 'italic',
    marginTop: 5,
  },
  answerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 5,
    gap: 10,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    paddingHorizontal: 5,
  },
  deleteText: {
    color: 'red',
  },
  replyCard: {
    backgroundColor: '#F1F1F1',
    padding: 8,
    borderRadius: 8,
    marginLeft: 15,
    marginBottom: 5,
  },
  replyText: {
    fontSize: 13,
    color: '#333',
  },
  replyAuthor: {
    fontSize: 12,
    color: '#777',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 25,
    paddingHorizontal: 15,
    backgroundColor: '#ffffff',
    borderColor: '#ddd',
    borderWidth: 1,
    fontSize: 16,
    color: 'black',
  },
  addButton: {
    marginLeft: 10,
    backgroundColor: '#6B8E23',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelReplyButton: {
    marginLeft: 10,
    paddingHorizontal: 8,
  },
  cancelReplyText: {
    fontSize: 20,
    color: 'red',
  },
  // answerActions: {
  //   flexDirection: 'row',
  //   justifyContent: 'flex-start',
  //   alignItems: 'center',
  //   marginTop: 5,
  //   gap: 10, // Разстояние между бутоните
  // },
  // actionText: {
  //   fontSize: 14,
  //   color: '#333',
  //   paddingHorizontal: 5,
  // },
  // deleteText: {
  //   color: 'red',
  // },
  // replyCard: {
  //   backgroundColor: '#F1F1F1',
  //   padding: 8,
  //   borderRadius: 8,
  //   marginLeft: 15,
  //   marginBottom: 5,
  // },
  // replyText: {
  //   fontSize: 13,
  //   color: '#333',
  // },
  // replyAuthor: {
  //   fontSize: 12,
  //   color: '#777',
  //   fontStyle: 'italic',
  // },
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
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginTop: 20,
  },
  searchInput: {
    flex: 1,
    marginRight: 10,
  },
  categories: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  categoryButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F5F5DC',
  },
  categoryButtonSelected: {
    backgroundColor: '#BA9',
  },
  categoryText: {
    color: '#333',
  },
  // questionCard: {
  //   padding: 15,
  //   borderRadius: 10,
  //   backgroundColor: '#F5F5DC',
  //   marginHorizontal: 20,
  //   marginBottom: 10,
  // },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 0,
    paddingTop: 50,
    width: '100%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  addButtonQuestion: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: '#4A4A4A',
    padding: 15,
    borderRadius: 50,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#F5F5DC',
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  iconContainer: {
    alignItems: 'center',
  },
  // title: {
  //   fontSize: 20,
  //   fontWeight: 'bold',
  //   color: '#333',
  // },
  // category: {
  //   fontSize: 14,
  //   color: '#777',
  //   fontStyle: 'italic',
  //   marginBottom: 10,
  // },
  // description: {
  //   fontSize: 16,
  //   color: '#333',
  //   marginBottom: 10,
  // },
  // author: {
  //   fontSize: 14,
  //   color: '#777',
  //   marginBottom: 10,
  // },
  // answerCard: {
  //   backgroundColor: '#EFEFEF',
  //   padding: 10,
  //   borderRadius: 8,
  //   marginVertical: 5,
  //   width: '100%',
  // },
  // answerText: {
  //   fontSize: 14,
  //   color: '#333',
  // },
  // answerAuthor: {
  //   fontSize: 12,
  //   color: '#777',
  //   fontStyle: 'italic',
  //   marginTop: 5,
  // },
  // inputContainer: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   paddingVertical: 20,
  //   paddingHorizontal: 10,
  //   backgroundColor: '#F5F5F5',
  //   borderTopWidth: 1,
  //   borderColor: '#ccc',
  // },
  // input: {
  //   flex: 1,
  //   height: 48,
  //   borderRadius: 25,
  //   paddingHorizontal: 15,
  //   backgroundColor: '#ffffff',
  //   borderColor: '#ddd',
  //   borderWidth: 1,
  //   fontSize: 16,
  //   color: 'black',
  // },
  // addButton: {
  //   marginLeft: 10,
  //   backgroundColor: '#6B8E23',
  //   paddingVertical: 15,
  //   paddingHorizontal: 20,
  //   borderRadius: 25,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
  // addButtonText: {
  //   color: '#fff',
  //   fontSize: 16,
  //   fontWeight: 'bold',
  // },
  // answerActions: {
  //   flexDirection: 'row',
  //   justifyContent: 'flex-start',
  //   alignItems: 'center',
  //   marginTop: 5,
  //   gap: 10, // Разстояние между бутоните
  // },
  // actionText: {
  //   fontSize: 14,
  //   color: '#333',
  //   paddingHorizontal: 5,
  // },
  // deleteText: {
  //   color: 'red',
  // },
  replyButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    padding: 5,
    backgroundColor: '#EFEFEF',
    borderRadius: 5,
  },
  questionRow: {
    flexDirection: 'row', // Подрежда елементите в един ред
    justifyContent: 'space-between', // Разделя текста и бутона за харесване
    alignItems: 'center', // Вертикално подравняване в центъра
    backgroundColor: '#F5F5DC',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    marginHorizontal: 10,
  },
  questionTextContainer: {
    flex: 1, // Заема наличното пространство
    marginRight: 10, // Оставя разстояние между текста и бутона
  },
  questionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  questionDetails: {
    color: '#555',
    fontSize: 14,
    marginTop: 5,
  },
  questionMeta: {
    color: '#777',
    marginTop: 5,
  },
  likeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
});

export default AskOthersMain;
