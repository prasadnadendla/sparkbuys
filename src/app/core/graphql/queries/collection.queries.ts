import { gql } from 'apollo-angular';
import { PRODUCT_CARD_FRAGMENT } from './product.queries';

export const GET_COLLECTIONS = gql`
  query GetCollections($first: Int!) {
    collections(first: $first) {
      nodes {
        id
        title
        handle
        description
        image { url altText }
        products(first: 4) {
          nodes { id featuredImage { url altText } }
        }
      }
    }
  }
`;

export const GET_COLLECTION = gql`
  ${PRODUCT_CARD_FRAGMENT}
  query GetCollection($handle: String!, $first: Int!, $after: String, $sortKey: ProductCollectionSortKeys, $reverse: Boolean) {
    collection(handle: $handle) {
      id
      title
      handle
      description
      seo { title description }
      image { url altText }
      products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
        pageInfo { hasNextPage endCursor }
        nodes { ...ProductCard }
      }
    }
  }
`;
