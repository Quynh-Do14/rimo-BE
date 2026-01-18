const db = require('../config/database')

const getAllAgency = async ({
  page = 1,
  limit = 10,
  search = '',
  province,
  district
}) => {
  const offset = (page - 1) * limit
  const conditions = []
  const values = []
  let paramIndex = 1

  // Xây dựng điều kiện WHERE nếu có tìm kiếm chung
  if (search) {
    values.push(`%${search}%`)
    conditions.push(
      `(name ILIKE $${paramIndex} OR address ILIKE $${paramIndex} OR phone_number ILIKE $${paramIndex})`
    )
    paramIndex++
  }

  // Thêm điều kiện tìm kiếm theo province
  if (province) {
    values.push(`%${province}%`)
    conditions.push(`province ILIKE $${paramIndex}`)
    paramIndex++
  }

  // Thêm điều kiện tìm kiếm theo district
  if (district) {
    values.push(`%${district}%`)
    conditions.push(`district ILIKE $${paramIndex}`)
    paramIndex++
  }

  // Tạo câu WHERE nếu có điều kiện
  const whereClause =
    conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : ''

  // Câu truy vấn chính
  const dataQuery = `
    SELECT * FROM agency
    ${whereClause}
    ORDER BY id DESC
    LIMIT $${paramIndex}
    OFFSET $${paramIndex + 1}
  `

  // Câu truy vấn đếm tổng số dòng
  const countQuery = `
    SELECT COUNT(*) FROM agency
    ${whereClause}
  `

  // Thêm limit và offset vào values
  values.push(limit, offset)

  // Thực hiện truy vấn
  const dataResult = await db.query(dataQuery, values)

  // Lấy các tham số chỉ dùng cho WHERE clause (loại bỏ limit và offset)
  const countParams = values.slice(0, values.length - 2)
  const countResult = await db.query(countQuery, countParams)

  const total = parseInt(countResult.rows[0].count)

  return {
    data: dataResult.rows,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit)
  }
}

const getAgencyById = async id => {
  const result = await db.query('SELECT * FROM agency WHERE id = $1', [id])
  return result.rows[0]
}

const createAgency = async ({
  name,
  address,
  lat,
  long,
  phone_number,
  province,
  district,
  image
}) => {
  const result = await db.query(
    'INSERT INTO agency(name, address, lat, long, phone_number,province,district, image) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [name, address, lat, long, phone_number, province, district, image]
  )
  return result.rows[0]
}

const updateAgency = async (
  id,
  { name, address, lat, long, phone_number, province, district, image }
) => {
  // Xây dựng câu truy vấn động
  const fields = []
  const values = []
  let query = 'UPDATE agency SET '

  if (name !== undefined) {
    fields.push('name')
    values.push(name)
  }

  if (address !== undefined) {
    fields.push('address')
    values.push(address)
  }

  if (lat !== undefined) {
    fields.push('lat')
    values.push(lat)
  }

  if (long !== undefined) {
    fields.push('long')
    values.push(long)
  }

  if (phone_number !== undefined) {
    fields.push('phone_number')
    values.push(phone_number)
  }

  if (province !== undefined) {
    fields.push('province')
    values.push(province)
  }

  if (district !== undefined) {
    fields.push('district')
    values.push(district)
  }

  if (image !== undefined) {
    fields.push('image')
    values.push(image)
  }

  // Tạo phần SET của câu query
  const setClause = fields
    .map((field, index) => `${field} = $${index + 1}`)
    .join(', ')

  query += setClause + ` WHERE id = $${fields.length + 1} RETURNING *`
  values.push(id)

  const result = await db.query(query, values)
  return result.rows[0]
}

const deleteAgency = async id => {
  await db.query('DELETE FROM agency WHERE id = $1', [id])
}

module.exports = {
  getAllAgency,
  getAgencyById,
  createAgency,
  updateAgency,
  deleteAgency
}
