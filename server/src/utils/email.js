const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendPaymentSuccessEmail = async (to, ticketData) => {
  const { passengerName, from, toLocation, date, time, seat, busNo, amount, transactionId } = ticketData;

  const htmlContent = `
    <div style="font-family:Poppins,Arial,sans-serif;line-height:1.5;color:#333;">
      <h2 style="color:#007bff;">🚌 GoBus – Payment Confirmation</h2>
      <p>Dear <b>${passengerName}</b>,</p>
      <p>Your payment was successful! Here are your booking details:</p>
      <table style="border-collapse:collapse;">
        <tr><td><b>Route:</b></td><td>${from} → ${toLocation}</td></tr>
        <tr><td><b>Date:</b></td><td>${date}</td></tr>
        <tr><td><b>Departure Time:</b></td><td>${time}</td></tr>
        <tr><td><b>Seat:</b></td><td>${seat}</td></tr>
        <tr><td><b>Bus No:</b></td><td>${busNo}</td></tr>
        <tr><td><b>Amount Paid:</b></td><td>LKR ${amount}</td></tr>
        <tr><td><b>Transaction ID:</b></td><td>${transactionId}</td></tr>
      </table>
      <p>Show your e-ticket QR code at boarding time. Have a safe journey!</p>
      <hr>
      <small>GoBus Lanka (Pvt) Ltd – Automated message. Do not reply.</small>
    </div>
  `;

  await transporter.sendMail({
    from: `"GoBus Lanka" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Payment Successful - Your GoBus Ticket Confirmation",
    html: htmlContent,
  });
};
