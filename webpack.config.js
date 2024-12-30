import path from "path"
import CopyWebpackPlugin from "copy-webpack-plugin"

export default {
    entry: "./bundling.js",
    output: {
        filename: "bundle.js",
        path: path.resolve("src/assets"),
        library: {
            type: "module",
        },
    },
    experiments: {
        outputModule: true,
    },
    mode: "production",
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve("node_modules/drawflow/dist/drawflow.min.css"),
                    to: path.resolve("src/assets"),
                },
                {
                    from: path.resolve("node_modules/codemirror/lib/codemirror.css"),
                    to: path.resolve("src/assets"),
                },
                {
                    from: path.resolve("node_modules/@ulb-darmstadt/shacl-form/dist/form-default.js"),
                    to: path.resolve("src/assets"),
                },
            ],
        }),
    ],
}
