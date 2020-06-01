import Immutable from 'immutable';

export const types = {
    ADD_PLAYER: 'ADD_PLAYER',
    UPDATE_PLAYER: 'UPDATE_PLAYER',
    REMOVE_PLAYER: 'REMOVE_PLAYER',

    CLOSE_SCORING_ROUND: 'CLOSE_SCORING_ROUND',
    REOPEN_SCORING_ROUND: 'REOPEN_SCORING_ROUND',
    UPDATE_SCORING_ROUND: 'UPDATE_SCORING_ROUND',
    RESET_ROUND_SCORES: 'RESET_ROUND_SCORES',

    SET_GAME_TYPE: 'SET_GAME_TYPE',
    SET_BETTING_PHASE: 'SET_BETTING_PHASE',
    START_GAME: 'START_GAME',
    SET_DEALER: 'SET_DEALER',
};

export const actions = {
    addPlayer: () => ({
        type: types.ADD_PLAYER,
    }),
    removePlayer: id => ({
        type: types.REMOVE_PLAYER,
        id
    }),
    updatePlayer: (index, key, value) => ({
        type: types.UPDATE_PLAYER,
        key,
        index,
        value
    }),

    resetRoundScores: () => ({
        type: types.RESET_ROUND_SCORES
    }),
    closeRound: () => ({
        type: types.CLOSE_SCORING_ROUND
    }),
    reopenRound: index => ({
        type: types.REOPEN_SCORING_ROUND,
        index
    }),
    setBettingPhase: value => ({
        type: types.SET_BETTING_PHASE,
        value
    }),
    updateRound: (index, playerIndex, key, value) => ({
        type: types.UPDATE_SCORING_ROUND,
        key,
        index,
        playerIndex,
        value
    }),
    setGameType: gameType => ({
        type: types.SET_GAME_TYPE,
        gameType
    }),
    setDealer: index => ({
        type: types.SET_DEALER,
        index
    }),
    startGame: () => ({
        type: types.START_GAME
    })
};

const initialState = Immutable.fromJS({
    players: [{
        name: 'player 1',
        score: 0,
        dealer: false,
        prizes: [],
        penalities: []
    }, {
        name: 'player 2',
        score: 0,
        dealer: false,
        prizes: [],
        penalities: []
    }, {
        name: 'player 3',
        score: 0,
        dealer: false,
        prizes: [],
        penalities: []
    }],
    rounds: [],
    type: 'long',
    roundIndex: 0,
    dealer: 0, // player index
    firstPlayerIndex: 0,
});

const addPlayer = (state) => {
    const newPlayers = state.get('players');

    return state.set(
        'players',
        newPlayers.push(
            Immutable.fromJS({
                name: `player ${newPlayers.size + 1}`,
                score: 0,
                dealer: false
            })
        )
    );
};

const startGame = (state) => {
    const type = state.get('type');
    const players = state.get('players');
    let rounds = Immutable.List();

    const createRound = hands => Immutable.fromJS({
        hands,
        handsLeft: hands,
        scores: players.map(() => Immutable.fromJS({
            currentScore: 0,
            handsTaken: 0,
            bet: 0,
            plusStreak: 0,
            minusStreak: 0,
            prizes: [],
            penalities: [],
            betIn: false,
            scored: false,
            bettingPhase: false,
        }))
    });

    if (type === 'long') {
        // 8 card rounds
        for (let i = 0; i < players.size; i++) {
            rounds = rounds.push(createRound(8).set('bettingPhase', true));
        }
        // 7 through 2 card rounds
        for (let i = 7; i > 1; i--) {
            rounds = rounds.push(createRound(i));
        }
        // 1 card rounds
        for (let i = 0; i < players.size; i++) {
            rounds = rounds.push(createRound(1));
        }
        // 2 through 7 card rounds
        for (let i = 2; i < 8; i++) {
            rounds = rounds.push(createRound(i));
        }
        // 8 card rounds
        for (let i = 0; i < players.size; i++) {
            rounds = rounds.push(createRound(8));
        }
    } else {
        // 1 card rounds
        for (let i = 0; i < players.size; i++) {
            rounds = rounds.push(createRound(1).set('bettingPhase', true));
        }
        // 2 through 7 card rounds
        for (let i = 2; i < 8; i++) {
            rounds = rounds.push(createRound(i));
        }
        // 8 card rounds
        for (let i = 0; i < players.size; i++) {
            rounds = rounds.push(createRound(8));
        }
        // 7 through 2 card rounds
        for (let i = 7; i > 1; i--) {
            rounds = rounds.push(createRound(i));
        }
        // 1 card rounds
        for (let i = 0; i < players.size; i++) {
            rounds = rounds.push(createRound(1));
        }
    }

    return state.set('rounds', rounds);
};

const closeRound = state => {
    const rounds = state.get('rounds');
    const players = state.get('players');
    const current = state.get('roundIndex');
    let currentRound = state.getIn(['rounds', current]);
    let newState = state;

    for (let i = 0; i < currentRound.get('scores').size; i++) {
        const currentPlusStreak = state.getIn(['rounds', current === 0 ? 0 : current - 1, 'scores', i, 'plusStreak']);
        const currentMinusStreak = state.getIn(['rounds', current === 0 ? 0 : current - 1, 'scores', i, 'minusStreak']);
        const isRoundSafe = currentRound.getIn(['scores', i, 'handsTaken']) === currentRound.getIn(['scores', i, 'bet']);
        
        if (isRoundSafe) {
            currentRound = currentRound
                .setIn(['scores', i, 'minusStreak'], 0)
                .updateIn(['scores', i, 'plusStreak'], streak => streak === 1 ? 0 : (streak + 1)); // TODO: replace 1 with 4
        } else {
            currentRound = currentRound
                .setIn(['scores', i, 'plusStreak'], 0)
                .updateIn(['scores', i, 'minusStreak'], streak => streak === 1 ? 0 : (streak + 1));
        }
        if (currentPlusStreak === 4) {
            newState = newState.updateIn(['rounds', current, 'scores', i, 'currentScore'], cs => cs + 10);
        }
        if (currentMinusStreak === 4) {
            newState = newState.updateIn(['rounds', current, 'scores', i, 'currentScore'], cs => cs - 10);
        }
    }

    if (current < rounds.size - 1) {
        return newState
            .set('roundIndex', current + 1)
            .update('dealer', d => d === players.size - 1 ? 0 : (d + 1))
            .setIn(['rounds', current], currentRound)
            // .updateIn(['players', playerIndex, 'prizes'], p => currentPlusStreak === 4 ? p.push(index) : p)
            // .updateIn(['players', playerIndex, 'penalities'], p => currentMinusStreak === 4 ? p.push(index) : p)
            .setIn(['rounds', current + 1, 'bettingPhase'], true);
    } else {
        return newState.setIn(['rounds', current], currentRound);
    }
};

const updateRound = (state, action) => {
    const { key, index, playerIndex, value } = action;

    if (key === 'bet') {
        return state
            .setIn(['rounds', index, 'scores', playerIndex, key], value)
            .setIn(['rounds', index, 'scores', playerIndex, 'betIn'], true);
    } else {
        const bet = state.getIn(['rounds', index, 'scores', playerIndex, 'bet']);
        const handsLeft = state.getIn(['rounds', index, 'handsLeft']);
        const lastRoundTotalScore = index === 0 ? 0 : state.getIn(['rounds', index - 1, 'scores', playerIndex, key]);
        const currentRoundScore = index === 0 ? 0 : state.getIn(['rounds', index - 1, 'scores', playerIndex, 'handsTaken']);
        const currentScoreSum = state.getIn(['rounds', index, 'scores']).reduce((acc, data) => {
            return acc + data.get('handsTaken');
        }, 0);
        const roundHands = state.getIn(['rounds', index, 'hands']);
        const valueIsValid = handsLeft - value >= 0;
        const remainingHands = roundHands - value - currentScoreSum + currentRoundScore;
        const currentPlusStreak = state.getIn(['rounds', index, 'scores', playerIndex, 'plusStreak']);
        const currentMinusStreak = state.getIn(['rounds', index, 'scores', playerIndex, 'minusStreak']);

        if (bet === value) {
            return state.updateIn(
                    ['rounds', index, 'scores', playerIndex, 'currentScore'],
                    cs => valueIsValid ? (lastRoundTotalScore + value + 5 + (currentPlusStreak === 4 ? 10 : 0)) : cs
                )
                .updateIn(['rounds', index, 'handsLeft'], points => valueIsValid ? remainingHands : points)
                .setIn(['rounds', index, 'scores', playerIndex, 'handsTaken'], value)
                .updateIn(['players', playerIndex, 'prizes'], p => currentPlusStreak === 4 ? p.push(index) : p)
                .setIn(['rounds', index, 'scores', playerIndex, 'scored'], valueIsValid);
        } else {
            return state.updateIn(
                    ['rounds', index, 'scores', playerIndex, 'currentScore'],
                    cs => valueIsValid ? (lastRoundTotalScore - Math.abs(value - bet) - (currentMinusStreak === 4 ? 10 : 0)) : cs
                )
                .updateIn(['rounds', index, 'handsLeft'], points => valueIsValid ? remainingHands : points)
                .setIn(['rounds', index, 'scores', playerIndex, 'handsTaken'], value)
                .updateIn(['players', playerIndex, 'penalities'], p => currentMinusStreak === 4 ? p.push(index) : p)
                .setIn(['rounds', index, 'scores', playerIndex, 'scored'], valueIsValid);
        }
    }
};

const resetRoundScores = state => {
    const roundIndex = state.get('roundIndex');
    let round = state.getIn(['rounds', roundIndex]);
    const rank = round.get('scores').size;

    for (let i = 0; i < rank; i++) {
        round = round
            .setIn(['scores', i, 'handsTaken'], 0)
            .setIn(['scores', i, 'currentScore'], roundIndex === 0 ? 0 : state.getIn(['rounds', roundIndex - 1, 'scores', i, 'currentScore']));
    }

    return state.setIn(['rounds', roundIndex], round);
};

const reopenRound = (state, action) => {
    const players = state.get('players');

    return state
        .set('roundIndex', action.index)
        .update('dealer', d => d === 0 ? (players.size - 1) : (d - 1));
};

const game = (state = initialState, action) => {
    switch(action.type) {
        case types.ADD_PLAYER:
            return addPlayer(state, action);
        case types.UPDATE_PLAYER:
            return state.setIn(['players', action.index, action.key], action.value);
        case types.REMOVE_PLAYER:
            return state.update('players', players => players.delete(action.id));
        case types.SET_GAME_TYPE:
            return state.set('type', action.gameType);
        case types.RESET_ROUND_SCORES:
            return resetRoundScores(state, action);
        case types.SET_BETTING_PHASE:
            return state.setIn(['rounds', state.get('roundIndex'), 'bettingPhase'], action.value);
        case types.START_GAME:
            return startGame(state, action);
        case types.CLOSE_SCORING_ROUND:
            return closeRound(state, action);
        case types.UPDATE_SCORING_ROUND:
            return updateRound(state, action);
        case types.REOPEN_SCORING_ROUND:
            return reopenRound(state, action);
        case types.SET_DEALER:
            return state.set('dealer', action.index);
        default:
            return state;
    }
};

export const selectors = {
    getPlayers: state => state.game.get('players'),
    getRounds: state => state.game.get('rounds'),
    getType: state => state.game.get('type'),
    getDealer: state => state.game.get('dealer'),
    getRoundIndex: state => state.game.get('roundIndex'),
    getCurrentRound: state => state.game.getIn(['rounds', state.game.get('roundIndex')]),
    getFirstPlayerIndex: state => state.game.get('firstPlayerIndex'),
    getBetSum: state => {
        const round = state.game.getIn(['rounds', state.game.get('roundIndex')]);
        const betSum = round.get('scores').reduce((accum, data) => {
            return accum + data.get('bet');
        }, 0);

        return betSum;
    }
};

export default game;