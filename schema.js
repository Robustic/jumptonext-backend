const typeDefs = `
    type User {
        username: String!
        favouriteStops: [String!]!
        id: ID!
    }
      
    type Token {
        value: String!
    }
      
    type Sub {
        sub: String!
    }

    type Query {
        me: User
        sub: Sub
        allUsers: [User!]!
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
        removeAllUsers(
            removeUsersString: String!
        ): String
    }
`

module.exports = typeDefs
