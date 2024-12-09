import { db } from './firebase';
import { ref, set, get, goOffline } from 'firebase/database';
import { getApp } from 'firebase/app';

describe('Firebase Connection', () => {
    // Cleanup after all tests
    afterAll(async () => {
        // Close the database connection
        await goOffline(db);
    });

    it('should connect to Firebase and perform a write/read operation', async () => {
        const testRef = ref(db, 'test');
        const testData = { message: 'Hello Firebase!' };
        
        try {
            // Write data
            await set(testRef, testData);
            
            // Read data
            const snapshot = await get(testRef);
            const data = snapshot.val();
            
            expect(data).toEqual(testData);
        } catch (error) {
            console.error('Firebase test error:', error);
            throw error;
        }
    }, 10000); // Set timeout to 10 seconds
});
