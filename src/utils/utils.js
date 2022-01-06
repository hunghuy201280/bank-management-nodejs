import moment from "moment";
import sgMail from "@sendgrid/mail";

function toArray(obj) {
  return Object.keys(obj).map(function (key) {
    return obj[key];
  });
}

function dateSetter(date) {
  const fm = moment(date, "DD/MM/YYYY");
  return fm.toDate();
}

function dateGetter(date) {
  return moment(date).format("DD/MM/YYYY");
}

function timeSetter(time) {
  const fm = moment(time, "HH:mm:ss DD/MM/YYYY");
  return fm.toDate();
}

function timeGetter(time) {
  return moment(time).format("HH:mm:ss DD/MM/YYYY");
}

function addDate(date, amount) {
  const fm = moment(date, "HH:mm:ss DD/MM/YYYY");
  fm.add(amount, "days");
  return fm.toDate();
}
function randomIn(from, to) {
  return Math.floor(Math.random() * (to + 1) + from);
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function sendMail(pdf, loanContract) {
  const msg = {
    to: loanContract.loanProfile.customer.email,
    from: "humghuy201280@gmail.com",
    subject: `Your digital Loan Contract from ${timeGetter(
      loanContract.createdAt
    )}`,
    text: `Thank you for using our services\nYou've signed a contract successfully!\nContract number: ${loanContract.contractNumber}\nContract value: ${loanContract.loanProfile.moneyToLoan} USD`,
    attachments: [
      {
        content: pdf.data,
        filename: pdf.filename,
        type: "application/pdf",
        disposition: "attachment",
      },
    ],
  };
  sgMail.send(msg).catch((err) => {
    console.log(err);
  });
}

export {
  toArray,
  dateSetter,
  dateGetter,
  timeGetter,
  timeSetter,
  addDate,
  sendMail,
  randomIn,
};
