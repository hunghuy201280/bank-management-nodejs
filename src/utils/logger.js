import chalk from "chalk";
const log = console.log;
function error(message) {
  log(`
    ${chalk.blue.bgRed("--------------------------------")}
    ${chalk.red.bold("Error: ")} ${message} 
    `);
  console.log(message);
}

export { error };
