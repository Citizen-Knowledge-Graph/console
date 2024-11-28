import path from "path"

export default {
    entry: "./bundling.js",
    output: {
        filename: "bundle.js",
        path: path.resolve("public/assets"),
        library: {
            type: "module",
        },
    },
    experiments: {
        outputModule: true,
    },
    mode: "production",
}
