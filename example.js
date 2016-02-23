var GitHubApi     = require('github'),
    GithubApiTags = require('./'),
    path          = require('path'),
    ProgressBar   = require('progress');

var repoId = {
  'user': 'golang',
  'repo': 'go'
};

var github = new GitHubApi({
  version: '3.0.0'
});

var githubApiAuth = require('./github-api-auth.json');
if(githubApiAuth) {
  github.authenticate(githubApiAuth);
}

var gat = new GithubApiTags();

var bar = new ProgressBar('Fetching commit :current/:total [:bar] :percent :etas', { total: 100 });

var tagChanged = function() {
  bar.total = this.tagsAll * 2;
  bar.tick();
};
gat.on('tag', tagChanged);
gat.on('tag-commit', tagChanged);

console.log('...');
gat.fetch(repoId, github)
.then(function(tags) {
  console.log('All tags fetched, ready for sorting.');
});
