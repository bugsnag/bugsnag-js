// when functional components are used in JSX tags, rollup doesn't recognise them as actually being used and tree-shakes them away
// this plugin prevents that from happening by explicity telling rollup not to tree-shake the module
function noTreeShakingPlugin(files) {
    return {
        name: 'no-treeshaking-plugin',
        transform(code, id) {
            for (const file of files) {
                if (id.indexOf(file) >= 0) {
                    return { moduleSideEffects: 'no-treeshake' }
                }
            }
        }
    }
}

export default noTreeShakingPlugin
