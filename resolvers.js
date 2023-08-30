const bcrypt = require('bcrypt')
const { GraphQLError } = require('graphql')
const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()
const jwt = require('jsonwebtoken')
const fetch = require('node-fetch')

const User = require('./models/user')

require('dotenv').config()

const resolvers = {
    Query: {
        me: (root, args, context) => {
            return context.currentUser
        },
        stops: async (root, args) => {
            console.log('hello 1')
            const query = `
                query {
                    stops {
                        gtfsId
                        name
                        lat
                        lon
                        code
                        zoneId
                        vehicleType
                    }
                }
            `
            console.log('hello 2')
            const response = await fetch(
                'https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/graphql',
                        'digitransit-subscription-key':
                            process.env.DIGI_TRANSIT_SUBSCRIPTION,
                    },
                    body: JSON.stringify({
                        query,
                    }),
                },
            )
            console.log('hello 3')
            console.log(response)
            const stopsJson = await response.json()
            console.log('hello 4')
            console.log('number of stops:', stopsJson.data.stops.length)
            console.log('hello 5')
            return stopsJson.data.stops
        },
        stop: async (root, args) => {
            const query = `
                query getStop($idToSearch: String!) {
                    stop(id: $idToSearch) {
                        name
                        gtfsId
                        code
                        lat
                        lon
                        zoneId
                        vehicleType
                        stoptimesWithoutPatterns {
                            scheduledArrival
                            realtimeArrival
                            arrivalDelay
                            scheduledDeparture
                            realtimeDeparture
                            departureDelay
                            realtime
                            realtimeState
                            serviceDay
                            headsign
                            trip {
                                id
                                routeShortName
                            }
                        }
                    }
                }
            `
            console.log(args.idToSearch)
            const response = await fetch(
                'https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql',
                {
                    method: 'POST',
                    headers: {
                        mode: 'no-cors',
                        'Content-Type': 'application/json',
                        'digitransit-subscription-key':
                            process.env.DIGI_TRANSIT_SUBSCRIPTION,
                    },
                    body: JSON.stringify({
                        query,
                        variables: { idToSearch: args.id },
                    }),
                },
            )

            const stopsJson = await response.json()
            console.log(stopsJson.data.stop)
            return stopsJson.data.stop
        },
    },
    Mutation: {
        createUser: async (root, args) => {
            const userAlreadyInDb = await User.findOne({
                username: args.username,
            })

            if (userAlreadyInDb) {
                throw new GraphQLError('username already in use', {
                    extensions: {
                        code: 'BAD_USER_INPUT',
                    },
                })
            }

            const saltRounds = 10
            const passwordHash = await bcrypt.hash(args.password, saltRounds)

            const user = new User({
                username: args.username,
                passwordHash: passwordHash,
                favouriteStops: [],
            })

            return user.save().catch((error) => {
                throw new GraphQLError('Creating the user failed', {
                    extensions: {
                        code: 'BAD_USER_INPUT',
                        error,
                    },
                })
            })
        },
        removeUser: async (root, args, context) => {
            const currentUser = await context.currentUser

            if (!currentUser) {
                throw new GraphQLError('not logged in', {
                    extensions: {
                        code: 'NOT_LOGGED_IN',
                    },
                })
            }

            const userInDb = await User.findOne({
                username: currentUser.username,
            })

            if (!userInDb || userInDb.username !== args.username) {
                throw new GraphQLError('username not found', {
                    extensions: {
                        code: 'BAD_USER_INPUT',
                    },
                })
            }

            return User.findByIdAndRemove(userInDb.id).catch((error) => {
                throw new GraphQLError('Removing the user failed', {
                    extensions: {
                        code: 'BAD_USER_INPUT',
                        error,
                    },
                })
            })
        },
        login: async (root, args) => {
            console.log('terve 1')
            const user = await User.findOne({ username: args.username })
            console.log('terve 2')

            const passwordCorrect =
                user === null
                    ? false
                    : await bcrypt.compare(args.password, user.passwordHash)

            console.log('terve 3')

            if (!user || !passwordCorrect) {
                throw new GraphQLError('wrong credentials', {
                    extensions: {
                        code: 'BAD_USER_INPUT',
                    },
                })
            }
            console.log('terve 4')

            const userForToken = {
                username: user.username,
                id: user._id,
            }
            console.log('terve 5')

            return {
                value: jwt.sign(userForToken, process.env.JWT_SECRET),
            }
        },
        addFavouriteStop: async (root, args, context) => {
            const currentUser = await context.currentUser

            if (!currentUser) {
                throw new GraphQLError('not logged in', {
                    extensions: {
                        code: 'NOT_LOGGED_IN',
                    },
                })
            }

            const userInDb = await User.findOne({
                username: currentUser.username,
            })

            if (userInDb.favouriteStops.includes(args.newFavouriteStop)) {
                throw new GraphQLError(
                    'stop already added to favourite stops',
                    {
                        extensions: {
                            code: 'BAD_USER_INPUT',
                        },
                    },
                )
            }

            userInDb.favouriteStops = userInDb.favouriteStops.concat(
                args.newFavouriteStop,
            )

            return userInDb.save().catch((error) => {
                throw new GraphQLError('Cannot add new favourite stop', {
                    extensions: {
                        code: 'BAD_USER_INPUT',
                        error,
                    },
                })
            })
        },
        removeFavouriteStop: async (root, args, context) => {
            const currentUser = await context.currentUser

            if (!currentUser) {
                throw new GraphQLError('not logged in', {
                    extensions: {
                        code: 'NOT_LOGGED_IN',
                    },
                })
            }

            const userInDb = await User.findOne({
                username: currentUser.username,
            })

            if (!userInDb.favouriteStops.includes(args.favouriteStopToRemove)) {
                throw new GraphQLError('stop not found in favourite stops', {
                    extensions: {
                        code: 'BAD_USER_INPUT',
                    },
                })
            }

            userInDb.favouriteStops = userInDb.favouriteStops.filter(
                (s) => s !== args.favouriteStopToRemove,
            )

            return userInDb.save().catch((error) => {
                throw new GraphQLError('Cannot remove favourite stop', {
                    extensions: {
                        code: 'BAD_USER_INPUT',
                        error,
                    },
                })
            })
        },
    },
}

module.exports = resolvers
