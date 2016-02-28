var GitHubApi     = require('github'),
    GithubApiTags = require('./'),
    ProgressBar   = require('progress'),
    moment        = require('moment'),
    Replay        = require('replay');

var repoId = {
  'user': 'golang',
  'repo': 'go'
};

var github = new GitHubApi({
  version: '3.0.0'
});

var githubApiAuth = require('./config/github-api-auth.json');
if(githubApiAuth) {
  github.authenticate(githubApiAuth);
}

var gat = new GithubApiTags();

var bar = new ProgressBar('Fetching full tag :current/:total [:bar] :percent :etas', { total: 100 });
var pageFetched = function() {
  bar.total = this.tagsAll;
};
var tagFetched = function() {
  bar.tick();
};
gat.on('page', pageFetched);
gat.on('tag',  tagFetched);


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

  console.log('Tags sorted.');
  console.log('Latest tag: ');
  console.log(tagsSortedDateDesc[0]);
});
