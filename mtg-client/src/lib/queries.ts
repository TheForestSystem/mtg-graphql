export const LOGIN = `
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      user { uuid username displayName }
    }
  }
`;

export const GET_DECKS = `
  query {
    decks {
      id
      name
      format
      createdAt
    }
  }
`;

export const GET_DECK = `
  query GetDeck($id: String!) {
    deck(id: $id) {
      id
      name
      format
      cards {
        id
        quantity
        isSideboard
        isCommander
        card {
          uuid
          name
          manaCost
          type
          rarity
          setCode
          imageUrl
        }
      }
    }
  }
`;

export const CREATE_DECK = `
  mutation CreateDeck($name: String!, $format: String) {
    createDeck(name: $name, format: $format) {
      id
      name
      format
    }
  }
`;

export const UPDATE_QUANTITY = `
  mutation UpdateQuantity($deckCardId: String!, $quantity: Int!) {
    updateDeckCardQuantity(deckCardId: $deckCardId, quantity: $quantity) {
      id
      quantity
    }
  }
`;

export const DELETE_DECK = `
  mutation DeleteDeck($id: String!) {
    deleteDeck(id: $id)
  }
`;

export const SET_COMMANDER = `
  mutation SetCommander($deckCardId: String!, $isCommander: Boolean!) {
    setCommander(deckCardId: $deckCardId, isCommander: $isCommander) {
      id
      isCommander
    }
  }
`;

export const SEARCH_CARDS = `
  query SearchCards($name: String) {
    cards(filter: { name: $name }, limit: 20) {
      uuid
      name
      manaCost
      type
      rarity
      setCode
      imageUrl
    }
  }
`;

export const ADD_CARD = `
  mutation AddCard($deckId: String!, $cardUuid: String!, $quantity: Int, $isSideboard: Boolean, $isCommander: Boolean) {
    addCardToDeck(deckId: $deckId, cardUuid: $cardUuid, quantity: $quantity, isSideboard: $isSideboard, isCommander: $isCommander) {
      id
    }
  }
`;

export const REMOVE_CARD = `
  mutation RemoveCard($deckCardId: String!) {
    removeCardFromDeck(deckCardId: $deckCardId)
  }
`;