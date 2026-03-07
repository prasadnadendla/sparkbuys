import { ApplicationConfig, provideZonelessChangeDetection, isDevMode, PLATFORM_ID } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { provideClientHydration, withIncrementalHydration } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { Apollo, APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache, ApolloLink } from '@apollo/client/core';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideClientHydration(withIncrementalHydration()),
    provideHttpClient(withFetch()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    {
      provide: APOLLO_OPTIONS,
      useFactory: (httpLink: HttpLink, platformId: object) => {
        const isBrowser = isPlatformBrowser(platformId);

        const cache = new InMemoryCache({
          typePolicies: {
            Query: {
              fields: {
                products: { keyArgs: ['query', 'sortKey', 'reverse'] },
                collection: { keyArgs: ['handle'] },
              },
            },
          },
        });

        // Shopify Storefront API link — public token, no user auth needed
        const shopifyLink = new ApolloLink((operation, forward) => {
          operation.setContext(({ headers = {} }: { headers?: Record<string, string> }) => ({
            headers: {
              ...headers,
              'X-Shopify-Storefront-Access-Token': environment.shopifyStorefrontToken,
              'Content-Type': 'application/json',
            },
          }));
          return forward(operation);
        });

        const shopifyEndpoint = `https://${environment.shopifyDomain}/api/${environment.shopifyApiVersion}/graphql.json`;
        const http = httpLink.create({ uri: shopifyEndpoint });

        return {
          link: shopifyLink.concat(http),
          cache,
          ssrMode: !isBrowser,
          defaultOptions: {
            watchQuery: { fetchPolicy: 'cache-and-network' },
            query: { fetchPolicy: 'cache-first' },
          },
        };
      },
      deps: [HttpLink, PLATFORM_ID],
    },
    Apollo,
  ],
};
