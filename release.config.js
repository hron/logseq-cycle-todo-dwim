var PLUGIN_NAME = 'cycle-todo-dwim'

// eslint-disable-next-line no-undef
module.exports = {
  branches: ['main'],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
      },
    ],
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    [
      '@semantic-release/npm',
      {
        verifyConditions: false,
        npmPublish: false,
      },
    ],
    '@semantic-release/git',
    [
      '@semantic-release/exec',
      {
        prepareCmd:
          `zip -qq -r ${PLUGIN_NAME}-` +
          '${nextRelease.version}.zip dist icon.webp package.json README.md LICENSE',
      },
    ],
    [
      '@semantic-release/github',
      {
        assets: `${PLUGIN_NAME}-*.zip`,
        fail: false,
        failComment: false,
        failTitle: false,
      },
    ],
  ],
}
