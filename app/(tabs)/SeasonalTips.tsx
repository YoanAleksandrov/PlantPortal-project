import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
  ImageBackground,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Share } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const SeasonalTips = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const isFocused = useIsFocused();
  const [season, setSeason] = useState('');
  const [tips, setTips] = useState([]);

  const seasonalBackgrounds = {
    Spring: require('@/assets/images/spring.webp'),
    Summer: require('@/assets/images/summer.webp'),
    Fall: require('@/assets/images/autumn.webp'),
    Winter: require('@/assets/images/winter.webp'),
  };

  const getSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  };

  const seasonalTips = {
    Spring: [
      t('startPlanting'),
      t('ensureConsistentWatering'),
      t('useCompost'),
    ],
    Summer: [
      t('waterDeeplyMorningEvening'),
      t('provideShade'),
      t('watchForPests'),
    ],
    Fall: [
      t('harvestBeforeFrost'),
      t('plantBulbs'),
      t('mulchToProtectRoots'),
    ],
    Winter: [
      t('movePottedPlantsIndoors'),
      t('reduceWatering'),
      t('planNextSeason'),
    ],
  };

  useEffect(() => {
    const currentSeason = getSeason();
    setSeason(currentSeason);
    setTips(seasonalTips[currentSeason]);
  }, [t]);

  const shareTips = async () => {
    const tipsText = `${t('seasonalTipsFor')} ${t(season)}:\n\n` + tips.join('\n');
    try {
      await Share.share({
        message: tipsText,
      });
    } catch (error) {
      Alert.alert(t('error'), t('shareFailed'));
      console.error('Sharing error:', error);
    }
  };

  const renderTip = ({ item }) => (
    <View style={styles.tipCard}>
      <Icon name="leaf-outline" size={24} color="#4A4A4A" style={styles.tipIcon} />
      <Text style={styles.tipText}>{item}</Text>
    </View>
  );

  return (
    <ImageBackground
      source={seasonalBackgrounds[season]}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('seasonalTips')}</Text>
          <Icon name="notifications-outline" size={24} color="#fff" />
        </View>

        <View style={styles.seasonContainer}>
          <Text style={styles.seasonTitle}>{t('currentSeason')}:</Text>
          <Text style={styles.seasonName}>{t(season)}</Text> 
        </View>

        <FlatList
  data={tips}
  keyExtractor={(item, index) => index.toString()}
  renderItem={renderTip}
  contentContainerStyle={styles.tipsContainer}
/>

        <TouchableOpacity style={styles.shareButton} onPress={shareTips}>
          <Icon name="share-social-outline" size={20} color="#fff" style={styles.shareIcon} />
          <Text style={styles.shareText}>{t('shareTips')}</Text>
        </TouchableOpacity>
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/HomeScreen')} style={styles.iconContainer}>
            <Icon name="home-outline" size={24} color="#4A4A4A" />
            {isFocused && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/MyGarden')} style={styles.iconContainer}>
            <Icon name="leaf-outline" size={24} color="#4A4A4A" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/SeasonalTips')} style={styles.iconContainer}>
            <Icon name="calendar-outline" size={24} color="#4A4A4A" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/Collection')} style={styles.iconContainer}>
            <Icon name="albums-outline" size={24} color="#4A4A4A" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/Profile')} style={styles.iconContainer}>
            <Icon name="person-outline" size={24} color="#4A4A4A" />
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  seasonContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  seasonTitle: {
    fontSize: 18,
    color: '#fff',
  },
  seasonName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  tipsContainer: {
    paddingHorizontal: 20,
  },
  tipsList: {
    width: '100%',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  tipIcon: {
    marginRight: 10,
  },
  tipText: {
    fontSize: 16,
    width: 320,
    color: '#4A4A4A',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#BACBA9',
    padding: 15,
    borderRadius: 30,
    marginHorizontal: 20,
    marginVertical: 30,
  },
  shareIcon: {
   color: '#fff',
  },
  shareText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#F5F5DC',
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
});

export default SeasonalTips;
