const plugins = ['@babel/transform-runtime']

const presets = [
  [
    '@babel/preset-env',

    {
      corejs: {
        proposals: false,
        version: 3
      },

      modules: false,

      targets: {
        browsers: require('./browserlist'),
        node: 'current'
      },

      useBuiltIns: 'usage'
    }
  ],

  '@babel/react'
]

module.exports = {
  plugins,
  presets
}
