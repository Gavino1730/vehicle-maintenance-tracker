import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { database } from './database.js'
import { OpenAI } from 'openai'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const getTodayDateString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// ===== SERVICE UPDATE ENDPOINT =====
app.put('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { lastCompletedMileage, notes, interval, name } = req.body;
    // Only update fields that are provided
    const fields = [];
    const values = [];
    if (lastCompletedMileage !== undefined) {
      fields.push('lastCompletedMileage = ?');
      values.push(lastCompletedMileage);
    }
    if (notes !== undefined) {
      fields.push('notes = ?');
      values.push(notes);
    }
    if (interval !== undefined) {
      fields.push('interval = ?');
      values.push(interval);
    }
    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name);
    }
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    values.push(id);
    const sql = `UPDATE services SET ${fields.join(', ')} WHERE id = ?`;
    await database.run(sql, values);
    const updated = await database.get('SELECT * FROM services WHERE id = ?', [id]);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Serve the built frontend
const frontendPath = path.join(__dirname, '../../frontend/dist')
app.use(express.static(frontendPath))

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

// ===== MILEAGE ENDPOINTS =====

app.get('/api/mileage', async (req, res) => {
  try {
    const result = await database.get('SELECT miles FROM mileage ORDER BY lastUpdated DESC LIMIT 1')
    res.json({ mileage: result?.miles || 0 })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch mileage' })
  }
})

app.post('/api/mileage', async (req, res) => {
  try {
    const { mileage } = req.body
    if (typeof mileage !== 'number') {
      return res.status(400).json({ error: 'Invalid mileage value' })
    }
    
    await database.run('DELETE FROM mileage')
    await database.run('INSERT INTO mileage (miles) VALUES (?)', [mileage])
    
    res.json({ success: true, mileage })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to update mileage' })
  }
})

// ===== SERVICES ENDPOINTS =====

app.get('/api/services', async (req, res) => {
  try {
    const services = await database.all('SELECT * FROM services ORDER BY createdDate DESC')
    
    // For each service, get the most recent completion date
    const servicesWithDates = await Promise.all(services.map(async (service) => {
      const lastHistory = await database.get(
        'SELECT completedDate FROM service_history WHERE serviceId = ? ORDER BY completedDate DESC LIMIT 1',
        [service.id]
      )
      return {
        ...service,
        lastCompletedDate: lastHistory?.completedDate || null
      }
    }))
    
    res.json(servicesWithDates)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch services' })
  }
})

app.post('/api/services', async (req, res) => {
  try {
    const { name, interval, lastCompletedMileage = 0, notes = '' } = req.body

    if (!name || !interval) {
      return res.status(400).json({ error: 'Name and interval are required' })
    }

    const result = await database.run(
      'INSERT INTO services (name, interval, lastCompletedMileage, notes) VALUES (?, ?, ?, ?)',
      [name, interval, lastCompletedMileage, notes]
    )

    const service = await database.get('SELECT * FROM services WHERE id = ?', [result.lastID])
    res.json(service)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to create service' })
  }
})

// ===== SERVICE COMPLETION ENDPOINT =====

app.post('/api/services/:serviceId/complete', async (req, res) => {
  try {
    const { serviceId } = req.params
    const { completedMileage } = req.body

    if (typeof completedMileage !== 'number') {
      return res.status(400).json({ error: 'Invalid mileage value' })
    }

    const service = await database.get('SELECT * FROM services WHERE id = ?', [serviceId])
    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    // Log to history
    const result = await database.run(
      'INSERT INTO service_history (serviceId, serviceName, completedMileage, notes) VALUES (?, ?, ?, ?)',
      [serviceId, service.name, completedMileage, service.notes]
    )

    // Update service's last completed mileage
    await database.run(
      'UPDATE services SET lastCompletedMileage = ? WHERE id = ?',
      [completedMileage, serviceId]
    )

    const historyRecord = await database.get(
      'SELECT * FROM service_history WHERE id = ?',
      [result.lastID]
    )

    res.json(historyRecord)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to complete service' })
  }
})

// ===== SERVICE HISTORY ENDPOINT =====

app.get('/api/history', async (req, res) => {
  try {
    const history = await database.all(
      'SELECT * FROM service_history ORDER BY completedDate DESC'
    )
    res.json(history)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch history' })
  }
})

app.post('/api/history', async (req, res) => {
  try {
    const { serviceId, serviceName, completedMileage, completedDate, notes } = req.body

    if (!serviceId || typeof completedMileage !== 'number') {
      return res.status(400).json({ error: 'Service ID and mileage are required' })
    }

    // Get the service to verify it exists
    const service = await database.get('SELECT * FROM services WHERE id = ?', [serviceId])
    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    const result = await database.run(
      `INSERT INTO service_history (serviceId, serviceName, completedMileage, completedDate, notes) 
       VALUES (?, ?, ?, ?, ?)`,
      [serviceId, serviceName || service.name, completedMileage, completedDate || getTodayDateString(), notes || '']
    )

    // Update the service's lastCompletedMileage if this is more recent
    if (completedMileage > service.lastCompletedMileage) {
      await database.run(
        'UPDATE services SET lastCompletedMileage = ? WHERE id = ?',
        [completedMileage, serviceId]
      )
    }

    const newRecord = await database.get('SELECT * FROM service_history WHERE id = ?', [result.lastID])
    res.json(newRecord)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to add history record' })
  }
})

app.put('/api/history/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { serviceId, serviceName, completedMileage, completedDate, notes } = req.body

    if (typeof completedMileage !== 'number') {
      return res.status(400).json({ error: 'Invalid input' })
    }

    // Get the existing record to check if serviceId changed
    const oldRecord = await database.get('SELECT * FROM service_history WHERE id = ?', [id])

    // Build update fields
    const fields = []
    const values = []
    
    if (serviceId !== undefined) {
      fields.push('serviceId = ?')
      values.push(serviceId)
    }
    if (serviceName !== undefined) {
      fields.push('serviceName = ?')
      values.push(serviceName)
    }
    if (completedMileage !== undefined) {
      fields.push('completedMileage = ?')
      values.push(completedMileage)
    }
    if (completedDate !== undefined) {
      fields.push('completedDate = ?')
      values.push(completedDate)
    }
    if (notes !== undefined) {
      fields.push('notes = ?')
      values.push(notes || '')
    }
    
    values.push(id)

    await database.run(
      `UPDATE service_history SET ${fields.join(', ')} WHERE id = ?`,
      values
    )

    // Update service's lastCompletedMileage if needed
    const finalServiceId = serviceId || oldRecord.serviceId
    if (finalServiceId) {
      const service = await database.get('SELECT * FROM services WHERE id = ?', [finalServiceId])
      if (service && completedMileage > service.lastCompletedMileage) {
        await database.run(
          'UPDATE services SET lastCompletedMileage = ? WHERE id = ?',
          [completedMileage, finalServiceId]
        )
      }
    }

    const updated = await database.get('SELECT * FROM service_history WHERE id = ?', [id])
    res.json(updated)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to update history' })
  }
})

app.delete('/api/history/:id', async (req, res) => {
  try {
    const { id } = req.params
    await database.run('DELETE FROM service_history WHERE id = ?', [id])
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to delete history' })
  }
})

// ===== AI INSIGHTS ENDPOINT =====

app.post('/api/ai-insights', async (req, res) => {
  try {
    if (!openai) {
      return res.status(400).json({
        error: 'OpenAI API key not configured',
        message: 'Set OPENAI_API_KEY in .env file'
      })
    }

    const { currentMileage, services, history } = req.body

    // Prepare data summary for AI
    const servicesInfo = services.map(s => {
      const nextDue = s.lastCompletedMileage + s.interval
      const status = nextDue <= currentMileage ? 'OVERDUE' : `due in ${nextDue - currentMileage} miles`
      return `- ${s.name}: every ${s.interval} miles (last done at ${s.lastCompletedMileage} mi) - ${status}`
    }).join('\n')

    const historyInfo = history.slice(0, 10).map(h => 
      `- ${h.serviceName}: ${h.completedMileage.toLocaleString()} miles (${new Date(h.completedDate).toLocaleDateString()})`
    ).join('\n')

    const prompt = `You are a 4Runner maintenance expert. Analyze this vehicle's maintenance status and provide personalized insights and recommendations.

Current Mileage: ${currentMileage.toLocaleString()} miles

Scheduled Services:
${servicesInfo}

Recent Service History:
${historyInfo || 'No service history yet'}

Please provide:
1. Current maintenance status summary
2. Priority services that need attention
3. Preventive maintenance recommendations based on mileage
4. Any concerns specific to 4Runners at this mileage
5. Maintenance best practices to extend vehicle life

Keep response concise and actionable.`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful 4Runner maintenance advisor. Provide practical, accurate maintenance insights.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    })

    const insights = response.choices[0].message.content

    res.json({ insights })
  } catch (error) {
    console.error('AI Insights error:', error)
    
    if (error.status === 401) {
      return res.status(401).json({
        error: 'Invalid OpenAI API key',
        message: 'Check your OPENAI_API_KEY in the .env file'
      })
    }

    res.status(500).json({
      error: 'Failed to generate insights',
      message: error.message
    })
  }
})

// ===== COMPONENTS ENDPOINTS =====

app.get('/api/components', async (req, res) => {
  try {
    const components = await database.all('SELECT * FROM components ORDER BY installDate DESC')
    res.json(components)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch components' })
  }
})

app.post('/api/components', async (req, res) => {
  try {
    const { name, category, installMileage, lifespan = 60000, notes = '' } = req.body

    if (!name || !category || typeof installMileage !== 'number') {
      return res.status(400).json({ error: 'Name, category, and install mileage are required' })
    }

    const result = await database.run(
      'INSERT INTO components (name, category, installMileage, lifespan, notes) VALUES (?, ?, ?, ?, ?)',
      [name, category, installMileage, lifespan, notes]
    )

    const component = await database.get('SELECT * FROM components WHERE id = ?', [result.lastID])
    res.json(component)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to add component' })
  }
})

app.put('/api/components/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, category, installMileage, lifespan, notes } = req.body

    await database.run(
      'UPDATE components SET name = ?, category = ?, installMileage = ?, lifespan = ?, notes = ? WHERE id = ?',
      [name, category, installMileage, lifespan, notes, id]
    )

    const component = await database.get('SELECT * FROM components WHERE id = ?', [id])
    res.json(component)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to update component' })
  }
})

app.delete('/api/components/:id', async (req, res) => {
  try {
    const { id } = req.params
    await database.run('DELETE FROM components WHERE id = ?', [id])
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to delete component' })
  }
})

// ===== HEALTH CHECK =====

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// ===== CAR INFO ENDPOINTS =====

app.get('/api/car-info', async (req, res) => {
  try {
    let carInfo = await database.get('SELECT * FROM car_info WHERE id = 1')
    if (!carInfo) {
      await database.run('INSERT INTO car_info (id) VALUES (1)')
      carInfo = await database.get('SELECT * FROM car_info WHERE id = 1')
    }
    res.json(carInfo)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch car info' })
  }
})

app.put('/api/car-info', async (req, res) => {
  try {
    const { 
      carName, year, model, trim, color, licensePlate, vin, purchaseDate, purchaseMileage,
      engine, transmission, drivetrain, fuelType, tankCapacity, oilCapacity, oilType,
      coolantCapacity, coolantType, tireSize, tirePressureFront, tirePressureRear, wheelSize,
      brakeFluidType, transmissionFluidType, transmissionFluidCapacity,
      differentialFluidType, differentialFluidCapacity, transferCaseFluidType, transferCaseFluidCapacity,
      batterySpecs, sparkPlugType, sparkPlugGap, airFilterPartNumber, oilFilterPartNumber,
      towingCapacity, gvwr, curbWeight, mods, notes 
    } = req.body

    await database.run(
      `UPDATE car_info SET 
        carName = ?, year = ?, model = ?, trim = ?, color = ?, licensePlate = ?, vin = ?, 
        purchaseDate = ?, purchaseMileage = ?, engine = ?, transmission = ?, drivetrain = ?,
        fuelType = ?, tankCapacity = ?, oilCapacity = ?, oilType = ?, coolantCapacity = ?,
        coolantType = ?, tireSize = ?, tirePressureFront = ?, tirePressureRear = ?, wheelSize = ?,
        brakeFluidType = ?, transmissionFluidType = ?, transmissionFluidCapacity = ?,
        differentialFluidType = ?, differentialFluidCapacity = ?, transferCaseFluidType = ?,
        transferCaseFluidCapacity = ?, batterySpecs = ?, sparkPlugType = ?, sparkPlugGap = ?,
        airFilterPartNumber = ?, oilFilterPartNumber = ?, towingCapacity = ?, gvwr = ?,
        curbWeight = ?, mods = ?, notes = ?, updatedDate = CURRENT_TIMESTAMP
      WHERE id = 1`,
      [
        carName, year, model, trim, color, licensePlate, vin, purchaseDate, purchaseMileage,
        engine, transmission, drivetrain, fuelType, tankCapacity, oilCapacity, oilType,
        coolantCapacity, coolantType, tireSize, tirePressureFront, tirePressureRear, wheelSize,
        brakeFluidType, transmissionFluidType, transmissionFluidCapacity,
        differentialFluidType, differentialFluidCapacity, transferCaseFluidType, transferCaseFluidCapacity,
        batterySpecs, sparkPlugType, sparkPlugGap, airFilterPartNumber, oilFilterPartNumber,
        towingCapacity, gvwr, curbWeight, mods, notes
      ]
    )

    const updated = await database.get('SELECT * FROM car_info WHERE id = 1')
    res.json(updated)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to update car info' })
  }
})

// Serve index.html for all non-API routes (client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`\n4Runner Maintenance App running at http://localhost:${PORT}`)
  console.log(`OpenAI Integration: ${openai ? 'Enabled' : 'Disabled (set OPENAI_API_KEY to enable AI insights)'}`)
})
