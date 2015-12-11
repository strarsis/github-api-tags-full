var Promise      = require('bluebird'),
    parseLinks   = require('parse-links'),
    url          = require('url'),
    objectAssign = require('object-assign'),
    arrayFlatten = require('array-flatten');

var getTags = function(pageNo, repoId, github) {
  return github.repos.getTagsAsync(
    objectAssign(repoId, { per_page: 100, page: pageNo }) // max 100 per_page
  );
};

var getTagCommit = function(tag, repoId, github) {
  return getCommit(tag, repoId, github)
  .then(function(commitDetails) {  // commit for tag
    tag.commit = objectAssign(tag.commit, commitDetails.commit); // existing commit contains the sha+url
    return tag;
  });
};

var getCommit = function(tag, repoId, github) {
  return github.repos.getCommitAsync(
    objectAssign(repoId, { sha: tag.commit.sha })
  );
};

githubTags = function(repoId, github) {
  Promise.promisifyAll(github.repos);

  // Current github API (v3) doesn't support sorting tags (e.g. by their creation date).
  return getTags(1, repoId, github)
  .then(function(firstTags) {
    var lastPageUrl = parseLinks(firstTags.meta.link).last;
    var lastPageNo  = url.parse(lastPageUrl, true).query.page;

    var pageNos = [];
    for(var pageNo = 2; pageNo <= lastPageNo; pageNo++) {
      pageNos.push(pageNo);
    }

   // tagPages.push(firstTags); // add own tags (from this 1st lookup)

    return Promise
    .map(pageNos, function(pageNo) { // each page no
      return getTags(pageNo, repoId, github)
      .map(function(tag) { // each tag
         return getTagCommit(tag, repoId, github);
      });
    });

  })
  .then(function(tags) {
    return arrayFlatten.depth(tags, 2);
  });
};

module.exports = githubTags;
