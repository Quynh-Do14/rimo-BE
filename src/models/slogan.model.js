const db = require('../config/database')
const AppError = require('../utils/AppError')

const getAllSlogan = async ({ page = 1, limit = 10, search = '' }) => {
  const offset = (page - 1) * limit
  const queryParams = []
  let query = 'SELECT * FROM slogans WHERE active = true'
  let countQuery = 'SELECT COUNT(*) FROM slogans WHERE active = true'
  let conditions = []

  // Tìm kiếm theo tên (search)
  if (search) {
    queryParams.push(`%${search}%`)
    conditions.push(`LOWER(name) LIKE LOWER($${queryParams.length})`)
  }

  // Gắn điều kiện nếu có
  if (conditions.length > 0) {
    const whereClause = ` WHERE ${conditions.join(' AND ')}`
    query += whereClause
    countQuery += whereClause
  }

  // Thêm phân trang
  queryParams.push(limit)
  queryParams.push(offset)
  query += ` ORDER BY id DESC LIMIT $${queryParams.length - 1} OFFSET $${
    queryParams.length
  }`

  // Truy vấn dữ liệu và tổng số dòng
  const dataResult = await db.query(query, queryParams)
  const countResult = await db.query(
    countQuery,
    queryParams.slice(0, queryParams.length - 2)
  )
  const total = parseInt(countResult.rows[0].count)

  return {
    data: dataResult.rows,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit)
  }
}

const getAllSloganPrivate = async ({ page = 1, limit = 10, search = '' }) => {
  const offset = (page - 1) * limit
  const queryParams = []
  let query = 'SELECT * FROM slogans'
  let countQuery = 'SELECT COUNT(*) FROM slogans'
  let conditions = []

  // Tìm kiếm theo tên (search)
  if (search) {
    queryParams.push(`%${search}%`)
    conditions.push(`LOWER(name) LIKE LOWER($${queryParams.length})`)
  }

  // Gắn điều kiện nếu có
  if (conditions.length > 0) {
    const whereClause = ` WHERE ${conditions.join(' AND ')}`
    query += whereClause
    countQuery += whereClause
  }

  // Thêm phân trang
  queryParams.push(limit)
  queryParams.push(offset)
  query += ` ORDER BY id DESC LIMIT $${queryParams.length - 1} OFFSET $${
    queryParams.length
  }`

  // Truy vấn dữ liệu và tổng số dòng
  const dataResult = await db.query(query, queryParams)
  const countResult = await db.query(
    countQuery,
    queryParams.slice(0, queryParams.length - 2)
  )
  const total = parseInt(countResult.rows[0].count)

  return {
    data: dataResult.rows,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit)
  }
}

const getSloganById = async id => {
  const result = await db.query(
    'SELECT * FROM slogans WHERE id = $1 AND active = true',
    [id]
  )
  return result.rows[0]
}

const getSloganByIdPrivate = async id => {
  const result = await db.query('SELECT * FROM slogans WHERE id = $1', [id])
  return result.rows[0]
}

const createSlogan = async ({ name, description, type, active, image }) => {
  try {
    const result = await db.query(
      'INSERT INTO slogans(name, description, type, active, image) VALUES($1, $2, $3, $4, $5) RETURNING *',
      [name, description, type, active, image]
    )
    return result.rows[0]
  } catch (error) {
    if (error.code === '23505') {
      // Duplicate name
      throw new AppError('Tên slogan đã tồn tại', 400)
    }
    throw error
  }
}

const updateSlogan = async (id, name, description, type, active, image) => {
  try {
    const result = await db.query(
      'UPDATE slogans SET name = $1, description = $2, type = $3, active = $4, image = $5 WHERE id = $6 RETURNING *',
      [String(name).trim(), description, type, active, image, id]
    )

    if (result.rows.length === 0) {
      throw new AppError('Không tìm thấy slogan', 404)
    }

    return result.rows[0]
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    console.error('Lỗi khi cập nhật slogan:', error)
    throw new AppError('Lỗi server khi cập nhật slogan', 500)
  }
}
const deleteSlogan = async id => {
  try {
    // Nếu không có sản phẩm, thực hiện xóa
    const deleteResult = await db.query(
      'DELETE FROM slogans WHERE id = $1 RETURNING *',
      [id]
    )

    if (!deleteResult.rows[0]) {
      throw new AppError('ảnh không tồn tại', 404)
    }

    return {
      success: true,
      message: 'Xóa ảnh thành công',
      data: deleteResult.rows[0]
    }
  } catch (error) {
    throw error
  }
}

module.exports = {
  getAllSlogan,
  getAllSloganPrivate,
  getSloganById,
  getSloganByIdPrivate,
  createSlogan,
  updateSlogan,
  deleteSlogan
}
