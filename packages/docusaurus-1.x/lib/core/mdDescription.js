/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const Remarkable = require('remarkable');

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

function mdDescription(metadata, mdContent) {
  let desc = metadata.description || '';

  if (desc) {
    if (desc.length > MAX_DESCRIPTION) {
      const source = metadata.path || metadata.source || metadata.id;
      console.log(
        `WARNING: meta description longer than maximum of ` +
          `${MAX_DESCRIPTION} characters [${source}]`,
      );
    }
    return desc;
  }

  findTextChunks(mdContent, text => {
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
module.exports = mdDescription;
