// Central icon re-exports.
//
// mdi-material-ui's top-level per-icon files (`mdi-material-ui/WeatherNight`)
// are CommonJS with `exports.__esModule = true`. Vite 8's dependency optimizer
// (Rolldown) does not unwrap that default correctly, so `import Icon from
// 'mdi-material-ui/WeatherNight'` yields the module namespace object and React
// throws "Element type is invalid ... got: object".
//
// The package also ships a parallel pure-ESM build under `esm/` (it's the
// package's `module` entry). Importing the per-icon files from there sidesteps
// the CJS interop entirely. Add every icon the app uses here, from `esm/`.
export { default as ThemeLightDark } from 'mdi-material-ui/esm/ThemeLightDark'
export { default as WeatherNight } from 'mdi-material-ui/esm/WeatherNight'
export { default as WhiteBalanceSunny } from 'mdi-material-ui/esm/WhiteBalanceSunny'
export { default as ArrowUp } from 'mdi-material-ui/esm/ArrowUp'
export { default as ArrowDown } from 'mdi-material-ui/esm/ArrowDown'
export { default as Minus } from 'mdi-material-ui/esm/Minus'
export { default as Plus } from 'mdi-material-ui/esm/Plus'
