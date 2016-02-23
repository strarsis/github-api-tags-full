var Promise      = require('bluebird'),
    parseLinks   = require('parse-links'),
    url          = require('url'),
    objectAssign = require('object-assign'),
    arrayFlatten = require('array-flatten'),
    util         = require('util'),
    EventEmitter = require('events').EventEmitter;

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

var GithubTags  = function() {
  this.self     = this;
  this.tagsAll        = 0;
  this.tagsDone       = 0;
  this.tagCommitsDone = 0;
};

GithubTags.prototype.fetch = function(repoId, github) {

  Promise.promisifyAll(github.repos);

  var self = this.self;

  // Current github API (v3) doesn't support sorting tags (e.g. by their creation date).
  return getTags(1, repoId, github)
  .then(function(firstTags) {

    self.tagsAll   += firstTags.length;
    self.emit('page', 1);

    var lastPageUrl = parseLinks(firstTags.meta.link).last;
    var lastPageNo  = url.parse(lastPageUrl, true).query.page;

    var pageNos     = [];
    for(var pageNo  = 2; pageNo <= lastPageNo; pageNo++) {
      pageNos.push(pageNo);
    }

    return Promise
    .map(pageNos, function(pageNo) { // each page no
      return getTags(pageNo, repoId, github)
      .then(function(tags) {
        self.tagsAll  += tags.length;
        self.emit('page', pageNo);
        return tags;
      })
      .map(function(tag) {
        self.tagsDone += 1;
        self.emit('tag', tag);
        return getTagCommit(tag, repoId, github)
        .then(function(tagCommit) {
          self.tagCommitsDone += 1;
          self.emit('tag-commit', tagCommit);
        });
      });
    })

    .then(function(tagCommits) {
      // Also add the tags from the 1st page
      return Promise
      .map(firstTags, function(tag) {
        self.tagsDone += 1;
        self.emit('tag', tag);
        return getTagCommit(tag, repoId, github)
        .then(function(tagCommit) {
          self.tagCommitsDone += 1;
          self.emit('tag-commit', tagCommit);
          return tagCommit;
        });
      })
      .then(function(firstTagCommits) {
        return tagCommits.concat(firstTagCommits);
      });

    });

  })
  .then(function(tags) {
    return arrayFlatten.depth(tags, 2);
  });
};

util.inherits(GithubTags, EventEmitter);

module.exports = GithubTags;
