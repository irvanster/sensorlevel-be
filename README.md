# Grenphyto Sensor Reading Backend API

## Download & Demo App

You can **download the APK and view the Postman documentation** [here](https://drive.google.com/drive/u/2/folders/1sXWSQkCQWXWGhQSkM_7Vs0XxrSrkRCtC).

To test the app:

1. Install the APK on your Android device.
2. Open the Postman collection from the provided link.
3. Demo URL API: `https://greenphytotest.genieedocs.com/monitors` in the `sensor add data` collection with method `POST` and Change the provided values in the body (x-www-form-urlencoded) to simulate sensor readings for locations A and B.

```plain
  location_id: 27f9d433-29d2-499c-bab7-c7ab07086d19,
  light_intensity": 200,
  water_ph": 8,
  water_tss": 5,
  water_ec": 12,
  water_tds": 14,
  soil_temperature": 20,
  soil_ec": 16,
  soil_ph": 6,
  soil_moisture": 17,
  weather_humidity": 80,
  weather_temperature": 40
```

## Stack

- **Mobile App (Flutter):**
  - [Repository Mobile Flutter](https://github.com/irvanster/greenphyto-monitoring-mobile)
  - Developed using the Flutter framework and Dart programming language.
  - Utilizes the **`fl_chart`** library for powerful and customizable graphing to visualize sensor data.

- **Backend (Express.js, Bun/Node.js) & Socket.IO:**
  - The backend is powered by Express.js with Bun (Node.js) and connects to the [Repository Backend API](https://github.com/irvanster/sensorlevel-be) to fetch sensor data.
  - Integrates **Socket.IO** for real-time communication with the mobile app.


## Getting Started

To run the **Grenphyto Backend API** locally, follow these steps:
1. Clone the repository:

   ```bash
   git clone https://github.com/irvanster/sensorlevel-be.git greenphytobe
2. To install dependencies:

```bash
cd greenphytobe
bun install
```

3. To run:

```bash
bun run index.js
```

This project was created using `bun init` in bun v1.0.20. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
