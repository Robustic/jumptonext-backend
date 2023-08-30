const typeDefs = `
    type User {
        username: String!
        favouriteStops: [String!]!
        id: ID!
    }
      
    type Token {
        value: String!
    }

    type Query {
        me: User
    }

    type Mutation {
        createUser(
            username: String!
            password: String!
        ): User
        removeUser(
            username: String!
        ): User
        login(
            username: String!
            password: String!
        ): Token
        addFavouriteStop(
            newFavouriteStop: String!
        ): User
        removeFavouriteStop(
            favouriteStopToRemove: String!
        ): User
    }
`

module.exports = typeDefs
