// Module-level ref accessible outside React lifecycle.
// Kept in sync with HomeScreen's listeningMode via useEffect.
// Read by the Tab Navigator to block tab presses during voice recognition
// without needing React context or prop drilling.
export const voiceActiveRef = { current: false };
