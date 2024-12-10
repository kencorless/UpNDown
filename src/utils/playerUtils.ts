// Generate a unique player ID and store it in localStorage
export const getPlayerId = (): string => {
    const storageKey = 'playerId';
    const storedId = localStorage.getItem(storageKey);
    
    if (storedId) {
        console.log('Using stored player ID:', storedId);
        return storedId;
    }

    // Generate a new unique ID
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    const newId = `p_${timestamp}_${randomStr}`;
    
    localStorage.setItem(storageKey, newId);
    console.log('Generated new player ID:', newId);
    return newId;
};
