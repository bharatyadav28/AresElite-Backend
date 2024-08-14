const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const util = require("util");

dotenv.config({
  path: "src/config/mail.env",
});

const resetPasswordCode = async (email, name, code) => {
  try {
    const smtpTransport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const options = {
      from: process.env.EMAIL,
      to: email,
      subject: "Ares-Elite Password Reset Code",
      html: `<div
            class="container"
            style="font-family: 'Roboto', sans-serif; margin: 0 auto"
          >
            <div class="head" style="display: flex; justify-content: center">
              <h2 style="margin: 0px 10px;padding: 10px;padding-top: 5px">
                Code for Resetting Your Ares-Elite Password
              </h2>
            </div>
            <div
              class="row"
              style="
                    padding: 1rem 0;
                    border-top: 1px solid #e5e5e5;
                    border-bottom: 1px solid #e5e5e5;
                    padding-top: 0;
                  "
            >
              <div class="col-12" style="text-align: center">
                <img
                  src="https://media.istockphoto.com/id/1338629648/vector/mail-approved-vector-flat-conceptual-icon-style-illustration-eps-10-file.jpg?s=612x612&w=0&k=20&c=o6AcZk3hB6ShxOzmssuOcsfh0QYEQVJ0nCuEZZj1_nQ="
                  alt="img"
                  style="width: 200px;box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;margin: 5px"
                />
                <p style="font-weight: bold; padding: 0; margin: 0">
                  Hey ${name}, You have requested for resetting your password.
                </p>
                <p style="padding: 0; margin: 0">
                  Here is your code for resetting your password. Please enter this code to reset your password:
                </p>
                <p style="font-weight: bold;font-size: 1.5rem;padding: 0; margin: 0;color: #35B0FC;">
                  ${code}
                </p>
                <p style="padding: 5px; margin: 0">
                  If you haven't requested this mail, then please contact us on our helpline number <span style="font-weight: bold">+91-1234567890</span>.
                </p>
                <p
                  style="
                        padding:5px;
                        padding-bottom: 0;
                        margin: 0;
                        color: #949090;
                        font-size: 0.8rem;
                      "
                >
                  Regards, Team <span style="color: #35B0FC">Ares-Elite</span>
                </p>
              </div>
            </div>
          </div>`
    };

    const sendMailPromise = util.promisify(smtpTransport.sendMail.bind(smtpTransport));
    await sendMailPromise(options);

    // Close the transport after sending the email
    smtpTransport.close();
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // Re-throw the error for the calling code to handle
  }
};

const newAccount = async (email, name, code) => {
  try {
    const smtpTransport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const options = {
      from: process.env.EMAIL,
      to: email,
      subject: "Welcome to Ares-Elite",
      html: `<div
            class="container"
            style="font-family: 'Roboto', sans-serif; margin: 0 auto"
          >
            <div class="head" style="display: flex; justify-content: center">
              <h2 style="margin: 0px 10px;padding: 10px;padding-top: 5px">
              We are here to onboard you on Ares-Elite
              </h2>
            </div>
            <div
              class="row"
              style="
                    padding: 1rem 0;
                    border-top: 1px solid #e5e5e5;
                    border-bottom: 1px solid #e5e5e5;
                    padding-top: 0;
                  "
            >
              <div class="col-12" style="text-align: center">
                <img
                  src="https://media.istockphoto.com/id/1338629648/vector/mail-approved-vector-flat-conceptual-icon-style-illustration-eps-10-file.jpg?s=612x612&w=0&k=20&c=o6AcZk3hB6ShxOzmssuOcsfh0QYEQVJ0nCuEZZj1_nQ="
                  alt="img"
                  style="width: 200px;box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;margin: 5px"
                />
                <p style="font-weight: bold; padding: 0; margin: 0">
                  Hey ${name}, We have created your account.
                </p>
                <p style="padding: 0; margin: 0">
                  Here is your password for Login, Please do reset your password this is a <em>Temporary Password</em>
                </p>
                <p style="font-weight: bold;font-size: 1.5rem;padding: 0; margin: 0;color: #35B0FC;">
                  ${code}
                </p>
                <p style="padding: 5px; margin: 0">
                  If you haven't requested this mail, then please contact us on our helpline number <span style="font-weight: bold">+91-1234567890</span>.
                </p>
                <p
                  style="
                        padding:5px;
                        padding-bottom: 0;
                        margin: 0;
                        color: #949090;
                        font-size: 0.8rem;
                      "
                >
                  Regards, Team <span style="color: #35B0FC">Ares-Elite</span>
                </p>
              </div>
            </div>
          </div>`
    };

    const sendMailPromise = util.promisify(smtpTransport.sendMail.bind(smtpTransport));
    await sendMailPromise(options);

    // Close the transport after sending the email
    smtpTransport.close();
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // Re-throw the error for the calling code to handle
  }
};

module.exports = { resetPasswordCode, newAccount };
