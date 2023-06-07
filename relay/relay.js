import fs from 'fs';
import mqtt from 'mqtt';

export const handler = async (event, context) => {
  const config = JSON.parse(fs.readFileSync('config.json'));

  const cert = fs.readFileSync("cert.pem");
  const key = fs.readFileSync("key.pem");
  const ca = fs.readFileSync("AmazonRootCA1.pem");

  const connectOptions = {
    connectTimeout: 4000,
    ca: ca,
    key: key,
    cert: cert,
    keepalive: 60,
    clientId: 'mqtt-client-' + Math.floor((Math.random() * 1000000) + 1),
    protocol: 'mqtts',
    port: 8883,
    host: config.endpoint,
  };

  const client = mqtt.connect(connectOptions);

  const promise = new Promise((resolve, reject) => {
    client.on('error', function (err) {
      console.log('Connection Error: ' + err);
      reject(err);
    });

    client.on('connect', function () {
      console.log('Connected to AWS IoT broker');
      const sessionId = new Date().getTime() + '-' + Math.floor((Math.random() * 1000000) + 1); // Unique ID for this debug session
      client.subscribe(`lambda-debug/callback/${config.mac}/${sessionId}`);
      client.publish('lambda-debug/event/' + config.mac, JSON.stringify({ event, context, envVars: process.env, sessionId }));
    });

    client.on('message', function (topic, message) {
      const payload = JSON.parse(message.toString());
      if (payload.error) {
        console.log('Error: ', payload.error);
        reject(payload.error);
      }
      if (payload.event === 'exit') {
        console.log('Debug session ended');
        client.end();
        resolve('exit');
      }
      resolve(message.toString());
    });
  });

  const message = await promise;
  return JSON.parse(message);
};
