/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const classNames = require('classnames');
const path = require('path');
const React = require('react');
const url = require('url');
const Remarkable = require('remarkable');

const Container = require('./Container.js');
const Doc = require('./Doc.js');
const DocsSidebar = require('./DocsSidebar.js');
const OnPageNav = require('./nav/OnPageNav.js');
const Site = require('./Site.js');
const translation = require('../server/translation.js');
const docs = require('../server/docs.js');
const {idx, getGitLastUpdatedTime, getGitLastUpdatedBy} = require('./utils.js');

const MAX_DESCRIPTION = 160; // Max length for HTML description meta tag

function findTextChunks(doc, callback, headings) {
  let heading = 0;

  function processChunks(chunks) {
    const len = chunks.length;
    for (let i = 0; i < len; i++) {
      const c = chunks[i];
      switch (c.type) {
        case 'heading_open':
          heading++;
          break;
        case 'heading_close':
          heading--;
          break;
        case 'text':
        case 'code':
          if (headings || heading === 0) {
            // callback returns true to keep iterating
            if (!callback(c.content)) return false;
          }
          break;
        default:
          break;
      }
      if (c.children) {
        if (!processChunks(c.children)) return false;
      }
    }
    return true; // Keep iterating
  }

  const md = new Remarkable();
  processChunks(md.parse(doc, {}));
}

// component used to generate whole webpage for docs, including sidebar/header/footer
class DocsLayout extends React.Component {
  getRelativeURL = (from, to) => {
    const extension = this.props.config.cleanUrl ? '' : '.html';
    const relativeHref = path
      .relative(`${from}.html`, `${to}.html`)
      .replace('\\', '/')
      .replace(/^\.\.\//, '')
      .replace(/\.html$/, extension);
    return url.resolve(
      `${this.props.config.baseUrl}${this.props.metadata.permalink}`,
      relativeHref,
    );
  };

  getDescription() {
    let desc = this.props.metadata.description || '';
    if (desc) {
      if (desc.length > MAX_DESCRIPTION) {
        console.log(
          `WARNING: meta description longer than maximum of ` +
            `${MAX_DESCRIPTION} characters [` +
            `${this.props.metadata.source || this.props.metadata.id}]`,
        );
      }
      return this.props.metadata.description;
    }

    findTextChunks(this.props.children, text => {
      desc +=
        ' ' +
        text
          .replace(/<!--.*?-->/g, '') // Remove HTML comments
          .replace(/<[a-z/][^>]*>/gi, '') // Remove HTML tags
          .replace(/"/g, ''); // Double quote not legal in description
      desc = desc
        .replace(/\s+/g, ' ') // Replace returns & multiple spaces with one space
        .trim();
      // Return true to keep getting more text
      return desc.length < MAX_DESCRIPTION;
    });

    if (desc.length <= MAX_DESCRIPTION) return desc;

    // Truncate at the last word boundary
    return desc.substr(0, desc.lastIndexOf(' ', MAX_DESCRIPTION));
  }

  render() {
    const metadata = this.props.metadata;
    const content = this.props.children;
    const i18n = translation[metadata.language];
    const id = metadata.localized_id;
    const defaultTitle = metadata.title;
    let DocComponent = Doc;

    if (this.props.Doc) {
      DocComponent = this.props.Doc;
    }
    const filepath = docs.getFilePath(metadata);

    const updateTime = this.props.config.enableUpdateTime
      ? getGitLastUpdatedTime(filepath)
      : null;
    const updateAuthor = this.props.config.enableUpdateBy
      ? getGitLastUpdatedBy(filepath)
      : null;

    const title =
      idx(i18n, ['localized-strings', 'docs', id, 'title']) || defaultTitle;
    const hasOnPageNav = this.props.config.onPageNav === 'separate';

    const previousTitle =
      idx(i18n, [
        'localized-strings',
        'docs',
        metadata.previous_id,
        'sidebar_label',
      ]) ||
      idx(i18n, ['localized-strings', 'docs', metadata.previous_id, 'title']) ||
      idx(i18n, ['localized-strings', 'previous']) ||
      metadata.previous_title ||
      'Previous';
    const nextTitle =
      idx(i18n, [
        'localized-strings',
        'docs',
        metadata.next_id,
        'sidebar_label',
      ]) ||
      idx(i18n, ['localized-strings', 'docs', metadata.next_id, 'title']) ||
      idx(i18n, ['localized-strings', 'next']) ||
      metadata.next_title ||
      'Next';

    return (
      <Site
        config={this.props.config}
        className={classNames('sideNavVisible', {
          separateOnPageNav: hasOnPageNav,
        })}
        title={title}
        description={this.getDescription()}
        language={metadata.language}
        version={metadata.version}
        metadata={metadata}>
        <div className="docMainWrapper wrapper">
          <DocsSidebar
            collapsible={this.props.config.docsSideNavCollapsible}
            metadata={metadata}
          />
          <Container className="mainContainer">
            <DocComponent
              metadata={metadata}
              content={content}
              config={this.props.config}
              source={metadata.source}
              hideTitle={metadata.hide_title}
              title={title}
              version={metadata.version}
              language={metadata.language}
            />
            {(updateTime || updateAuthor) && (
              <div className="docLastUpdate">
                <em>
                  Last updated
                  {updateTime && ` on ${updateTime}`}
                  {updateAuthor && ` by ${updateAuthor}`}
                </em>
              </div>
            )}

            <div className="docs-prevnext">
              {metadata.previous_id && (
                <a
                  className="docs-prev button"
                  href={this.getRelativeURL(
                    metadata.localized_id,
                    metadata.previous_id,
                  )}>
                  <span className="arrow-prev">← </span>
                  <span
                    className={
                      previousTitle.match(/[a-z][A-Z]/) &&
                      'function-name-prevnext'
                    }>
                    {previousTitle}
                  </span>
                </a>
              )}
              {metadata.next_id && (
                <a
                  className="docs-next button"
                  href={this.getRelativeURL(
                    metadata.localized_id,
                    metadata.next_id,
                  )}>
                  <span
                    className={
                      nextTitle.match(/[a-z][A-Z]/) && 'function-name-prevnext'
                    }>
                    {nextTitle}
                  </span>
                  <span className="arrow-next"> →</span>
                </a>
              )}
            </div>
          </Container>
          {hasOnPageNav && (
            <nav className="onPageNav">
              <OnPageNav rawContent={content} />
            </nav>
          )}
        </div>
      </Site>
    );
  }
}
module.exports = DocsLayout;
