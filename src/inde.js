// Import modules
import fs from "fs/promises";
import chalk from "chalk";
import { program } from "commander";
import fullName from "fullname";
import { username } from "username";
import placeholders from "./placeholders.js";
import commentator from "@captainsafia/commentator";
import path from "node:path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const packageInfo = require("../package.json");

// Define constants
const log = console.log;

const currentModuleURL = new URL(import.meta.url);
const licensesPath = path.resolve(
  path.dirname(currentModuleURL.pathname),
  "../licenses",
);

// Define functions
async function validateLicense(license) {
  license = license.toLowerCase();
  const licenses = await fs.readdir(licensesPath);
  return licenses.indexOf(license) > -1;
}

// Define commands
program.version(packageInfo.version);

program
  .command("list")
  .alias("l")
  .description("List all available licenses")
  .action(async function () {
    try {
      const items = await fs.readdir(licensesPath);
      items.forEach((item) => log(chalk.cyan.italic(item)));
    } catch (error) {
      log(chalk.bold.red(error));
    }
  });

program
  .command("put <license>")
  .alias("p")
  .option("-f --file [file]", "The file to add a header to")
  .option("-u --user [user]", "The user/organization who holds the license")
  .option("-y --year [year]", "The year the license is in effect")
  .description("Put a license in this directory")
  .action(async function (licenseArg) {
    const fileArg = this.file;
    const yearArg = this.year || new Date().getFullYear();
    const userArg = this.user || (await fullName()) || username.sync();

    const user = placeholders[licenseArg]["user"];
    const year = placeholders[licenseArg]["year"];

    const cwd = process.cwd();

    if (!validateLicense(licenseArg)) {
      return console.log(
        "Please choose one of the licenses under `legit list`!",
      );
    }

    if (fileArg) {
      const headerFile = path.join(
        __dirname,
        "/../licenses/headers/",
        licenseArg,
      );
      const fileExtension = fileArg.split(".").pop();
      if (!fs.existsSync(headerFile)) {
        return console.log("Header not available for", licenseArg, "license!");
      }

      try {
        const data = await fs.readFile(headerFile, "utf8");
        let result;

        try {
          result = commentator.makeBlockComment(
            data.replace(user, userArg).replace(year, yearArg),
            fileExtension,
          );
        } catch (error) {
          if (error.message.includes("Block comment")) {
            try {
              result = commentator.makeInlineComment(
                data.replace(user, userArg).replace(year, yearArg),
                fileExtension,
              );
            } catch (error) {
              if (error.message.includes("Inline comment")) {
                return console.log(
                  "@captainsafia/commentator doesn't support block comments",
                  "for files with this extension, please open an issue at https://github.com/captainsafia/commentator/issues",
                  "to add support for this programming language.",
                );
              }
            }
          }
        }

        const filePath = path.join(cwd, "/", fileArg);

        try {
          const data = await fs.readFile(filePath, "utf8");
          const newData = `${result}\n${data}`;
          await fs.writeFile(filePath, newData, "utf8");
        } catch (error) {
          log(chalk.red(error));
        }
      } catch (error) {
        log(chalk.red(error));
      }
    } else {
      const licenseFile = path.join(licensesPath, licenseArg);
      try {
        const data = await fs.readFile(licenseFile, "utf8");
        let result;
        if (placeholders[licenseArg]) {
          result = data.replace(user, userArg).replace(year, yearArg);
        }
        await fs.writeFile(path.join(cwd, "/LICENSE"), result || data, "utf8");
      } catch (error) {
        log(chalk.red(error));
      }
    }
  });

program.parse(process.argv);

if (!program.args.length) {
  program.help();
}
