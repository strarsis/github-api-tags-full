var GitHubApi     = require('github'),
    GithubApiTags = require('./'),
    path          = require('path'),
    ProgressBar   = require('progress'),
    moment        = require('moment');

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

var bar = new ProgressBar('Fetching tag/commit :current/:total [:bar] :percent :etas', { total: 100 });

var tagChanged = function() {
  bar.total = this.tagsAll * 2;
  bar.tick();
};
gat.on('tag', tagChanged);
gat.on('tag-commit', tagChanged);


var byAuthorDateAsc = function(tagA, tagB) {
  return githubCompareDates(
    tagA.commit.author.date,
    tagB.commit.author.date
  );
};
var githubCompareDates = function(dateStrA, dateStrB) {
  return moment(dateStrA).diff(dateStrB);
};

console.log('...');
gat.fetch(repoId, github)
.then(function(tags) {
  var tagsSortedDateDesc = tags.sort(byAuthorDateAsc).reverse();

  console.log('Tags sorted:');
  console.log(tagsSortedDateDesc);
});
