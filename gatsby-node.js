'use strict'

const createDebug = require('debug')

exports.onCreateWebpackConfig = ({
  config,
  stage,
  actions,
  plugins,
  getConfig,
}) => {
  const debug = createDebug(`gatsby-plugin-production:${stage}`)
  if (process.env.NODE_ENV !== 'production') {
    debug(`process.env.NODE_ENV = ${process.env.NODE_ENV}`)
    return config
  }

  const webpackConfig = getConfig()

  debug('before: %o', webpackConfig)

  webpackConfig.devtool = 'hidden-source-map'
  webpackConfig.mode = 'production'
  webpackConfig.module.rules
    .map(rule => {
      if (rule.use) {
        rule.use
          .filter(
            x =>
              x.loader.indexOf('/file-loader/') > -1 ||
              x.loader.indexOf('/url-loader/') > -1,
          )
          .forEach(loader => {
            // eslint-disable-next-line no-param-reassign
            loader.options.name = loader.options.name.replace(
              '[name]-[hash].[ext]',
              '[hash].[ext]',
            )
          })
      }
      return rule
    })
    .filter(x => x.oneOf)
    .forEach(rule => {
      rule.oneOf
        .map(o => o.use.find(x => x.loader.indexOf('/css-loader/') > -1))
        .filter(x => x)
        .forEach(cssLoader => {
          // eslint-disable-next-line no-param-reassign
          cssLoader.options.localIdentName = '[hash:base64:5]'
        })
    })
  webpackConfig.output.chunkFilename = '[id].js'

  switch (stage) {
    case 'build-html': {
      webpackConfig.optimization = {
        namedModules: false,
        namedChunks: false,
        nodeEnv: 'production',
        flagIncludedChunks: true,
        occurrenceOrder: true,
        sideEffects: false,
        usedExports: true,
        concatenateModules: true,
        splitChunks: {
          hidePathInfo: true,
          minSize: 30000,
          maxAsyncRequests: 5,
          maxInitialRequests: 3,
        },
        noEmitOnErrors: true,
        checkWasmTypes: true,
        minimize: true,
      }
      break
    }
    case 'build-javascript': {
      webpackConfig.output.filename = '[chunkhash:16].js'
      const miniCssExtractPlugin = plugins.extractText({
        filename: '[contenthash].css',
        chunkFilename: '[id].css',
      })
      webpackConfig.plugins = [
        ...webpackConfig.plugins.filter(
          plugin => plugin.constructor !== miniCssExtractPlugin.constructor,
        ),
        miniCssExtractPlugin,
      ]
      break
    }
    default:
  }

  actions.replaceWebpackConfig(webpackConfig)

  debug('after: %o', webpackConfig)

  return config
}
