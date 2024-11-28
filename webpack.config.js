import path from "path"
import CopyWebpackPlugin from "copy-webpack-plugin"

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
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve("node_modules/drawflow/dist/drawflow.min.css"),
                    to: path.resolve("public/assets"),
                },
                {
                    from: path.resolve("node_modules/codemirror/lib/codemirror.css"),
                    to: path.resolve("public/assets"),
                },
            ],
        }),
    ],
}
