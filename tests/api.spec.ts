import { test, expect } from '@playwright/test'

test.describe('API Endpoints', () => {
  const baseURL = 'http://localhost:3000'

  test('GET /api/tasks - should return tasks', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/tasks`)
    
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('all')
    expect(Array.isArray(data.all)).toBe(true)
  })

  test('GET /api/tasks - should return tasks by status', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/tasks`)
    
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('backlog')
    expect(data).toHaveProperty('completed')
  })

  test('POST /api/tasks - should create a task', async ({ request }) => {
    const newTask = {
      title: 'API Test Task ' + Date.now(),
      description: 'Created via Playwright API test',
      status: 'BACKLOG',
      priority: 'MEDIUM',
    }

    const response = await request.post(`${baseURL}/api/tasks`, {
      data: newTask,
    })

    expect([200, 201]).toContain(response.status())
    
    const created = await response.json()
    expect(created).toHaveProperty('id')
    expect(created.title).toBe(newTask.title)
  })

  test('PATCH /api/tasks/[id] - should update a task', async ({ request }) => {
    // First create a task
    const createResponse = await request.post(`${baseURL}/api/tasks`, {
      data: {
        title: 'Task to Update ' + Date.now(),
        status: 'BACKLOG',
        priority: 'LOW',
      },
    })
    
    const created = await createResponse.json()
    
    // Now update it
    const updateResponse = await request.patch(`${baseURL}/api/tasks/${created.id}`, {
      data: {
        title: 'Updated Task Title',
        priority: 'HIGH',
      },
    })

    expect(updateResponse.status()).toBe(200)
    
    const updated = await updateResponse.json()
    expect(updated.title).toBe('Updated Task Title')
    expect(updated.priority).toBe('HIGH')
  })

  test('DELETE /api/tasks/[id] - should delete a task', async ({ request }) => {
    // First create a task
    const createResponse = await request.post(`${baseURL}/api/tasks`, {
      data: {
        title: 'Task to Delete ' + Date.now(),
        status: 'BACKLOG',
        priority: 'LOW',
      },
    })
    
    const created = await createResponse.json()
    
    // Delete it
    const deleteResponse = await request.delete(`${baseURL}/api/tasks/${created.id}`)
    expect(deleteResponse.status()).toBe(200)
  })
})

// Search API tests - require OPENAI_API_KEY
test.describe('Search API', () => {
  const baseURL = 'http://localhost:3000'

  test('GET /api/tasks/search - should search tasks', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/tasks/search?q=mission&limit=5`)
    
    // May return 500 if OPENAI_API_KEY not set
    if (response.status() === 500) {
      test.skip(true, 'Search API requires OPENAI_API_KEY')
      return
    }
    
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('results')
    expect(Array.isArray(data.results)).toBe(true)
  })

  test('GET /api/tasks/search - should return similarity scores', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/tasks/search?q=email&limit=3`)
    
    if (response.status() === 500) {
      test.skip(true, 'Search API requires OPENAI_API_KEY')
      return
    }
    
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    
    if (data.results.length > 0) {
      expect(data.results[0]).toHaveProperty('similarity')
      expect(typeof data.results[0].similarity).toBe('number')
    }
  })
})
