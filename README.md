# github-api-tags-full
Gets all tags with their respective commit for sorting from Github API

API
---
Note that this module has to make one Github API call per tag in order to retrieve the commit details.
You may want to auth (see [github authentication](https://github.com/mikedeboer/node-github#authentication)) to use bigher API rate limits.

Usage
-----
````
npm install github-api-tags-full github
````

This module uses the github module for accessing the github API:
````
var GitHubApi  = require('github'),
    githubTags = require('github-api-tags-full');

var github = new GitHubApi({
  version: '3.0.0'
});

githubTags({ user: 'golang', repo: 'go' }, github)
.then(function(tags) {
  console.log(tags);
});
````

The resulting list of tags with commit can then be used to sort, e.g. by date:
````
npm install github-api-tags-full github moment
````
````
var GitHubApi  = require('github'),
    moment     = require('moment'),
    githubTags = require('github-api-tags-full');

var github = new GitHubApi({
  version: '3.0.0'
});

githubTags({ user: 'golang', repo: 'go' }, github)
.then(function(tags) {
  var tagsSorted = tags.sort(byAuthorDateAsc).reverse();
  console.log(tagsSorted);
});

var byAuthorDateAsc = function(tagA, tagB) {
  return githubCompareDates(
    tagA.commit.author.date,
    tagB.commit.author.date
  );
};
var githubCompareDates = function(dateStrA, dateStrB) {
  return moment(dateStrA).diff(dateStrB);
};
````
