import typescript from '@rollup/plugin-typescript'
import replace from '@rollup/plugin-replace'
import fs from 'fs'

const packageJson = JSON.parse(fs.readFileSync(`${process.cwd()}/package.json`))

export default {
    input: "src/koa.ts",
    output: [
        {
            dir: 'dist',
            generatedCode: {
                preset: 'es2015',
            },
            entryFileNames: '[name].js',
            format: 'cjs'
        },
        {
            dir: 'dist',
            generatedCode: {
                preset: 'es2015',
            },
            entryFileNames: '[name].mjs',
            format: 'esm'
        }
    ],
    external: ["koa", "async_hooks", "http", "net", "@bugsnag/core"],
    plugins: [
        replace({
            preventAssignment: true,
            values: {
                __VERSION__: packageJson.version,
            }
        }),
        typescript({
            removeComments: true,
            noEmitOnError: true,
            compilerOptions: {
                target: "es2017", // Preserve async/await for Koa compatibility
                module: "es2015",
                moduleResolution: "bundler",
                lib: ["es2017"],
                allowJs: true,
                strict: true,
                esModuleInterop: true,
                declaration: true,
                declarationMap: true,
                declarationDir: 'dist/types',
            }
        })
    ]
}