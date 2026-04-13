const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const data = require('./data.json')

const app = express()
app.use(cors())
app.use(bodyParser.json())

let books = data.books || []
let orders = data.orders || []
let users = data.users || []

// Simple login: accept { user, pass }
app.post('/api/login', (req, res) => {
  const { user, pass } = req.body
  if (user === 'admin' && pass === 'admin') {
    return res.json({ ok: true, token: 'fake-jwt-token', user: { name: '管理员' } })
  }
  res.status(401).json({ ok: false, message: '认证失败' })
})

// Books CRUD
app.get('/api/books', (req, res) => res.json(books))
app.get('/api/books/:id', (req, res) => {
  const b = books.find(x => x.id === Number(req.params.id))
  if (!b) return res.status(404).json({ message: '未找到' })
  res.json(b)
})
app.post('/api/books', (req, res) => {
  const book = req.body
  book.id = books.length ? Math.max(...books.map(b=>b.id)) + 1 : 1
  books.push(book)
  res.status(201).json(book)
})
app.put('/api/books/:id', (req, res) => {
  const id = Number(req.params.id)
  const idx = books.findIndex(x=>x.id===id)
  if (idx === -1) return res.status(404).json({ message: '未找到' })
  books[idx] = Object.assign({ id }, req.body)
  res.json(books[idx])
})
app.delete('/api/books/:id', (req, res) => {
  const id = Number(req.params.id)
  books = books.filter(x=>x.id!==id)
  res.json({ ok: true })
})

// Orders / Users
app.get('/api/orders', (req, res) => res.json(orders))
app.get('/api/users', (req, res) => res.json(users))

const port = process.env.PORT || 4000
app.listen(port, ()=>console.log(`Server running on http://localhost:${port}`))
