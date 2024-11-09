const path = require("path")

module.exports = {
    entry: "./bundling.js",
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "public/assets"),
    },
    mode: "production",
};
