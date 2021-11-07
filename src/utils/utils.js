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
export { toArray, dateSetter, dateGetter };
