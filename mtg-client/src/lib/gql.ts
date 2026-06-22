import { GraphQLClient } from 'graphql-request';

const API_URL = 'http://localhost:4000/';

export function getClient() {
  const token = localStorage.getItem('token');
  return new GraphQLClient(API_URL, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}