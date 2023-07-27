const Settings = require("../models/settingsModel");

const getSettings = async () => {
  const settings = await Settings.findOne({});
  return settings;
};
module.exports = { getSettings };
