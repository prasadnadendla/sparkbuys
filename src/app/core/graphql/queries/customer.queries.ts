import { gql } from 'apollo-angular';

export const GET_CUSTOMER = gql`
  query GetCustomer($token: String!) {
    customer(customerAccessToken: $token) {
      id
      firstName
      lastName
      email
      phone
      defaultAddress {
        id address1 address2 city province zip country phone firstName lastName
      }
      addresses(first: 10) {
        nodes { id address1 address2 city province zip country phone firstName lastName }
      }
      orders(first: 10, sortKey: PROCESSED_AT, reverse: true) {
        nodes {
          id
          orderNumber
          processedAt
          financialStatus
          fulfillmentStatus
          currentTotalPrice { amount currencyCode }
          statusUrl
          lineItems(first: 4) {
            nodes {
              title
              quantity
              variant { image { url altText } price { amount currencyCode } }
            }
          }
        }
      }
    }
  }
`;
