/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {loadRoutes, RouteConfig} from '../routes';

describe('loadRoutes', () => {
  test('nested route config', async () => {
    const nestedRouteConfig: RouteConfig = {
      component: '@theme/DocPage',
      path: '/docs',
      modules: {
        docsMetadata: 'docs-b5f.json',
      },
      routes: [
        {
          path: '/docs/hello',
          component: '@theme/DocItem',
          exact: true,
          modules: {
            content: 'docs/hello.md',
            metadata: 'docs-hello-da2.json',
          },
        },
        {
          path: 'docs/foo/baz',
          component: '@theme/DocItem',
          modules: {
            content: 'docs/foo/baz.md',
            metadata: 'docs-foo-baz-dd9.json',
          },
        },
      ],
    };
    const result = await loadRoutes([nestedRouteConfig]);
    expect(result).toMatchSnapshot();
  });

  test('flat route config', async () => {
    const flatRouteConfig: RouteConfig = {
      path: '/blog',
      component: '@theme/BlogListPage',
      exact: true,
      modules: {
        items: [
          {
            content: {
              __import: true,
              path: 'blog/2018-12-14-Happy-First-Birthday-Slash.md',
              query: {
                truncated: true,
              },
            },
            metadata: 'blog-2018-12-14-happy-first-birthday-slash-d2c.json',
          },
          {
            content: 'blog/2018-12-14-Happy-First-Birthday-Slash.md',
            metadata: null,
          },
        ],
      },
    };
    const result = await loadRoutes([flatRouteConfig]);
    expect(result).toMatchSnapshot();
  });

  test('invalid route config', async () => {
    const routeConfigWithoutPath = {
      component: 'hello/world.js',
    } as RouteConfig;

    expect(loadRoutes([routeConfigWithoutPath])).rejects.toMatchInlineSnapshot(`
            [Error: Invalid routeConfig (Path and component is required) 
            {"component":"hello/world.js"}]
        `);

    const routeConfigWithoutComponent = {
      path: '/hello/world',
    } as RouteConfig;

    expect(loadRoutes([routeConfigWithoutComponent])).rejects
      .toMatchInlineSnapshot(`
            [Error: Invalid routeConfig (Path and component is required) 
            {"path":"/hello/world"}]
        `);
  });
});
