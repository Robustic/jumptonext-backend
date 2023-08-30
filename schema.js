const typeDefs = `
    type User {
        username: String!
        favouriteStops: [String!]!
        id: ID!
    }
      
    type Token {
        value: String!
    }
      
    type Stop {
        gtfsId: String!
        name: String!
        lat: Float!
        lon: Float!
        code: String
        zoneId: String
        vehicleType: Int!
        stoptimesWithoutPatterns: [StoptimesWithoutPatterns!]!
    }

    type Trip {
        id: String!
        routeShortName: String!
    }

    type StoptimesWithoutPatterns {
        scheduledArrival: Int!
        realtimeArrival: Int!
        arrivalDelay: Int!
        scheduledDeparture: Int!
        realtimeDeparture: Int!
        departureDelay: Int!
        realtime: Boolean!
        realtimeState: String!
        serviceDay: Int!
        headsign: String!
        trip: Trip
    }

    type Query {
        me: User
        stops: [Stop!]!
        stop(
            id: String!
        ): Stop
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
