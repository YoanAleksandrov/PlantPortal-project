import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export const getPlantDescriptionFromFirestore = async (plantName) => {
  try {
    const plantRef = doc(db, 'globalPlantDescriptions', plantName);
    const plantSnap = await getDoc(plantRef);

    if (plantSnap.exists()) {
      return plantSnap.data();
    } else {
      return null; 
    }
  } catch (error) {
    console.error('Error fetching plant description from Firestore:', error);
    return null;
  }
};

export const savePlantDescriptionToFirestore = async (plantName, plantData) => {
  try {
    const plantRef = doc(db, 'globalPlantDescriptions', plantName);
    await setDoc(plantRef, plantData);
    console.log('Plant description saved to Firestore');
  } catch (error) {
    console.error('Error saving plant description to Firestore:', error);
  }
};
export default savePlantDescriptionToFirestore;