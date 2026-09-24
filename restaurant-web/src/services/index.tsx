import { db } from '../configs/firebaseConfig'
import { getDocs, getDoc, doc, collection, query, where, orderBy } from 'firebase/firestore'

export const getCollection = async (collectionName: string) => {
  try {
    const collectionRef = collection(db, collectionName);
    const querySnapshot = await getDocs(collectionRef);

    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id, ...doc.data(),
    }));

    return documents;
  } catch (error) {
    console.error("Error fetching collection:", error);
    return [];
  }
};

export const getCollectionById = async (collectionName: string, docId: string) => {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() }
  } else {
    console.log("No such document!");
    return null;
  }
};

export const getCollectionByRestaurant = async (collectionName: string, paramId: string) => {
  const collectionRef = collection(db, collectionName)

  try {
    // Try with orderBy first
    const baseQuery = query(collectionRef, where('restaurantId', '==', paramId), orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(baseQuery)

    if (!querySnapshot.empty) {
      const docs = querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      return JSON.parse(JSON.stringify(docs));
    }
  } catch (error) {
    console.warn(`Query with orderBy failed for ${collectionName}, falling back to simple query:`, error);
    try {
      // Fallback to simple query
      const fallbackQuery = query(collectionRef, where('restaurantId', '==', paramId))
      const querySnapshot = await getDocs(fallbackQuery)
      if (!querySnapshot.empty) {
        const docs = querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        return JSON.parse(JSON.stringify(docs));
      }
    } catch (fallbackError) {
      console.error(`Fallback query also failed for ${collectionName}:`, fallbackError);
    }
  }
  return null;
};
