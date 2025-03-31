import { Card, Hand, Rank, Suit, HandType } from '../types';

// Create a full deck of 52 cards
export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  const ranks: Rank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const suits: Suit[] = ['h', 'd', 'c', 's'];

  for (const suit of suits) {
    for (const rank of ranks) {
      // Calculate value: 2-14, where 14 is Ace
      const value = rank === 'A' ? 14 :
                    rank === 'K' ? 13 :
                    rank === 'Q' ? 12 :
                    rank === 'J' ? 11 :
                    rank === 'T' ? 10 :
                    parseInt(rank);
      deck.push({ rank, suit, value });
    }
  }

  return deck;
};

// Shuffle deck using Fisher-Yates algorithm
export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Deal a hand (2 cards) from a deck
export const dealHand = (deck: Card[]): [Hand, Card[]] => {
  if (deck.length < 2) {
    throw new Error('Not enough cards in deck to deal a hand');
  }
  
  const newDeck = [...deck];
  const card1 = newDeck.pop()!;
  const card2 = newDeck.pop()!;
  const hand: Hand = { card1, card2 };
  
  return [hand, newDeck];
};

// Convert a hand to a standard poker notation (e.g., "AKs", "JTo")
export const getHandName = (input: Hand | Card[]): string => {
  let card1: Card, card2: Card;
  
  if (Array.isArray(input)) {
    if (input.length < 2) {
      throw new Error('Need at least 2 cards to get hand name');
    }
    card1 = input[0];
    card2 = input[1];
  } else {
    card1 = input.card1;
    card2 = input.card2;
  }
  
  // Sort cards by rank (A is highest, 2 is lowest)
  const ranks: Rank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const card1RankIndex = ranks.indexOf(card1.rank);
  const card2RankIndex = ranks.indexOf(card2.rank);
  
  let firstCard: Card, secondCard: Card;
  
  if (card1RankIndex <= card2RankIndex) { // Lower index means higher rank
    firstCard = card1;
    secondCard = card2;
  } else {
    firstCard = card2;
    secondCard = card1;
  }
  
  // Determine hand type (suited or offsuit)
  const samesuit = firstCard.suit === secondCard.suit;
  const suffix = firstCard.rank === secondCard.rank ? '' : (samesuit ? 's' : 'o');
  
  return `${firstCard.rank}${secondCard.rank}${suffix}`;
};

// Parse a hand name (e.g., "AKs") into a Hand object
export const parseHandName = (handName: string): HandType => {
  if (handName.length === 2) {
    // Pair (e.g., "AA")
    return 'pair';
  } else if (handName.endsWith('s')) {
    // Suited (e.g., "AKs")
    return 'suited';
  } else if (handName.endsWith('o')) {
    // Offsuit (e.g., "AKo")
    return 'offsuit';
  }
  
  throw new Error(`Invalid hand name: ${handName}`);
};

// Get the full card name (e.g., "Ace of Hearts")
export const getCardName = (card: Card): string => {
  const rankNames: Record<Rank, string> = {
    'A': 'Ace',
    'K': 'King',
    'Q': 'Queen',
    'J': 'Jack',
    'T': '10',
    '9': '9',
    '8': '8',
    '7': '7',
    '6': '6',
    '5': '5',
    '4': '4',
    '3': '3',
    '2': '2'
  };
  
  const suitNames: Record<Suit, string> = {
    'h': 'Hearts',
    'd': 'Diamonds',
    'c': 'Clubs',
    's': 'Spades'
  };
  
  return `${rankNames[card.rank]} of ${suitNames[card.suit]}`;
};

// Get the CSS class for a card based on its suit
export const getCardClass = (card: Card): string => {
  const suitClasses: Record<Suit, string> = {
    'h': 'card-hearts',
    'd': 'card-diamonds',
    'c': 'card-clubs',
    's': 'card-spades'
  };
  
  return `card ${suitClasses[card.suit]}`;
};

// Get the SVG icon name for a suit
export const getSuitIcon = (suit: Suit): string => {
  const suitIcons: Record<Suit, string> = {
    'h': 'heart',
    'd': 'diamond',
    'c': 'club',
    's': 'spade'
  };
  
  return `/assets/images/card-suits/${suitIcons[suit]}.svg`;
}; 