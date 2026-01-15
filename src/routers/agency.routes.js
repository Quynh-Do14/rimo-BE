const express = require('express')
const router = express.Router()
const agencyController = require('../controllers/agency.controller')
const upload = require('../middlewares/upload.middleware')

// CRUD operations
router.get('/', agencyController.getAll)
router.get('/:id', agencyController.getById)
router.post('/', upload.single('image'), agencyController.create)
router.put('/:id', upload.single('image'), agencyController.update)
router.delete('/:id', agencyController.remove)

module.exports = router
