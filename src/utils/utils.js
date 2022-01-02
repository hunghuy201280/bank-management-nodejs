import moment from "moment";

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

export { toArray, dateSetter, dateGetter, timeGetter, timeSetter, addDate };
