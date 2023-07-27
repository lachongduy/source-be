const { DefaultCommunity } = require("../constants/Community");
const { getSettings } = require("../db/settings");

const checkEmailVerification = async () => {
  const settings = await getSettings();
  const isEmailVerificationRequired = settings
    ? settings.isEmailVerificationRequired
    : DefaultCommunity.isEmailVerificationRequired;

  return isEmailVerificationRequired;
};

module.exports = { checkEmailVerification };
