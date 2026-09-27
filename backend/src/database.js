import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', 'data', '4runner.db')

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err)
  } else {
    console.log('Connected to SQLite database at:', dbPath)
    initializeDatabase()
  }
})

function initializeDatabase() {
  db.serialize(() => {
    // Mileage table
    db.run(`
      CREATE TABLE IF NOT EXISTS mileage (
        id INTEGER PRIMARY KEY,
        miles INTEGER NOT NULL,
        lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Services table
    db.run(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        interval INTEGER NOT NULL,
        lastCompletedMileage INTEGER DEFAULT 0,
        notes TEXT,
        createdDate DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Service history table
    db.run(`
      CREATE TABLE IF NOT EXISTS service_history (
        id INTEGER PRIMARY KEY,
        serviceId INTEGER NOT NULL,
        serviceName TEXT NOT NULL,
        completedMileage INTEGER NOT NULL,
        completedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        FOREIGN KEY (serviceId) REFERENCES services(id)
      )
    `)

    // Components table
    db.run(`
      CREATE TABLE IF NOT EXISTS components (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        installMileage INTEGER NOT NULL,
        lifespan INTEGER DEFAULT 60000,
        installDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      )
    `)

    // Car info table
    db.run(`
      CREATE TABLE IF NOT EXISTS car_info (
        id INTEGER PRIMARY KEY,
        carName TEXT DEFAULT 'My 4Runner',
        year INTEGER,
        model TEXT,
        trim TEXT,
        color TEXT,
        licensePlate TEXT,
        vin TEXT,
        purchaseDate DATE,
        purchaseMileage INTEGER,
        engine TEXT,
        transmission TEXT,
        drivetrain TEXT,
        fuelType TEXT,
        tankCapacity TEXT,
        oilCapacity TEXT,
        oilType TEXT,
        coolantCapacity TEXT,
        coolantType TEXT,
        tireSize TEXT,
        tirePressureFront TEXT,
        tirePressureRear TEXT,
        wheelSize TEXT,
        brakeFluidType TEXT,
        transmissionFluidType TEXT,
        transmissionFluidCapacity TEXT,
        differentialFluidType TEXT,
        differentialFluidCapacity TEXT,
        transferCaseFluidType TEXT,
        transferCaseFluidCapacity TEXT,
        batterySpecs TEXT,
        sparkPlugType TEXT,
        sparkPlugGap TEXT,
        airFilterPartNumber TEXT,
        oilFilterPartNumber TEXT,
        towingCapacity TEXT,
        gvwr TEXT,
        curbWeight TEXT,
        mods TEXT,
        notes TEXT,
        updatedDate DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating car_info table:', err)
      } else {
        // Insert default row if table is empty
        db.get('SELECT COUNT(*) as count FROM car_info', (err, row) => {
          if (!err && row.count === 0) {
            db.run(`INSERT INTO car_info (id) VALUES (1)`)
          }
        })
      }
    })
  })
}

export const database = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err)
        else resolve(this)
      })
    })
  },

  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
  },

  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err)
        else resolve(rows || [])
      })
    })
  }
}
