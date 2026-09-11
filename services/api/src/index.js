const { Firestore } = require('@google-cloud/firestore');
const { createApp } = require('./app');

const port = Number(process.env.PORT) || 8080;
const app = createApp({ firestore: new Firestore() });

app.listen(port, () => {
  console.log(`TriAnalytica API listening on port ${port}`);
});