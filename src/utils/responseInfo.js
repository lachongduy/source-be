const responseSuccess = (res, data, meta, status) => {
  const jsonData = {
    status: status,
    data: data,
    meta: meta,

  };
  return res.status(jsonData.status.code).json(jsonData);
};
const responseError = (res, status) => {
  const jsonData = {
    status: status,
    data: null,
    meta: null,

  };
  return res.status(jsonData.status?.code).json(jsonData);
};

module.exports = { responseSuccess, responseError };
