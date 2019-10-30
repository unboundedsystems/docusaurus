/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const classNames = require('classnames');
const React = require('react');

const BlogPost = require('./BlogPost.js');
const BlogSidebar = require('./BlogSidebar.js');
const Container = require('./Container.js');
const mdDescription = require('./mdDescription');
const Site = require('./Site.js');
const OnPageNav = require('./nav/OnPageNav.js');
const utils = require('./utils.js');

function BlogCommentSystem({config}) {
  if (!config.commentSystem || !config.commentSystem.blog) return null;
  if (config.commentSystem.type === 'commento') {
    return (
      <div className="commentSection">
        <div id="commento" />
        <script src="https://cdn.commento.io/js/commento.js" />
      </div>
    );
  }
  return null;
}

// used for entire blog posts, i.e., each written blog article with sidebar with site header/footer
class BlogPostLayout extends React.Component {
  getDescription() {
    return mdDescription(this.props.metadata, this.props.children);
  }

  renderSocialButtons() {
    const post = this.props.metadata;
    post.path = utils.getPath(post.path, this.props.config.cleanUrl);

    const fbComment = this.props.config.facebookAppId &&
      this.props.config.facebookComments && (
        <div className="blogSocialSectionItem">
          {/* Facebook SDK require 'fb-comments' class */}
          <div
            className="fb-comments"
            data-href={`${this.props.config.url +
              this.props.config.baseUrl}blog/${post.path}`}
            data-width="100%"
            data-numposts="5"
            data-order-by="time"
          />
        </div>
      );

    const fbLike = this.props.config.facebookAppId && (
      <div className="blogSocialSectionItem">
        {/* Facebook SDK require 'fb-like' class */}
        <div
          className="fb-like"
          data-href={`${this.props.config.url +
            this.props.config.baseUrl}blog/${post.path}`}
          data-layout="standard"
          data-share="true"
          data-width="225"
          data-show-faces="false"
        />
      </div>
    );

    const twitterShare = this.props.config.twitter && (
      <div className="blogSocialSectionItem">
        <a
          href="https://twitter.com/share"
          className="twitter-share-button"
          data-text={post.title}
          data-url={`${this.props.config.url + this.props.config.baseUrl}blog/${
            post.path
          }`}
          data-related={this.props.config.twitterUsername}
          data-size="large"
          data-via={post.authorTwitter}
          data-show-count="false">
          Tweet
        </a>
      </div>
    );

    return (
      <div className="blogSocialSection">
        {twitterShare}
        {fbLike}
        {fbComment}
      </div>
    );
  }

  render() {
    const hasOnPageNav = this.props.config.onPageNav === 'separate';
    const post = this.props.metadata;
    post.path = utils.getPath(post.path, this.props.config.cleanUrl);
    const blogSidebarTitleConfig = this.props.config.blogSidebarTitle || {};
    return (
      <Site
        className={classNames('sideNavVisible', {
          separateOnPageNav: hasOnPageNav,
        })}
        url={`blog/${post.path}`}
        title={this.props.metadata.title}
        language="en"
        description={this.getDescription()}
        config={this.props.config}
        authorTwitter={post.authorTwitter}
        image={post.image}
        metadata={{blog: true}}>
        <div className="docMainWrapper wrapper">
          <BlogSidebar
            language="en"
            current={post}
            config={this.props.config}
          />
          <Container className="mainContainer postContainer blogContainer">
            <div className="lonePost">
              <BlogPost
                post={post}
                content={this.props.children}
                language="en"
                config={this.props.config}
              />
              {this.renderSocialButtons()}
            </div>
            <div className="blog-recent">
              <a className="button" href={`${this.props.config.baseUrl}blog`}>
                {blogSidebarTitleConfig.default || 'Recent Posts'}
              </a>
            </div>
            <BlogCommentSystem config={this.props.config} />
          </Container>
          {hasOnPageNav && (
            <nav className="onPageNav">
              <OnPageNav rawContent={this.props.children} />
            </nav>
          )}
        </div>
      </Site>
    );
  }
}

module.exports = BlogPostLayout;
