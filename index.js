import express, { json, urlencoded } from "express";
import db from "./helper/database/connection";
import { Server } from "socket.io";
import http from 'http'
import cors from 'cors'

import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = 5000;

app.use(cors())
app.use(json())
app.use(urlencoded({ extended: true }))

const server = http.createServer(app)
const io = new Server(server)

io.on('connection', (socket) => {
  console.log('a user connected');
});


async function getLatestData() {
  try {
    const result = await db.query(`
      SELECT
        locations.id AS location_id,
        locations.location_name,
        locations.location_image,
        jsonb_build_object(
          'id', monitors.id,
          'light_intensity', monitors.light_intensity,
          'water_ph', monitors.water_ph,
          'water_tss', monitors.water_tss,
          'water_ec', monitors.water_ec,
          'water_tds', monitors.water_tds,
          'soil_ph', monitors.soil_ph,
          'soil_temperature', monitors.soil_temperature,
          'soil_ec', monitors.soil_ec,
          'soil_moisture', monitors.soil_moisture,
          'weather_humidity', monitors.weather_humidity,
          'weather_temperature', monitors.weather_temperature,
          'created_at', monitors.created_at
        ) AS current_monitor
      FROM
        locations
      JOIN LATERAL (
        SELECT *
        FROM monitors
        WHERE location_id = locations.id
        ORDER BY created_at DESC
        LIMIT 1
      ) monitors ON true
    `);

    return result.rows;
  } catch (error) {
    console.error('Error fetching latest data:', error);
    return null;
  }
}
async function getLatestDataLocation(location_id) {
  try {
    const result = await db.query(`
    SELECT
    locations.id AS location_id,
    locations.location_name,
    locations.location_image,
    jsonb_agg(
      jsonb_build_object(
        'id', monitors.id,
        'light_intensity', monitors.light_intensity,
        'water_ph', monitors.water_ph,
        'water_tss', monitors.water_tss,
        'water_ec', monitors.water_ec,
        'water_tds', monitors.water_tds,
        'soil_ph', monitors.soil_ph,
        'soil_temperature', monitors.soil_temperature,
        'soil_ec', monitors.soil_ec,
        'soil_moisture', monitors.soil_moisture,
        'weather_humidity', monitors.weather_humidity,
        'weather_temperature', monitors.weather_temperature,
        'created_at', monitors.created_at
      )
    ) AS history
  FROM
    locations
  JOIN LATERAL (
    SELECT *
    FROM monitors
    WHERE location_id = locations.id
    ORDER BY created_at DESC
    LIMIT 7
  ) monitors ON true
  WHERE
    locations.id = $1
  GROUP BY
    locations.id;
    `, [location_id]);

    return result.rows[0];
  } catch (error) {
    console.error('Error fetching latest data:', error);
    return null;
  }
}
app.post("/monitors", (req, res) => {
  const { location_id, light_intensity, water_ph,
    water_tss, water_ec, water_tds, soil_ph, soil_temperature, soil_ec,
    soil_moisture, weather_humidity, weather_temperature } = req.body
  db.query(`  
    INSERT INTO monitors (
      id, location_id, light_intensity, water_ph,
      water_tss, water_ec, water_tds, soil_ph, soil_temperature, soil_ec,
      soil_moisture, weather_humidity, weather_temperature
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
    ) RETURNING id
  `, [uuidv4(), location_id, light_intensity, water_ph, water_tss, water_ec, water_tds, soil_ph, soil_temperature, soil_ec, soil_moisture, weather_humidity, weather_temperature], async (error, result) => {
    if (error) {
      return res.status(400).send({
        success: false,
        message: "Failed add data.",
        data: error
      })
    }
    const latestData = await getLatestData();
    const latestDataLocation = await getLatestDataLocation(location_id);
    io.emit('monitor-location-current', latestData);
    io.emit(`monitor-location-current-${location_id}`, latestDataLocation);

    return res.status(201).send({
      success: true,
      message: "Success add data.",
      data: result.rows[0]
    })
  })
});
app.get("/monitors", (req, res) => {
  db.query(`  
      SELECT
        monitors.*,
        locations.location_name,
        locations.location_image
      FROM
        monitors
      JOIN
        locations ON monitors.location_id = locations.id
      ORDER BY
      monitors.created_at ASC
  `, (error, result) => {
    if (error) return res.status(400).send({
      success: false,
      message: "Failed get data.",
      data: error
    })
    return res.status(200).send({
      success: true,
      message: "Success get data.",
      data: result.rows
    })
  })
});
app.get("/monitor-locations", (req, res) => {
  db.query(` 
  SELECT
  locations.id AS location_id,
  locations.location_name,
  locations.location_image,
  jsonb_build_object(
    'id', monitors.id,
    'light_intensity', monitors.light_intensity,
    'water_ph', monitors.water_ph,
    'water_tss', monitors.water_tss,
    'water_ec', monitors.water_ec,
    'water_tds', monitors.water_tds,
    'soil_ph', monitors.soil_ph,
    'soil_temperature', monitors.soil_temperature,
    'soil_ec', monitors.soil_ec,
    'soil_moisture', monitors.soil_moisture,
    'weather_humidity', monitors.weather_humidity,
    'weather_temperature', monitors.weather_temperature,
    'created_at', monitors.created_at
  ) AS current_monitor
FROM
  locations
JOIN LATERAL (
  SELECT *
  FROM monitors
  WHERE location_id = locations.id
  ORDER BY created_at DESC
  LIMIT 1
) monitors ON true
  `, (error, result) => {
    if (error) return res.status(400).send({
      success: false,
      message: "Failed get data.",
      data: error
    })
    return res.status(200).send({
      success: true,
      message: "Success get data.",
      data: result.rows
    })
  })
});
app.get("/monitor-locations/:id_location", (req, res) => {
  db.query(` 
  SELECT
    locations.id AS location_id,
    locations.location_name,
    locations.location_image,
    jsonb_agg(
      jsonb_build_object(
        'id', monitors.id,
        'light_intensity', monitors.light_intensity,
        'water_ph', monitors.water_ph,
        'water_tss', monitors.water_tss,
        'water_ec', monitors.water_ec,
        'water_tds', monitors.water_tds,
        'soil_ph', monitors.soil_ph,
        'soil_temperature', monitors.soil_temperature,
        'soil_ec', monitors.soil_ec,
        'soil_moisture', monitors.soil_moisture,
        'weather_humidity', monitors.weather_humidity,
        'weather_temperature', monitors.weather_temperature,
        'created_at', monitors.created_at
      )
    ) AS history
  FROM
    locations
  JOIN LATERAL (
    SELECT *
    FROM monitors
    WHERE location_id = locations.id
    ORDER BY created_at DESC
    LIMIT 7
  ) monitors ON true
  WHERE
    locations.id = $1
  GROUP BY
    locations.id;


  `, [req.params.id_location], (error, result) => {
    if (error) {
      if (error.code == "22P02") return res.status(400).send({
        success: false,
        message: `Failed get data, ${req.params.id_location} not found`,
        data: {
          location_id: req.params.id_location,
          location_name: "",
          location_image: "",
          history: []
        }
      })
      return res.status(400).send({
        success: false,
        message: "Failed get data.",
        data: error
      })
    }
    if (result.rowCount == 0) return res.status(400).send({
      success: false,
      message: `Failed get data, ${req.params.id_location} not found`,
      data: {
        location_id: req.params.id_location,
        location_name: "",
        location_image: "",
        history: []
      }
    })
    return res.status(200).send({
      success: true,
      message: "Success get data.",
      data: result.rows[0] 
    })
  })
});








server.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});



// SELECT DISTINCT ON (locations.id)
// locations.id AS location_id,
// locations.location_name,
// locations.location_image,
// jsonb_build_object(
//   'id', monitors.id,
//   'light_intensity', monitors.light_intensity,
//   'water_ph', monitors.water_ph,
//   'water_tss', monitors.water_tss,
//   'water_ec', monitors.water_ec,
//   'water_tds', monitors.water_tds,
//   'soil_temperature', monitors.soil_temperature,
//   'soil_ec', monitors.soil_ec,
//   'soil_moisture', monitors.soil_moisture,
//   'weather_humidity', monitors.weather_humidity,
//   'weather_temperature', monitors.weather_temperature,
//   'created_at', monitors.created_at
// ) AS current_monitor
// FROM
// locations
// JOIN
// monitors ON locations.id = monitors.location_id
// ORDER BY
// locations.id,
// monitors.created_at DESC