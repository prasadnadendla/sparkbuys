import { gql } from 'apollo-angular';
import { PRODUCT_CARD_FRAGMENT } from './product.queries';

export const SEARCH_PRODUCTS = gql`
  ${PRODUCT_CARD_FRAGMENT}
  query SearchProducts($query: String!, $first: Int!) {
    search(query: $query, first: $first, types: PRODUCT) {
      nodes {
        ... on Product { ...ProductCard }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;
