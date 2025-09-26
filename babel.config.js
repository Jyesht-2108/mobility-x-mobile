module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@/components': './components',
            '@/screens': './screens',
            '@/store': './store',
            '@/services': './services',
            '@/utils': './utils',
            '@/types': './types',
          },
          extensions: ['.ts', '.tsx', '.js', '.jsx']
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};


