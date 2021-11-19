import chalk from "chalk";
const log = console.log;
function error(message) {
  log(`
    ${chalk.blue.bgRed("--------------------------------")}
    ${chalk.red.bold("Error: ")} ${message} 
    `);
  console.log(message);
}
function print(message) {
  log(`
    ${chalk.blue.bgGreen("--------------------------------")}
   ${message} 
    `);
  console.log(message);
}

export { error, print };
