const {configureEslint} = require('@jneander/dev-lint')

module.exports = configureEslint({
  browser: true,
  react: true,
})

module.exports.overrides.push({
  env: {
    node: true,
  },

  files: ['./config/**/*.js', './scripts/**/*.js'],
})
