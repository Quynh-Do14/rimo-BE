const express = require('express')
const router = express.Router()
const videoController = require('../controllers/video.controller')
const upload = require('../middlewares/upload.middleware')

// CRUD danh mục sản phẩm
router.get('/', videoController.getAll)
router.get('/:id', videoController.getById)
router.post('/', upload.single('image'), videoController.create)
router.put('/:id', upload.single('image'), videoController.update)
router.delete('/:id', videoController.remove)

module.exports = router
