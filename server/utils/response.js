const success = (data = null, msg = 'success') => {
  return {
    code: 200,
    msg,
    data
  }
}

const error = (msg = 'error', code = 500) => {
  return {
    code,
    msg,
    data: null
  }
}

const pageSuccess = (list, total, page, pageSize, extra = {}) => {
  return {
    code: 200,
    msg: 'success',
    data: {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      ...extra
    }
  }
}

module.exports = { success, error, pageSuccess }
