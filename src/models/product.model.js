const db = require('../config/database')

const getAllProductModels = async ({
  page = 1,
  limit = 10,
  search = '',
  series_id,
  sort_by = 'created_at',
  sort_order = 'desc'
}) => {
  const offset = (page - 1) * limit
  const queryParams = []

  let query = `
    SELECT pm.*, 
           ps.name as series_name,
           (SELECT COUNT(*) FROM product_model_figures WHERE model_id = pm.id) as figure_count
    FROM product_models pm
    LEFT JOIN product_series ps ON pm.series_id = ps.id
  `

  let countQuery = `
    SELECT COUNT(*)
    FROM product_models pm
    LEFT JOIN product_series ps ON pm.series_id = ps.id
  `

  let conditions = []

  // Tìm kiếm theo model_key
  if (search) {
    queryParams.push(`%${search}%`)
    conditions.push(`LOWER(pm.model_key) LIKE LOWER($${queryParams.length})`)
  }

  // Lọc theo series_id
  if (series_id) {
    queryParams.push(series_id)
    conditions.push(`pm.series_id = $${queryParams.length}`)
  }

  // Gắn điều kiện WHERE nếu có
  if (conditions.length > 0) {
    const whereClause = ` WHERE ${conditions.join(' AND ')}`
    query += whereClause
    countQuery += whereClause
  }

  // Validate sort_by để tránh SQL injection
  const allowedSortColumns = ['id', 'model_key', 'created_at', 'updated_at']
  const safeSortBy = allowedSortColumns.includes(sort_by)
    ? sort_by
    : 'created_at'
  const safeSortOrder = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC'

  query += ` ORDER BY pm.${safeSortBy} ${safeSortOrder}`

  // Phân trang
  queryParams.push(limit)
  queryParams.push(offset)
  query += ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`

  // Truy vấn DB
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

const getProductModelById = async id => {
  // Lấy model hiện tại với thông tin đầy đủ
  const modelResult = await db.query(
    `
    SELECT pm.*, 
           ps.name as series_name,
           json_agg(
               json_build_object(
                   'id', pmf.id,
                   'key', pmf.fig_key,
                   'value', pmf.fig_value,
                   'created_at', pmf.created_at,
                   'updated_at', pmf.updated_at
               )
           ) as figures
    FROM product_models pm
    LEFT JOIN product_series ps ON pm.series_id = ps.id
    LEFT JOIN product_model_figures pmf ON pm.id = pmf.model_id
    WHERE pm.id = $1
    GROUP BY pm.id, ps.name
    `,
    [id]
  )

  const model = modelResult.rows[0]
  if (!model) return null

  return model
}

const getProductModelsBySeriesId = async (seriesId, { limit = 10 } = {}) => {
  const result = await db.query(
    `
    SELECT pm.*,
           json_agg(
               json_build_object(
                   'id', pmf.id,
                   'key', pmf.fig_key,
                   'value', pmf.fig_value
               )
           ) as figures
    FROM product_models pm
    LEFT JOIN product_model_figures pmf ON pm.id = pmf.model_id
    WHERE pm.series_id = $1
    GROUP BY pm.id
    ORDER BY pm.model_key
    LIMIT $2
    `,
    [seriesId, limit]
  )
  return result.rows
}

const checkModelKeyExists = async (model_key, series_id, excludeId = null) => {
  let query = `
    SELECT id FROM product_models 
    WHERE LOWER(model_key) = LOWER($1) AND series_id = $2
  `
  const params = [model_key, series_id]

  if (excludeId) {
    query += ' AND id != $3'
    params.push(excludeId)
  }

  const result = await db.query(query, params)
  return result.rowCount > 0
}

const createProductModel = async ({ model_key, series_id }) => {
  const res = await db.query(
    'INSERT INTO product_models (model_key, series_id) VALUES ($1, $2) RETURNING *',
    [model_key, series_id]
  )
  return res.rows[0]
}

const updateProductModel = async (id, { model_key, series_id }) => {
  const result = await db.query(
    `UPDATE product_models SET model_key = $1, series_id = $2 WHERE id = $3 RETURNING *`,
    [model_key, series_id, id]
  )
  return result.rows[0]
}

const deleteProductModel = async id => {
  await db.query('DELETE FROM product_models WHERE id = $1', [id])
}

module.exports = {
  getAllProductModels,
  getProductModelById,
  getProductModelsBySeriesId,
  checkModelKeyExists,
  createProductModel,
  updateProductModel,
  deleteProductModel
}
