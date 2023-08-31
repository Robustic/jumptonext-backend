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
        sub: (root, args, context) => {
            const sub = { sub: process.env.SUB }
            return sub
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
            const user = await User.findOne({ username: args.username })

            const passwordCorrect =
                user === null
                    ? false
                    : await bcrypt.compare(args.password, user.passwordHash)

            if (!user || !passwordCorrect) {
                throw new GraphQLError('wrong credentials', {
                    extensions: {
                        code: 'BAD_USER_INPUT',
                    },
                })
            }

            const userForToken = {
                username: user.username,
                id: user._id,
            }

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
