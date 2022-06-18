export const tsconfigExpo = {
    "extends": "expo/tsconfig.base",
    "compilerOptions": {
        "jsx": "react",
        "strict": true
    }
}

export const tsconfigBare = {
    "compilerOptions": {
        "target": "esnext",
        "lib": [
            "es2017"
        ],
        "jsx": "react-native",
        "module": "commonjs",
        "moduleResolution": "node",
        "resolveJsonModule": true,
        "allowJs": true,
        "noEmit": true,
        "isolatedModules": true,
        "allowSyntheticDefaultImports": true,
        "esModuleInterop": true,
        "forceConsistentCasingInFileNames": true,
        "strict": true,
        "skipLibCheck": true
    },
    "exclude": [
        "node_modules",
        "babel.config.js",
        "metro.config.js",
        "jest.config.js"
    ]
}