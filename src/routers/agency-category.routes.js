const express = require('express')
const router = express.Router()
const agencyCategoryController = require('../controllers/agency-category.controller')

// CRUD danh mục sản phẩm
router.get('/', agencyCategoryController.getAll)
router.get('/:id', agencyCategoryController.getById)
router.post('/', agencyCategoryController.create)
router.put('/:id', agencyCategoryController.update)
router.delete('/:id', agencyCategoryController.remove)

module.exports = router
