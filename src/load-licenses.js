import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const ENDPOINT = "https://api.github.com";
const options = {
  headers: {
    Accept: "application/vnd.github.drax-preview+json",
  },
};

const __dirname = path.dirname(new URL(import.meta.url).pathname);

fetch(ENDPOINT + "/licenses", options)
  .then(
    function (response) {
      return response.json();
    },
    function (error) {
      return console.log(error);
    },
  )
  .then(function (licenses) {
    licenses.forEach(function (license) {
      fetch(ENDPOINT + "/licenses/" + license.key, options)
        .then(
          function (response) {
            return response.json();
          },
          function (error) {
            return console.log(error);
          },
        )
        .then(function (license) {
          fs.writeFile(
            __dirname + "/../licenses/" + license.key,
            license.body,
            function (error) {
              if (error) console.log(error);
            },
          );
        });
    });
  });
