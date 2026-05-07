const base = require('./app.json');

module.exports = {
  ...base,
  expo: {
    ...base.expo,
    extra: {
      geminiApiKey: process.env.EXPO_GEMINI_API_KEY ?? 'AIzaSyB_iwCPMHXQO_WxFRxqb57T9JgM-vCwhkY',
      apiUrl: process.env.EXPO_API_URL ?? 'https://hyperethical-euthermic-johnnie.ngrok-free.dev',
    },
  },
};
