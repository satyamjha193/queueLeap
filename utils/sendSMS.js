// utils/sendSMS.js
require("dotenv").config();
const axios = require("axios");

const sendSMS = async (phoneNumber, message) => {
  const authkey = process.env.MSG91_AUTHKEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  const url = "https://control.msg91.com/api/v5/flow/";

  const payload = {
    template_id: templateId,
    sender: process.env.MSG91_SENDER,
    short_url: false,
    mobiles: phoneNumber.startsWith("91") ? phoneNumber : `91${phoneNumber}`,
    VAR1: message, // Match your template variable
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        authkey: authkey,
      },
    });

    console.log("✅ SMS Sent:", response.data);
  } catch (error) {
    console.error("❌ SMS Error:", error.response?.data || error.message);
  }
};

module.exports = sendSMS;
