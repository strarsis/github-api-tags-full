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
  )
  .then(function(tags) {
    return {
      no:   pageNo,
      tags: tags
    };
  });
};

var getTagWithCommit = function(tag, repoId, github) {
  return getCommit(tag, repoId, github)
  .then(function(commitDetails) {  // commit (details) for tag
    tag.commit = objectAssign(tag.commit, commitDetails.commit); // existing commit contains the sha+url
    return tag;
  });
};

var getCommit = function(tag, repoId, github) {
  return github.repos.getCommitAsync(
    objectAssign(repoId, { sha: tag.commit.sha })
  );
};

var GithubTags   = function() {
  this.tagsAll   = 0;
  this.tagsDone  = 0;
  this.pagesAll  = 0;
  this.pagesDone = 0;
};

var getLastPageNo = function(page) {
  var lastPageUrl;
  var lastPageNo = page.no;
  if (typeof(page.tags.meta.link) !== 'undefined') { // in case this is the only page and no further pages
    lastPageUrl = parseLinks(page.tags.meta.link).last;
    lastPageNo  = url.parse(lastPageUrl, true).query.page;
  }
  
  return lastPageNo;
};

GithubTags.prototype.fetch = function(repoId, github) {

  Promise.promisifyAll(github.repos);

  // Current github API (v3) doesn't support sorting tags (e.g. by their creation date).
  return getTags(1, repoId, github).bind(this)
  .then(function(firstPage) {
    var lastPageNo = getLastPageNo(firstPage);
    this.pagesAll  = lastPageNo;

    var restPages  = [];
    for(pageNo     = 2; pageNo <= lastPageNo; pageNo++) {
      restPages.push(  getTags(pageNo, repoId, github)  );
    }

    var allPages   = restPages;
    allPages.push(Promise.resolve(firstPage));

    return Promise.map(allPages, function(page) {
      var tags        =  page.tags;
      this.tagsAll   +=  tags.length;

      this.pagesDone += 1;
      this.emit('page', page.no);

      return Promise.each(tags, function(tag) {
        return getTagWithCommit(tag, repoId, github)
        .then(function(tagWithCommit) {
          this.tagsDone += 1;
          this.emit('tag', tagWithCommit);
        }.bind(this));
      }.bind(this));

    }.bind(this))

  })
  .then(cleanTagsArray);
};

var cleanTagsArray = function(arrTags) {
  return arrayFlatten.depth(arrTags, 2);
};


util.inherits(GithubTags, EventEmitter);

module.exports = GithubTags;
