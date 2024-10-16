import createRollupConfig from '../../.rollup/index.mjs'

export default createRollupConfig({
    input: 'src/app-duration.ts',
    output: [
        {
            dir: `dist`,
            entryFileNames: '[name].js',
            format: 'cjs',
            preserveModules: true,
            generatedCode: {
              preset: 'es2015',
            }
        },
        {
            dir: `dist`,
            entryFileNames: '[name].mjs',
            format: 'esm',
            preserveModules: true,
            generatedCode: {
                preset: 'es2015',
            }
        }
    ]
})
