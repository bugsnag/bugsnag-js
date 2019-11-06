module.exports = api => {
  if (api) api.cache(false)
  const presets = []
  const plugins = [
    ['@babel/plugin-transform-arrow-functions'],
    ['@babel/plugin-transform-block-scoping'],
    ['@babel/plugin-transform-classes', { loose: true }],
    ['@babel/plugin-transform-computed-properties', { loose: true }],
    ['@babel/plugin-transform-destructuring', { loose: true }],
    ['@babel/plugin-transform-member-expression-literals'],
    ['@babel/plugin-transform-property-literals'],
    ['@babel/plugin-transform-parameters', { loose: true }],
    ['@babel/plugin-transform-shorthand-properties'],
    ['@babel/plugin-transform-spread', { loose: true }],
    ['@babel/plugin-transform-template-literals', { loose: true }],
    ['@babel/plugin-proposal-object-rest-spread', { loose: true }],
    ['@babel/syntax-object-rest-spread']
  ]
  return { presets, plugins }
}
