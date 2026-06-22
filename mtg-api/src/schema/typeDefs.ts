export const typeDefs = `#graphql
  """A Magic: The Gathering card printing. Represents a specific physical printing of a card in a set."""
  type Card {
    """Unique identifier for this specific printing (MTGJSON UUID)"""
    uuid: String!
    """Card name as printed"""
    name: String
    """Mana cost string e.g. {2}{W}{W}"""
    manaCost: String
    """Converted mana cost / mana value as a number"""
    manaValue: Float
    """Colors the card is (W, U, B, R, G)"""
    colors: [String!]
    """Color identity for Commander deckbuilding (includes pip colors in rules text)"""
    colorIdentity: [String!]
    """Full type line e.g. Legendary Creature — Human Soldier"""
    type: String
    """Oracle rules text"""
    text: String
    """Power (creatures only)"""
    power: String
    """Toughness (creatures only)"""
    toughness: String
    """Loyalty (planeswalkers only)"""
    loyalty: String
    """Rarity: common, uncommon, rare, mythic"""
    rarity: String
    """The set this printing belongs to"""
    setCode: String
    """Collector number within the set"""
    number: String
    """Comma-separated keywords e.g. Flying, Vigilance"""
    keywords: String
    """Card layout type e.g. normal, transform, modal_dfc, adventure"""
    layout: String
    """The set this card was printed in"""
    set: Set
    """Format legality for this card"""
    legalities: CardLegalities
    """External identifiers (Scryfall, TCGPlayer, etc.)"""
    identifiers: CardIdentifiers
    """Official rulings for this card"""
    rulings: [CardRuling!]
    """Purchase URLs for this printing"""
    purchaseUrls: CardPurchaseUrls
    """Full card image URL from Scryfall (normal size)"""
    imageUrl: String
    """Art crop image URL from Scryfall"""
    imageUrlCrop: String
  }

  """A Magic: The Gathering set or expansion"""
  type Set {
    """Three to five letter set code e.g. MH2, DMU"""
    code: String!
    """Full set name e.g. Modern Horizons 2"""
    name: String
    """Release date (YYYY-MM-DD)"""
    releaseDate: String
    """Set type e.g. expansion, commander, masters, core"""
    type: String
    """Total number of cards including extras"""
    totalSetSize: Int
    """Number of cards in the main set (excludes extras like promos)"""
    baseSetSize: Int
  }

  """Format legality for a card. Values are 'Legal', 'Banned', 'Restricted', or 'Not Legal'"""
  type CardLegalities {
    standard: String
    pioneer: String
    modern: String
    legacy: String
    vintage: String
    commander: String
    pauper: String
    historic: String
    timeless: String
  }

  """External identifiers for a card across various platforms"""
  type CardIdentifiers {
    """Scryfall's unique ID for this printing — used to build image URLs"""
    scryfallId: String
    """Scryfall's Oracle ID — same across all printings of the same card"""
    scryfallOracleId: String
    """Scryfall's illustration ID — same across printings that share artwork"""
    scryfallIllustrationId: String
    """Scryfall's card back ID"""
    scryfallCardBackId: String
    """TCGPlayer product ID for this printing"""
    tcgplayerProductId: String
    """TCGPlayer etched foil product ID"""
    tcgplayerEtchedProductId: String
    """Card Kingdom product ID"""
    cardKingdomId: String
    """Card Kingdom foil product ID"""
    cardKingdomFoilId: String
    """MTG Arena card ID"""
    mtgArenaId: String
    """MTGO card ID"""
    mtgoId: String
    """MTGO foil card ID"""
    mtgoFoilId: String
    """Multiverse ID (Gatherer)"""
    multiverseId: String
  }

  """An official ruling on a card from Wizards of the Coast"""
  type CardRuling {
    """Date the ruling was issued (YYYY-MM-DD)"""
    date: String
    """Ruling text"""
    text: String
  }

  """Purchase URLs for a specific card printing"""
  type CardPurchaseUrls {
    """TCGPlayer listing URL"""
    tcgplayer: String
    """Card Kingdom listing URL"""
    cardKingdom: String
    """Cardmarket listing URL (European market)"""
    cardmarket: String
  }

  """A user-created deck"""
  type Deck {
    """Unique deck ID"""
    id: String!
    """Deck owner's user profile"""
    owner: UserProfile!
    """Deck name"""
    name: String!
    """Format e.g. commander, standard, modern"""
    format: String
    """When the deck was created"""
    createdAt: String!
    """Cards in this deck"""
    cards: [DeckCard!]
  }

  """A card entry within a deck"""
  type DeckCard {
    """Unique entry ID"""
    id: String!
    """UUID of the card printing"""
    cardUuid: String!
    """Number of copies"""
    quantity: Int!
    """Whether this card is in the sideboard"""
    isSideboard: Boolean!
    """Whether this card is the commander (for commander decks)"""
    isCommander: Boolean!
    """Full card data for this entry"""
    card: Card
  }

  """A card entry in the user's collection"""
  type CollectionEntry {
    """Unique entry ID"""
    id: String!
    """UUID of the card printing"""
    cardUuid: String!
    """Number of copies owned"""
    quantity: Int!
    """Whether this copy is a foil"""
    foil: Boolean!
    """Full card data for this entry"""
    card: Card
  }

  """Filters for searching cards. Color strings are W U B R G.
  Prefix a color with - to exclude it e.g. [\\"W\\", \\"-B\\"] means white but not black."""
  input CardFilter {
    """Search by card name (case insensitive, partial match)"""
    name: String
    """Filter by colors. Use - prefix to exclude e.g. [W, -B, -U, -R, -G] for mono-white only"""
    colors: [String!]
    """Filter by color identity (Commander deckbuilding)"""
    colorIdentity: [String!]
    """Exact mana value"""
    manaValue: Float
    """Mana value less than or equal to"""
    manaValueLte: Float
    """Mana value greater than or equal to"""
    manaValueGte: Float
    """Filter by rarity: common, uncommon, rare, mythic"""
    rarity: String
    """Filter by set code e.g. MH2"""
    setCode: String
    """Filter by format legality e.g. commander, modern"""
    format: String
    """Filter by type line (partial match) e.g. Creature, Legendary"""
    type: String
    """Filter by rules text (partial match)"""
    text: String
  }

  """Filters for searching sets"""
  input SetFilter {
    """Search by set name (case insensitive, partial match) e.g. Modern Horizons"""
    name: String
    """Filter by set code (exact match) e.g. MH2"""
    code: String
    """Filter by set type e.g. expansion, commander, masters, core, draft_innovation"""
    type: String
    """Sets released on or after this date (YYYY-MM-DD)"""
    releasedAfter: String
    """Sets released on or before this date (YYYY-MM-DD)"""
    releasedBefore: String
    """Exclude sets that are online only"""
    excludeOnlineOnly: Boolean
    """Exclude sets that are paper only"""
    excludePaperOnly: Boolean
    """Exclude promo sets"""
    excludePromos: Boolean
    """Minimum total set size (including extras)"""
    minTotalSetSize: Int
    """Maximum total set size (including extras)"""
    maxTotalSetSize: Int
  }

  type Query {
    """Fetch a single card by its MTGJSON UUID"""
    card(uuid: String!): Card
    """Search and filter cards. Defaults to limit 20, offset 0."""
    cards(filter: CardFilter, limit: Int, offset: Int): [Card!]!
    """Fetch a single set by its set code e.g. MH2"""
    set(code: String!): Set
    """List and filter sets, ordered by release date descending"""
    sets(filter: SetFilter, limit: Int, offset: Int): [Set!]!
    """Fetch a single deck by ID"""
    deck(id: String!): Deck
    """List all decks"""
    decks: [Deck!]!
    """List all cards in the collection"""
    collection: [CollectionEntry!]!
    """ Fetch the authenticated user's profile"""
    me: UserProfile
    """ Search for a user by username"""
    user(username: String!): UserProfile
  }

    """Returned after successful login or registration"""
  type AuthPayload {
    """JWT token to use in Authorization header"""
    token: String!
    """The authenticated user"""
    user: UserProfile!
  }

  """Public user profile"""
  type UserProfile {
    uuid: String!
    username: String!
    displayName: String
  }

  type Mutation {
    """Create a new deck"""
    createDeck(name: String!, format: String): Deck!
    """Add a card to a deck. Quantity defaults to 1."""
    addCardToDeck(deckId: String!, cardUuid: String!, quantity: Int, isSideboard: Boolean, isCommander: Boolean): DeckCard!
    """Remove a card entry from a deck by its DeckCard ID"""
    removeCardFromDeck(deckCardId: String!): Boolean!
    """Add a card to the collection. Quantity defaults to 1, foil defaults to false."""
    addToCollection(cardUuid: String!, quantity: Int, foil: Boolean): CollectionEntry!
    """Remove a collection entry by its ID"""
    removeFromCollection(id: String!): Boolean!
    """Register a new user account"""
    register(username: String!, email: String!, password: String!, displayName: String): AuthPayload!
    """Login with username and password"""
    login(username: String!, password: String!): AuthPayload!
    """Set or unset a card as the commander in a commander deck"""
    setCommander(deckCardId: String!, isCommander: Boolean!): DeckCard!
    """Update the quantity of a card entry in a deck"""
    updateDeckCardQuantity(deckCardId: String!, quantity: Int!): DeckCard!
  }  
`;