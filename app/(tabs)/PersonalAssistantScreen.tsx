import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons'; 
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

const API_KEY = '**********************************';

const PersonalAssistantScreen = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const router = useRouter();
  const { t } = useTranslation();

  const askChatGPT = async (message) => {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: t('chatbot_system_message'),
            },
            { role: 'user', content: message },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error with ChatGPT API:', error);
      return t('chatbot_api_error');
    }
  };

  const sendMessage = async () => {
    if (input.trim() === '') return;

    const newMessage = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    const botResponse = await askChatGPT(input);
    const botMessage = { id: (Date.now() + 1).toString(), text: botResponse, sender: 'bot' };
    setMessages((prevMessages) => [...prevMessages, botMessage]);

    setInput('');
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.messageContainer, item.sender === 'user' ? styles.userMessage : styles.botMessage]}>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={5}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/HomeScreen')} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('gardening_assistant_title')}</Text>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.chatArea}
      />

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder={t('ask_placeholder')}
           placeholderTextColor="#4F4F4F"
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Icon name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#BACBA9',
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    marginRight: 10,
    padding: 5,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  chatArea: {
    flex: 1,
    marginBottom: 10,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  input: {
    flex: 1,
    borderRadius: 25,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#BACBA9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginLeft: 10,
  },
  messageContainer: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 15,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
  },
  botMessage: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
  },
  messageText: {
    fontSize: 16,
  },
});

export default PersonalAssistantScreen;
