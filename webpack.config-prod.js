import Path from "path";
import Webpack from "webpack";

// CONFIG ==========================================================================================
export default {
  // Compilation target http://webpack.github.io/docs/configuration.html#target
  target: "web",

  // Entry files http://webpack.github.io/docs/configuration.html#entry
  entry: {
    "src": "./src/scripts/app",
  },

  // Output files http://webpack.github.io/docs/configuration.html#output
  output: {
    // Abs. path to output directory http://webpack.github.io/docs/configuration.html#output-path
    path: __dirname,

    // Filename of an entry chunk http://webpack.github.io/docs/configuration.html#output-filename
    filename: "[name]/public/bundle.js",

    // Web path (used to prefix URLs) http://webpack.github.io/docs/configuration.html#output-publicpath
    publicPath: "/public/",
  },

  // Module http://webpack.github.io/docs/configuration.html#module
  module: {
    loaders: [ // http://webpack.github.io/docs/loaders.html
      // JS
      {test: /\.js$/, loaders: ["babel?stage=0", "jsx-webpack?ignoreDocblock&jsx=Cycle.h&docblockUnknownTags"], exclude: /node_modules/},
    ],
  },

  // Module resolving http://webpack.github.io/docs/configuration.html#resolve
  resolve: {
    // node_modules and like that
    modulesDirectories: ["web_modules", "node_modules"],
  },

  // Loader resolving http://webpack.github.io/docs/configuration.html#resolveloader
  resolveLoader: {
    // Abs. path with loaders
    root: Path.join(__dirname, "/node_modules"),

    alias: {},
  },

  // Plugins http://webpack.github.io/docs/list-of-plugins.html
  plugins: [
    new Webpack.IgnorePlugin(/^vertx$/),
    new Webpack.NoErrorsPlugin(),
  ],
};

//let jsxOptions = {
//  //ignoreDocblock: true,
//  //passUnknownTagsToFactory: true,
//  //unknownTagsAsString: true,
//  factory: "Cycle.h", // Cycle.h
//  //renameAttrs: {
//  //  "for": "htmlFor",
//  //  "class": "className",
//  //}
//};
