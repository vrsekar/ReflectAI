import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, cleanPayload } from './firebase';
import { UserInteraction, OperationType } from '../types';

export async function saveInteraction(userId: string, interaction: UserInteraction): Promise<void> {
  const path = `users/${userId}/interactions/${interaction.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'interactions', interaction.id);
    const sanitized = cleanPayload<UserInteraction>(interaction);
    await setDoc(docRef, sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToUserInteractions(
  userId: string,
  onUpdate: (interactions: UserInteraction[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const path = `users/${userId}/interactions`;
  const q = query(collection(db, 'users', userId, 'interactions'), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: UserInteraction[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as UserInteraction);
      });
      onUpdate(items);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function deleteInteraction(userId: string, interactionId: string): Promise<void> {
  const path = `users/${userId}/interactions/${interactionId}`;
  try {
    const docRef = doc(db, 'users', userId, 'interactions', interactionId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
